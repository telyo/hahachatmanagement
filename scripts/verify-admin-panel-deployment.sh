#!/bin/bash
# 验证后台管理系统部署配置

set -e

ENVIRONMENT=${1:-staging}
DOMAIN_NAME=${2:-management-test.hahachat.ai}
CERT_ARN=${3:-arn:aws:acm:us-east-1:038897080269:certificate/3b087851-e590-4c70-bba9-4b647b2dcf2f}
BUCKET_NAME="${ENVIRONMENT}-hahachat-admin-panel"

echo "========================================="
echo "验证后台管理系统配置"
echo "========================================="
echo "环境: $ENVIRONMENT"
echo "域名: $DOMAIN_NAME"
echo ""

# 步骤 1: 检查 ACM 证书
echo "步骤 1: 检查 ACM 证书..."
CERT_STATUS=$(aws acm describe-certificate \
    --certificate-arn "$CERT_ARN" \
    --region us-east-1 \
    --query 'Certificate.Status' \
    --output text 2>&1)

if [ "$CERT_STATUS" == "ISSUED" ]; then
    echo "✅ 证书状态: ISSUED"
else
    echo "⚠️  证书状态: $CERT_STATUS"
    if [ "$CERT_STATUS" == "PENDING_VALIDATION" ]; then
        echo "   需要完成 DNS 验证"
        VALIDATION=$(aws acm describe-certificate \
            --certificate-arn "$CERT_ARN" \
            --region us-east-1 \
            --query 'Certificate.DomainValidationOptions[0].ResourceRecord' \
            --output json 2>&1)
        echo "   验证记录: $VALIDATION"
    fi
fi

# 步骤 2: 检查 CloudFront Distribution
echo ""
echo "步骤 2: 检查 CloudFront Distribution..."
DISTRIBUTION_ID=$(aws cloudfront list-distributions \
    --query "DistributionList.Items[?contains(Comment, 'Admin Panel') || contains(Comment, 'admin') || contains(Aliases.Items[0], 'management-test')].Id" \
    --output text 2>&1 | head -1)

if [ -n "$DISTRIBUTION_ID" ] && [ "$DISTRIBUTION_ID" != "None" ]; then
    echo "✅ 找到 CloudFront Distribution: $DISTRIBUTION_ID"
    
    DIST_INFO=$(aws cloudfront get-distribution --id "$DISTRIBUTION_ID" 2>&1)
    DIST_STATUS=$(echo "$DIST_INFO" | python3 -c "import sys, json; print(json.load(sys.stdin)['Distribution']['Status'])" 2>/dev/null || echo "Unknown")
    CLOUDFRONT_DOMAIN=$(echo "$DIST_INFO" | python3 -c "import sys, json; print(json.load(sys.stdin)['Distribution']['DomainName'])" 2>/dev/null || echo "Unknown")
    ALIASES=$(echo "$DIST_INFO" | python3 -c "import sys, json; aliases = json.load(sys.stdin)['Distribution']['DistributionConfig']['Aliases'].get('Items', []); print(', '.join(aliases) if aliases else 'None')" 2>/dev/null || echo "Unknown")
    
    echo "   状态: $DIST_STATUS"
    echo "   CloudFront 域名: $CLOUDFRONT_DOMAIN"
    echo "   自定义域名: $ALIASES"
    
    if [ "$DIST_STATUS" == "Deployed" ]; then
        echo "✅ Distribution 已部署"
    else
        echo "⚠️  Distribution 状态: $DIST_STATUS（可能需要等待几分钟）"
    fi
else
    echo "⚠️  未找到 CloudFront Distribution"
    echo "   需要运行: ./scripts/create-cloudfront-for-admin-panel.sh $ENVIRONMENT $DOMAIN_NAME $CERT_ARN"
fi

# 步骤 3: 检查 S3 bucket
echo ""
echo "步骤 3: 检查 S3 bucket..."
if aws s3 ls "s3://$BUCKET_NAME" &>/dev/null; then
    echo "✅ S3 bucket 存在: $BUCKET_NAME"
    FILE_COUNT=$(aws s3 ls "s3://$BUCKET_NAME" --recursive 2>/dev/null | wc -l | tr -d ' ')
    echo "   文件数量: $FILE_COUNT"
    
    # 检查 index.html 是否存在
    if aws s3 ls "s3://$BUCKET_NAME/index.html" &>/dev/null; then
        echo "✅ index.html 存在"
    else
        echo "⚠️  index.html 不存在"
    fi
else
    echo "⚠️  S3 bucket 不存在: $BUCKET_NAME"
    echo "   需要运行: ./scripts/deploy-admin-panel.sh $ENVIRONMENT"
fi

# 步骤 4: 检查 DNS 解析
echo ""
echo "步骤 4: 检查 DNS 解析..."
if command -v dig &> /dev/null; then
    DNS_RESULT=$(dig +short "$DOMAIN_NAME" 2>&1 | head -1)
    if [ -n "$DNS_RESULT" ] && [ "$DNS_RESULT" != "" ]; then
        echo "✅ DNS 解析: $DNS_RESULT"
        if echo "$DNS_RESULT" | grep -q "cloudfront.net"; then
            echo "✅ DNS 指向 CloudFront"
        elif echo "$DNS_RESULT" | grep -qE "104\.|172\.|198\."; then
            echo "⚠️  DNS 指向 Cloudflare IP（可能需要等待传播）"
        else
            echo "⚠️  DNS 解析结果: $DNS_RESULT"
        fi
    else
        echo "⚠️  无法解析 DNS"
    fi
else
    echo "⚠️  dig 命令未安装，跳过 DNS 检查"
fi

# 步骤 5: 测试网站访问
echo ""
echo "步骤 5: 测试网站访问..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://${DOMAIN_NAME}" 2>&1 || echo "000")

if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ 网站可访问（HTTP 200）"
    echo "   尝试获取页面标题..."
    PAGE_TITLE=$(curl -s "https://${DOMAIN_NAME}" | grep -i "<title>" | head -1 | sed 's/.*<title>\(.*\)<\/title>.*/\1/' || echo "")
    if [ -n "$PAGE_TITLE" ]; then
        echo "   页面标题: $PAGE_TITLE"
    fi
elif [ "$HTTP_CODE" == "000" ]; then
    echo "⚠️  无法连接"
    echo "   可能原因："
    echo "   - DNS 未传播"
    echo "   - SSL 配置问题"
    echo "   - CloudFront 未部署完成"
elif [ "$HTTP_CODE" == "404" ]; then
    echo "⚠️  HTTP 404 - 页面未找到"
    echo "   可能原因："
    echo "   - S3 bucket 中文件未正确上传"
    echo "   - CloudFront 缓存问题"
elif [ "$HTTP_CODE" == "403" ]; then
    echo "⚠️  HTTP 403 - 禁止访问"
    echo "   可能原因："
    echo "   - S3 bucket 权限配置问题"
else
    echo "⚠️  HTTP 状态码: $HTTP_CODE"
fi

# 步骤 6: 测试 SSL 证书
echo ""
echo "步骤 6: 测试 SSL 证书..."
if command -v openssl &> /dev/null; then
    SSL_INFO=$(echo | timeout 5 openssl s_client -servername "$DOMAIN_NAME" -connect "${DOMAIN_NAME}:443" 2>/dev/null | openssl x509 -noout -subject -issuer -dates 2>/dev/null || echo "")
    if [ -n "$SSL_INFO" ]; then
        echo "✅ SSL 证书有效"
        echo "$SSL_INFO" | head -3 | sed 's/^/   /'
    else
        echo "⚠️  无法验证 SSL 证书"
        echo "   可能原因："
        echo "   - DNS 未传播"
        echo "   - 证书未正确配置"
    fi
else
    echo "⚠️  openssl 命令未安装，跳过 SSL 检查"
fi

# 总结
echo ""
echo "========================================="
echo "验证总结"
echo "========================================="

ALL_OK=true

if [ "$CERT_STATUS" != "ISSUED" ]; then
    echo "❌ 证书未颁发"
    ALL_OK=false
fi

if [ -z "$DISTRIBUTION_ID" ] || [ "$DISTRIBUTION_ID" == "None" ]; then
    echo "❌ CloudFront Distribution 未创建"
    ALL_OK=false
fi

if ! aws s3 ls "s3://$BUCKET_NAME" &>/dev/null; then
    echo "❌ S3 bucket 不存在"
    ALL_OK=false
fi

if [ "$HTTP_CODE" != "200" ]; then
    echo "❌ 网站无法访问（HTTP $HTTP_CODE）"
    ALL_OK=false
fi

if [ "$ALL_OK" == true ]; then
    echo "✅ 所有检查通过！"
    echo ""
    echo "您可以访问："
    echo "https://${DOMAIN_NAME}"
    echo ""
    echo "如果页面显示正常，配置成功！"
else
    echo "⚠️  部分检查未通过，请根据上述提示修复问题"
    echo ""
    echo "常见问题："
    echo "1. 证书未颁发：检查 Cloudflare DNS 验证记录"
    echo "2. CloudFront 未创建：运行创建脚本"
    echo "3. DNS 未解析：等待 DNS 传播（通常几分钟到几小时）"
    echo "4. 网站无法访问：检查 CloudFront 状态和 DNS 配置"
fi
