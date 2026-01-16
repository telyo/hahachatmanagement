#!/bin/bash
# 为后台管理系统创建 CloudFront Distribution

set -e

ENVIRONMENT=${1:-staging}
DOMAIN_NAME=${2:-management-test.hahachat.ai}
CERT_ARN=${3:-arn:aws:acm:us-east-1:038897080269:certificate/3b087851-e590-4c70-bba9-4b647b2dcf2f}
AWS_REGION=${AWS_REGION:-us-east-1}
BUCKET_NAME="${ENVIRONMENT}-hahachat-admin-panel"

echo "========================================="
echo "创建 CloudFront Distribution"
echo "========================================="
echo "环境: $ENVIRONMENT"
echo "域名: $DOMAIN_NAME"
echo "证书 ARN: $CERT_ARN"
echo "S3 Bucket: $BUCKET_NAME"
echo ""

# 检查 bucket 是否存在
if ! aws s3 ls "s3://$BUCKET_NAME" &>/dev/null; then
    echo "❌ 错误: S3 bucket 不存在: $BUCKET_NAME"
    echo "请先运行: ./scripts/deploy-admin-panel.sh $ENVIRONMENT"
    echo "（在 admin-panel 目录下运行）"
    exit 1
fi

echo "✅ S3 bucket 存在: $BUCKET_NAME"

# 创建 CloudFront Distribution 配置 JSON
cat > /tmp/cloudfront-config.json <<EOF
{
  "CallerReference": "admin-panel-${ENVIRONMENT}-$(date +%s)",
  "Comment": "Admin Panel - ${ENVIRONMENT}",
  "DefaultCacheBehavior": {
    "TargetOriginId": "S3-${BUCKET_NAME}",
    "ViewerProtocolPolicy": "redirect-to-https",
    "AllowedMethods": {
      "Quantity": 3,
      "Items": ["GET", "HEAD", "OPTIONS"],
      "CachedMethods": {
        "Quantity": 2,
        "Items": ["GET", "HEAD"]
      }
    },
    "ForwardedValues": {
      "QueryString": true,
      "Cookies": {
        "Forward": "none"
      },
      "Headers": {
        "Quantity": 0
      }
    },
    "MinTTL": 0,
    "DefaultTTL": 3600,
    "MaxTTL": 86400,
    "Compress": true
  },
  "Origins": {
    "Quantity": 1,
    "Items": [
      {
        "Id": "S3-${BUCKET_NAME}",
        "DomainName": "${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com",
        "CustomOriginConfig": {
          "HTTPPort": 80,
          "HTTPSPort": 443,
          "OriginProtocolPolicy": "https-only"
        }
      }
    ]
  },
  "Enabled": true,
  "Aliases": {
    "Quantity": 1,
    "Items": ["${DOMAIN_NAME}"]
  },
  "ViewerCertificate": {
    "ACMCertificateArn": "${CERT_ARN}",
    "SSLSupportMethod": "sni-only",
    "MinimumProtocolVersion": "TLSv1.2_2021"
  },
  "CustomErrorResponses": {
    "Quantity": 1,
    "Items": [
      {
        "ErrorCode": 404,
        "ResponsePagePath": "/index.html",
        "ResponseCode": "200",
        "ErrorCachingMinTTL": 300
      }
    ]
  },
  "PriceClass": "PriceClass_100"
}
EOF

echo "创建 CloudFront Distribution..."
DISTRIBUTION_OUTPUT=$(aws cloudfront create-distribution \
    --distribution-config file:///tmp/cloudfront-config.json \
    --output json 2>&1)

if [ $? -eq 0 ]; then
    DISTRIBUTION_ID=$(echo "$DISTRIBUTION_OUTPUT" | python3 -c "import sys, json; print(json.load(sys.stdin)['Distribution']['Id'])" 2>/dev/null || echo "")
    CLOUDFRONT_DOMAIN=$(echo "$DISTRIBUTION_OUTPUT" | python3 -c "import sys, json; print(json.load(sys.stdin)['Distribution']['DomainName'])" 2>/dev/null || echo "")
    
    if [ -n "$DISTRIBUTION_ID" ]; then
        echo "✅ CloudFront Distribution 创建成功！"
        echo ""
        echo "Distribution ID: $DISTRIBUTION_ID"
        echo "CloudFront Domain: $CLOUDFRONT_DOMAIN"
        echo ""
        echo "⚠️  注意: Distribution 创建需要 5-15 分钟才能完全部署"
        echo ""
        echo "下一步："
        echo "1. 等待 Distribution 状态变为 'Deployed'"
        echo "2. 在 Cloudflare 中添加 CNAME 记录："
        echo "   类型: CNAME"
        echo "   名称: management-test"
        echo "   目标: $CLOUDFRONT_DOMAIN"
        echo "   代理状态: 已代理（橙色云朵）"
        echo ""
        echo "检查状态："
        echo "aws cloudfront get-distribution --id $DISTRIBUTION_ID --query 'Distribution.Status' --output text"
    else
        echo "⚠️  创建成功，但无法解析 Distribution ID"
        echo "输出: $DISTRIBUTION_OUTPUT"
    fi
else
    echo "❌ 创建失败"
    echo "错误: $DISTRIBUTION_OUTPUT"
    echo ""
    echo "可能的原因："
    echo "1. 证书状态不是 ISSUED（需要先完成 DNS 验证）"
    echo "2. 证书 ARN 不正确"
    echo "3. 权限不足"
    exit 1
fi

rm -f /tmp/cloudfront-config.json
