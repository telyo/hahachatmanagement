# HahaChat 后台管理系统

基于 React Admin + Material-UI 开发的后台管理系统。

## 技术栈

- React 18+
- Material-UI (MUI) v5
- React Admin
- TypeScript
- Vite
- Axios
- Recharts

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

## 环境配置

后台管理系统支持三种环境配置：本地、线上测试、线上生产。

### 环境类型

1. **本地环境 (local)**
   - API 地址: `http://localhost:8080`
   - 配置文件: `.env.local`
   - 用途: 本地开发

2. **线上测试环境 (staging)**
   - API 地址: `https://api-test.hahachat.ai`
   - 配置文件: `.env.staging`
   - 用途: 测试环境部署

3. **生产环境 (production)**
   - API 地址: `https://api.hahachat.ai`
   - 配置文件: `.env.production`
   - 用途: 生产环境部署

### 配置方式

#### 方式 1: 使用环境变量文件（推荐）

创建对应的环境配置文件：

**本地开发** (`.env.local`):
```env
VITE_ENVIRONMENT=local
# 如果需要覆盖，可以设置 VITE_API_BASE_URL
# VITE_API_BASE_URL=http://localhost:8080
```

**线上测试** (`.env.staging`):
```env
VITE_ENVIRONMENT=staging
# VITE_API_BASE_URL=https://api-test.hahachat.ai
```

**生产环境** (`.env.production`):
```env
VITE_ENVIRONMENT=production
# VITE_API_BASE_URL=https://api.hahachat.ai
```

**重要**: `VITE_API_BASE_URL` 应该是不包含 `/api/v1` 的基础 URL，代码会自动添加 `/api/v1`。

#### 方式 2: 使用环境变量覆盖

```bash
# 开发时指定 API 地址
VITE_ENVIRONMENT=staging npm run dev

# 或直接指定 API 地址
VITE_API_BASE_URL=https://api-test.hahachat.ai npm run dev
```

### 环境切换

- **开发模式**: `npm run dev` (使用 `.env.local`)
- **构建测试**: `VITE_ENVIRONMENT=staging npm run build`
- **构建生产**: `VITE_ENVIRONMENT=production npm run build`

详细配置说明请参考 [ENV_CONFIG.md](./ENV_CONFIG.md)

## 快速启动脚本

所有脚本位于 `scripts/` 目录下，提供了不同环境的启动/部署脚本：

```bash
# 本地环境（启动开发服务器，连接到 http://localhost:8080）
./scripts/restart-local.sh

# 线上测试环境（部署到 AWS，连接到 https://api-test.hahachat.ai）
./scripts/restart-staging.sh

# 生产环境（部署到 AWS，连接到 https://api.hahachat.ai）
./scripts/restart-production.sh
```

### 脚本说明

**本地环境** (`restart-local.sh`):
- 自动停止占用端口的进程
- 检查并更新 `.env.local` 环境配置
- 启动开发服务器

**线上测试环境** (`restart-staging.sh`):
- 检查并更新 `.env.staging` 环境配置
- 调用部署脚本构建并部署到 AWS S3 + CloudFront
- 部署完成后显示访问地址

**生产环境** (`restart-production.sh`):
- 部署前会提示确认（安全措施）
- 检查并更新 `.env.production` 环境配置
- 调用部署脚本构建并部署到 AWS S3 + CloudFront
- 部署完成后显示访问地址

## 项目结构

```
admin-panel/
├── src/
│   ├── components/     # 公共组件
│   ├── pages/          # 页面组件
│   ├── services/       # API 服务
│   ├── utils/          # 工具函数
│   ├── types/          # TypeScript 类型定义
│   ├── config/         # 环境配置
│   ├── App.tsx
│   └── main.tsx
├── public/
├── scripts/            # 脚本目录
│   ├── restart-local.sh    # 本地环境重启脚本
│   ├── restart-staging.sh  # 测试环境部署脚本
│   ├── restart-production.sh # 生产环境部署脚本
│   ├── deploy-admin-panel.sh # 部署到 AWS 脚本
│   ├── configure-admin-panel-domain.sh # 配置自定义域名
│   ├── create-cloudfront-for-admin-panel.sh # 创建 CloudFront
│   └── verify-admin-panel-deployment.sh # 验证部署
└── package.json
```

