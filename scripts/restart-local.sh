#!/bin/bash
# 重启后台管理系统开发服务器（本地环境）

# 获取脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# 获取 admin-panel 目录（脚本目录的父目录）
ADMIN_PANEL_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# 切换到 admin-panel 目录
cd "$ADMIN_PANEL_DIR"

echo "========================================="
echo "重启后台管理系统 - 本地环境"
echo "========================================="

echo ""
echo "正在停止现有服务..."

# 查找并终止占用 3000 和 3001 端口的进程
for port in 3000 3001; do
  PID=$(lsof -ti :$port 2>/dev/null)
  if [ ! -z "$PID" ]; then
    echo "终止端口 $port 上的进程 (PID: $PID)"
    kill -9 $PID 2>/dev/null
  fi
done

sleep 1

echo ""
echo "检查环境配置..."

# 确保 .env.local 存在并配置为本地环境
if [ ! -f ".env.local" ]; then
  echo "创建 .env.local 文件..."
  cat > .env.local << EOF
# 本地开发环境
VITE_ENVIRONMENT=local
# API 基础 URL（不包含 /api/v1，代码会自动添加）
# VITE_API_BASE_URL=http://localhost:8080
EOF
  echo "✅ 已创建 .env.local 文件"
else
  # 检查并更新环境配置
  if ! grep -q "VITE_ENVIRONMENT=local" .env.local 2>/dev/null; then
    echo "更新 .env.local 为本地环境..."
    # 如果文件存在但配置不对，添加或更新配置
    if grep -q "VITE_ENVIRONMENT" .env.local; then
      sed -i '' 's/VITE_ENVIRONMENT=.*/VITE_ENVIRONMENT=local/' .env.local
    else
      echo "" >> .env.local
      echo "# 本地开发环境" >> .env.local
      echo "VITE_ENVIRONMENT=local" >> .env.local
    fi
    echo "✅ 已更新 .env.local 为本地环境"
  fi
fi

echo ""
echo "启动开发服务器（本地环境）..."
echo "API 地址: http://localhost:8080"
echo ""

# 设置环境变量并启动开发服务器
export VITE_ENVIRONMENT=local
npm run dev
