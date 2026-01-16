#!/bin/bash
# 部署后台管理系统到 AWS（线上测试环境）

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# 获取 admin-panel 目录（脚本目录的父目录）
ADMIN_PANEL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# 切换到 admin-panel 目录
cd "$ADMIN_PANEL_DIR"

echo "========================================="
echo "部署后台管理系统 - 线上测试环境"
echo "========================================="

# 检查部署脚本是否存在
DEPLOY_SCRIPT="$SCRIPT_DIR/deploy-admin-panel.sh"

if [ ! -f "$DEPLOY_SCRIPT" ]; then
  echo "❌ 错误: 找不到部署脚本: $DEPLOY_SCRIPT"
  echo "请确保 deploy-admin-panel.sh 存在于 scripts 目录下"
  exit 1
fi

echo ""
echo "检查环境配置..."

# 确保 .env.staging 存在并配置为测试环境
if [ ! -f ".env.staging" ]; then
  echo "创建 .env.staging 文件..."
  cat > .env.staging << EOF
# 线上测试环境
VITE_ENVIRONMENT=staging
# API 基础 URL（不包含 /api/v1，代码会自动添加）
# VITE_API_BASE_URL=https://api-test.hahachat.ai
EOF
  echo "✅ 已创建 .env.staging 文件"
fi

echo ""
echo "开始部署到 AWS 测试环境..."
echo "API 地址: https://api-test.hahachat.ai"
echo ""

# 调用部署脚本
bash "$DEPLOY_SCRIPT" staging

if [ $? -eq 0 ]; then
  echo ""
  echo "========================================="
  echo "✅ 部署完成！"
  echo "========================================="
  echo ""
  echo "访问地址: https://management-test.hahachat.ai"
  echo "（如果已配置自定义域名）"
else
  echo ""
  echo "========================================="
  echo "❌ 部署失败"
  echo "========================================="
  echo ""
  echo "请检查错误信息并重试"
  exit 1
fi
