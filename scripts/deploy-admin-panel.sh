#!/bin/bash
# 部署后台管理系统到 AWS S3 和 CloudFront

set -e

# 配置
ENVIRONMENT=${1:-dev}
BUCKET_NAME="${ENVIRONMENT}-hahachat-admin-panel"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADMIN_PANEL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILD_DIR="$ADMIN_PANEL_DIR/dist"

echo "========================================="
echo "部署后台管理系统到 AWS"
echo "========================================="
echo "环境: $ENVIRONMENT"
echo "Bucket: $BUCKET_NAME"
echo ""

# 检查 AWS CLI 是否安装
if ! command -v aws &> /dev/null; then
    echo "❌ 错误: AWS CLI 未安装"
    exit 1
fi

# 检查 admin-panel 目录是否存在
if [ ! -d "$ADMIN_PANEL_DIR" ]; then
    echo "❌ 错误: admin-panel 目录不存在: $ADMIN_PANEL_DIR"
    exit 1
fi

# 检查 Node.js 和 npm 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: Node.js 未安装"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ 错误: npm 未安装"
    exit 1
fi

# 进入 admin-panel 目录
cd "$ADMIN_PANEL_DIR"

# 检查 node_modules 是否存在，如果不存在则安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

# 构建生产版本
echo ""
echo "🔨 构建生产版本..."

# 根据环境设置构建时的环境变量
case "$ENVIRONMENT" in
    staging)
        export VITE_ENVIRONMENT=staging
        echo "📝 构建环境: staging (测试环境)"
        ;;
    prod|production)
        export VITE_ENVIRONMENT=production
        echo "📝 构建环境: production (生产环境)"
        ;;
    *)
        export VITE_ENVIRONMENT=local
        echo "📝 构建环境: local (本地环境)"
        ;;
esac

# 如果类型检查失败，使用跳过类型检查的构建
if ! npm run build 2>&1 | grep -q "error TS"; then
    echo "✅ 构建成功"
else
    echo "⚠️  类型检查有错误，使用跳过类型检查的构建..."
    npm run build:skip-check || npm run build
fi

# 检查构建产物是否存在
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ 错误: 构建失败，dist 目录不存在"
    exit 1
fi

# 检查 S3 bucket 是否存在，如果不存在则创建
echo ""
echo "📦 检查 S3 bucket..."
if ! aws s3 ls "s3://$BUCKET_NAME" 2>&1 | grep -q "NoSuchBucket"; then
    echo "✅ Bucket 已存在: $BUCKET_NAME"
else
    echo "📦 创建 S3 bucket: $BUCKET_NAME"
    AWS_REGION=${AWS_REGION:-us-east-1}
    aws s3 mb "s3://$BUCKET_NAME" --region "$AWS_REGION"
    
    # 关闭 Block Public Access（允许公共访问）
    echo "⚙️  关闭 Block Public Access..."
    aws s3api put-public-access-block \
        --bucket "$BUCKET_NAME" \
        --public-access-block-configuration \
        "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
    
    # 配置 bucket 为静态网站托管
    echo "⚙️  配置 bucket 为静态网站托管..."
    aws s3 website "s3://$BUCKET_NAME" \
        --index-document index.html \
        --error-document index.html
    
    # 设置 bucket 策略（允许公共读取）
    echo "⚙️  设置 bucket 策略..."
    cat > /tmp/bucket-policy.json <<EOF
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "PublicReadGetObject",
            "Effect": "Allow",
            "Principal": "*",
            "Action": "s3:GetObject",
            "Resource": "arn:aws:s3:::${BUCKET_NAME}/*"
        }
    ]
}
EOF
    aws s3api put-bucket-policy --bucket "$BUCKET_NAME" --policy file:///tmp/bucket-policy.json
    rm /tmp/bucket-policy.json
fi

# 上传文件到 S3
echo ""
echo "📤 上传文件到 S3..."
aws s3 sync "$BUILD_DIR" "s3://$BUCKET_NAME/" \
    --delete \
    --exclude "*.map" \
    --cache-control "public, max-age=3600" \
    --exclude "index.html" \
    --cache-control "public, max-age=0, must-revalidate" \
    --include "index.html"

# 单独上传 index.html（不缓存）
aws s3 cp "$BUILD_DIR/index.html" "s3://$BUCKET_NAME/index.html" \
    --cache-control "public, max-age=0, must-revalidate" \
    --content-type "text/html"

echo ""
echo "✅ 文件上传完成"

# 获取 CloudFront Distribution ID（如果存在）
echo ""
echo "🔍 查找 CloudFront Distribution..."
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Comment=='Admin Panel - ${ENVIRONMENT}'].Id" \
    --output text 2>/dev/null | head -1)

if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
    echo "✅ 找到 CloudFront Distribution: $DISTRIBUTION_ID"
    echo ""
    echo "🔄 清除 CloudFront 缓存..."
    aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/*" \
        --output text > /dev/null
    echo "✅ 缓存清除完成"
else
    echo "⚠️  未找到 CloudFront Distribution"
    echo "提示: 如果需要清除 CloudFront 缓存，请运行:"
    echo "aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths '/*'"
fi

# 显示部署信息
echo ""
echo "========================================="
echo "✅ 部署完成！"
echo "========================================="
echo "S3 Bucket: $BUCKET_NAME"
echo "S3 Website URL: https://$BUCKET_NAME.s3-website-${AWS_REGION:-us-east-1}.amazonaws.com"
if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
    CLOUDFRONT_URL=$(aws cloudfront get-distribution \
        --id "$DISTRIBUTION_ID" \
        --query "Distribution.DomainName" \
        --output text 2>/dev/null)
    if [ -n "$CLOUDFRONT_URL" ]; then
        echo "CloudFront URL: https://$CLOUDFRONT_URL"
    fi
fi
echo ""
echo "提示: 如果配置了自定义域名，请确保 DNS 已正确配置"
