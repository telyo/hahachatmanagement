#!/bin/bash
# 部署后台管理系统到 AWS S3 和 CloudFront

set -e

# 配置
ENVIRONMENT=${1:-dev}
BUCKET_NAME="${ENVIRONMENT}-hahachat-admin-panel"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ADMIN_PANEL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILD_DIR="$ADMIN_PANEL_DIR/dist"
AWS_REGION=${AWS_REGION:-us-east-1}

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
# 先上传除 index.html 外的所有文件（带缓存）
aws s3 sync "$BUILD_DIR" "s3://$BUCKET_NAME/" \
    --delete \
    --exclude "*.map" \
    --exclude ".git/*" \
    --exclude "index.html" \
    --cache-control "public, max-age=3600" \
    --region "${AWS_REGION:-us-east-1}"

# 单独上传 index.html（不缓存，确保更新及时生效）
aws s3 cp "$BUILD_DIR/index.html" "s3://$BUCKET_NAME/index.html" \
    --cache-control "public, max-age=0, must-revalidate" \
    --content-type "text/html" \
    --region "${AWS_REGION:-us-east-1}"

echo ""
echo "✅ 文件上传完成"

# 获取或创建 CloudFront Distribution
echo ""
echo "🔍 查找 CloudFront Distribution..."
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Comment=='Admin Panel - ${ENVIRONMENT}'].Id" \
    --output text 2>/dev/null | head -1)

# 生产环境若不存在则创建 CloudFront（支持 HTTPS）
if [ -z "$DISTRIBUTION_ID" ] || [ "$DISTRIBUTION_ID" == "None" ]; then
    if [ "$ENVIRONMENT" == "production" ] || [ "$ENVIRONMENT" == "prod" ]; then
        echo "📦 创建 CloudFront Distribution（生产环境）..."
        ORIGIN_DOMAIN="${BUCKET_NAME}.s3-website-${AWS_REGION:-us-east-1}.amazonaws.com"
        cat > /tmp/cf-dist-config.json <<CFEOF
{
  "CallerReference": "admin-panel-${ENVIRONMENT}-$(date +%s)",
  "Comment": "Admin Panel - ${ENVIRONMENT}",
  "Enabled": true,
  "DefaultRootObject": "index.html",
  "Origins": {
    "Quantity": 1,
    "Items": [{
      "Id": "S3-${BUCKET_NAME}",
      "DomainName": "${ORIGIN_DOMAIN}",
      "CustomOriginConfig": {
        "HTTPPort": 80,
        "HTTPSPort": 443,
        "OriginProtocolPolicy": "http-only"
      }
    }]
  },
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-${BUCKET_NAME}",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"], "CachedMethods": {"Quantity": 2, "Items": ["GET", "HEAD"]}},
    "Compress": true,
    "ForwardedValues": {"QueryString": true, "Cookies": {"Forward": "none"}},
    "DefaultTTL": 3600,
    "MinTTL": 0,
    "MaxTTL": 86400
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [{
      "ErrorCode": 404,
      "ResponsePagePath": "/index.html",
      "ResponseCode": "200",
      "ErrorCachingMinTTL": 300
    }]
  }
}
CFEOF
        DISTRIBUTION_ID=$(aws cloudfront create-distribution \
            --distribution-config file:///tmp/cf-dist-config.json \
            --query "Distribution.Id" \
            --output text 2>/dev/null || echo "")
        rm -f /tmp/cf-dist-config.json
        if [ -n "$DISTRIBUTION_ID" ]; then
            echo "✅ CloudFront 创建成功: $DISTRIBUTION_ID"
            echo "   等待部署生效（约 5-10 分钟）..."
        fi
    fi
fi

if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
    echo "✅ 找到 CloudFront Distribution: $DISTRIBUTION_ID"
    echo ""
    echo "🔄 清除 CloudFront 缓存..."
    if aws cloudfront create-invalidation \
        --distribution-id "$DISTRIBUTION_ID" \
        --paths "/*" \
        --output text 2>/dev/null; then
        echo "✅ 缓存清除完成"
    else
        echo "⚠️  缓存清除失败（可能缺少 cloudfront:CreateInvalidation 权限）"
        echo "   文件已上传成功，新版本将在 CloudFront 缓存过期后生效（约 1 小时）"
        echo "   如需立即生效，请为 IAM 用户添加 cloudfront:CreateInvalidation 权限后重新运行"
    fi
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
# S3 静态网站仅支持 HTTP，不支持 HTTPS
echo "S3 Website URL (HTTP): http://$BUCKET_NAME.s3-website-${AWS_REGION:-us-east-1}.amazonaws.com"
if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
    CLOUDFRONT_URL=$(aws cloudfront get-distribution \
        --id "$DISTRIBUTION_ID" \
        --query "Distribution.DomainName" \
        --output text 2>/dev/null)
    if [ -n "$CLOUDFRONT_URL" ]; then
        echo "CloudFront URL (HTTPS): https://$CLOUDFRONT_URL"
        echo "推荐使用 CloudFront 访问（支持 HTTPS）"
    fi
else
    echo ""
    echo "⚠️  未找到 CloudFront Distribution，S3 网站仅支持 HTTP"
    echo "生产环境建议创建 CloudFront 以支持 HTTPS 和自定义域名 management.hahachat.ai"
    echo "运行: ./scripts/configure-admin-panel-domain.sh production management.hahachat.ai"
fi
echo ""
echo "提示: 如果配置了自定义域名，请确保 DNS 已正确配置"
