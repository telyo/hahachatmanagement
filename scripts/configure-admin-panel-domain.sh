#!/bin/bash
# 配置后台管理系统的自定义域名
# 用于配置 management-test.hahachat.ai 等自定义域名

set -e

# 配置
ENVIRONMENT=${1:-staging}
DOMAIN_NAME=${2:-management-test.hahachat.ai}
AWS_REGION=${AWS_REGION:-us-east-1}

echo "========================================="
echo "配置后台管理系统自定义域名"
echo "========================================="
echo "环境: $ENVIRONMENT"
echo "域名: $DOMAIN_NAME"
echo "AWS 区域: $AWS_REGION"
echo ""

# 检查 AWS CLI 是否安装
if ! command -v aws &> /dev/null; then
    echo "❌ 错误: AWS CLI 未安装"
    exit 1
fi

# 步骤 1: 检查或创建 ACM 证书
echo "步骤 1: 检查 ACM 证书..."
CERT_ARN=$(aws acm list-certificates \
    --region "$AWS_REGION" \
    --query "CertificateSummaryList[?DomainName=='${DOMAIN_NAME}' || DomainName=='*.hahachat.ai'].CertificateArn" \
    --output text 2>/dev/null | head -1)

if [ -z "$CERT_ARN" ] || [ "$CERT_ARN" == "None" ]; then
    echo "⚠️  未找到证书，需要创建新的证书"
    echo ""
    echo "请在 AWS Console 中创建证书："
    echo "1. 访问 https://console.aws.amazon.com/acm/home?region=${AWS_REGION}#/certificates/request"
    echo "2. 选择 'Request a public certificate'"
    echo "3. 域名输入: ${DOMAIN_NAME}"
    echo "   或者使用通配符: *.hahachat.ai"
    echo "4. 选择 DNS 验证"
    echo "5. 在 Cloudflare 中添加验证记录（CNAME）"
    echo ""
    read -p "证书创建完成后，请输入 Certificate ARN（或按 Enter 跳过）: " CERT_ARN
    if [ -z "$CERT_ARN" ]; then
        echo "⚠️  跳过证书配置，请稍后手动配置"
        CERT_ARN=""
    fi
else
    echo "✅ 找到证书: $CERT_ARN"
    
    # 检查证书状态
    CERT_STATUS=$(aws acm describe-certificate \
        --certificate-arn "$CERT_ARN" \
        --region "$AWS_REGION" \
        --query "Certificate.Status" \
        --output text 2>/dev/null)
    
    if [ "$CERT_STATUS" != "ISSUED" ]; then
        echo "⚠️  证书状态: $CERT_STATUS（需要等待证书颁发）"
        echo "请完成 DNS 验证后继续"
    else
        echo "✅ 证书状态: $CERT_STATUS"
    fi
fi

# 步骤 2: 查找 CloudFront Distribution
echo ""
echo "步骤 2: 查找 CloudFront Distribution..."
BUCKET_NAME="${ENVIRONMENT}-hahachat-admin-panel"

# 查找与 bucket 关联的 CloudFront Distribution
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?Comment=='Admin Panel - ${ENVIRONMENT}' || contains(Origins.Items[0].DomainName, '${BUCKET_NAME}')].Id" \
    --output text 2>/dev/null | head -1)

if [ -z "$DISTRIBUTION_ID" ] || [ "$DISTRIBUTION_ID" == "None" ]; then
    echo "⚠️  未找到 CloudFront Distribution"
    echo ""
    echo "需要先创建 CloudFront Distribution："
    echo "1. 访问 AWS Console CloudFront"
    echo "2. 创建新的 Distribution"
    echo "3. Origin Domain: ${BUCKET_NAME}.s3.${AWS_REGION}.amazonaws.com"
    echo "4. Viewer Protocol Policy: Redirect HTTP to HTTPS"
    echo "5. Comment: Admin Panel - ${ENVIRONMENT}"
    echo ""
    read -p "Distribution 创建完成后，请输入 Distribution ID（或按 Enter 跳过）: " DISTRIBUTION_ID
    if [ -z "$DISTRIBUTION_ID" ]; then
        echo "⚠️  跳过 CloudFront 配置，请稍后手动配置"
        DISTRIBUTION_ID=""
    fi
else
    echo "✅ 找到 CloudFront Distribution: $DISTRIBUTION_ID"
fi

# 步骤 3: 配置 CloudFront 自定义域名
if [ -n "$DISTRIBUTION_ID" ] && [ -n "$CERT_ARN" ]; then
    echo ""
    echo "步骤 3: 配置 CloudFront 自定义域名..."
    
    # 检查是否已配置自定义域名
    EXISTING_DOMAIN=$(aws cloudfront list-distributions \
        --query "DistributionList.Items[?Id=='${DISTRIBUTION_ID}'].Aliases.Items[0]" \
        --output text 2>/dev/null)
    
    if [ "$EXISTING_DOMAIN" == "$DOMAIN_NAME" ]; then
        echo "✅ 自定义域名已配置: $DOMAIN_NAME"
    else
        echo "⚠️  需要在 AWS Console 中手动配置自定义域名："
        echo ""
        echo "1. 访问 CloudFront Distribution: $DISTRIBUTION_ID"
        echo "2. 编辑 General settings"
        echo "3. 在 'Alternate domain names (CNAMEs)' 中添加: $DOMAIN_NAME"
        echo "4. 在 'Custom SSL certificate' 中选择: $CERT_ARN"
        echo "5. 保存更改"
        echo ""
        echo "或者使用 AWS CLI 命令："
        echo "aws cloudfront update-distribution \\"
        echo "    --id $DISTRIBUTION_ID \\"
        echo "    --distribution-config file://distribution-config.json"
    fi
fi

# 步骤 4: 获取 CloudFront 域名
if [ -n "$DISTRIBUTION_ID" ]; then
    echo ""
    echo "步骤 4: 获取 CloudFront 域名..."
    CLOUDFRONT_DOMAIN=$(aws cloudfront get-distribution \
        --id "$DISTRIBUTION_ID" \
        --query "Distribution.DomainName" \
        --output text 2>/dev/null)
    
    if [ -n "$CLOUDFRONT_DOMAIN" ] && [ "$CLOUDFRONT_DOMAIN" != "None" ]; then
        echo "✅ CloudFront 域名: $CLOUDFRONT_DOMAIN"
        echo ""
        echo "========================================="
        echo "Cloudflare DNS 配置"
        echo "========================================="
        echo "请在 Cloudflare 中添加以下 CNAME 记录："
        echo ""
        echo "类型: CNAME"
        echo "名称: management-test"
        echo "目标: $CLOUDFRONT_DOMAIN"
        echo "代理状态: 已代理（橙色云朵）"
        echo "TTL: 自动"
        echo ""
        echo "或者使用 Cloudflare API："
        echo "curl -X POST \"https://api.cloudflare.com/client/v4/zones/YOUR_ZONE_ID/dns_records\" \\"
        echo "  -H \"Authorization: Bearer YOUR_API_TOKEN\" \\"
        echo "  -H \"Content-Type: application/json\" \\"
        echo "  --data '{\"type\":\"CNAME\",\"name\":\"management-test\",\"content\":\"${CLOUDFRONT_DOMAIN}\",\"proxied\":true}'"
    fi
fi

echo ""
echo "========================================="
echo "配置完成"
echo "========================================="
echo "域名: $DOMAIN_NAME"
if [ -n "$CERT_ARN" ]; then
    echo "证书 ARN: $CERT_ARN"
fi
if [ -n "$DISTRIBUTION_ID" ]; then
    echo "CloudFront Distribution ID: $DISTRIBUTION_ID"
fi
echo ""
echo "后续步骤："
echo "1. 完成 ACM 证书的 DNS 验证（如果证书状态不是 ISSUED）"
echo "2. 在 CloudFront 中配置自定义域名和证书"
echo "3. 在 Cloudflare 中添加 CNAME 记录"
echo "4. 等待 DNS 传播（通常几分钟到几小时）"
echo "5. 访问 https://${DOMAIN_NAME} 测试"
