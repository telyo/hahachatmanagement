# 环境配置说明

## 环境类型

支持三种环境配置：

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

## 配置方式

### 方式 1: 使用环境变量文件（推荐）

Vite 会根据运行模式自动加载对应的环境文件：

- 开发模式 (`npm run dev`): 加载 `.env.local`
- 构建测试 (`VITE_ENVIRONMENT=staging npm run build`): 加载 `.env.staging`
- 构建生产 (`VITE_ENVIRONMENT=production npm run build`): 加载 `.env.production`

#### 创建环境配置文件

**本地开发** (`.env.local`):
```env
# 本地开发环境
VITE_ENVIRONMENT=local
# 如果需要覆盖，可以设置 VITE_API_BASE_URL
# VITE_API_BASE_URL=http://localhost:8080
```

**线上测试** (`.env.staging`):
```env
# 线上测试环境
VITE_ENVIRONMENT=staging
# 如果需要覆盖，可以设置 VITE_API_BASE_URL
# VITE_API_BASE_URL=https://api-test.hahachat.ai
```

**生产环境** (`.env.production`):
```env
# 生产环境
VITE_ENVIRONMENT=production
# 如果需要覆盖，可以设置 VITE_API_BASE_URL
# VITE_API_BASE_URL=https://api.hahachat.ai
```

### 方式 2: 使用环境变量覆盖

可以通过设置 `VITE_API_BASE_URL` 环境变量来覆盖默认配置：

```bash
# 开发时指定 API 地址
VITE_API_BASE_URL=https://api-test.hahachat.ai npm run dev
```

## 配置格式

**重要**: `VITE_API_BASE_URL` 应该是不包含 `/api/v1` 的基础 URL，代码会自动添加 `/api/v1`。

### 正确示例：
```env
VITE_API_BASE_URL=https://api-test.hahachat.ai
```

### 错误示例：
```env
VITE_API_BASE_URL=https://api-test.hahachat.ai/api/v1  # ❌ 不要包含 /api/v1
```

## 代码逻辑

### 环境配置模块

`src/config/env.ts` 负责环境配置管理：

```typescript
// 导出 API 基础 URL（不包含 /api/v1）
export const API_BASE_URL = getEnvConfig().apiBaseUrl;

// 导出完整的 API URL（包含 /api/v1）
export const API_URL = `${API_BASE_URL}/api/v1`;
```

### API 服务使用

- `src/services/api.ts`: 使用 `API_URL` (包含 `/api/v1`) 作为 axios 的 `baseURL`
- `src/services/dataProvider.ts`: 使用 `API_URL` (包含 `/api/v1`) 构建请求 URL

### 请求 URL 格式

所有 API 请求最终格式：
- `{API_BASE_URL}/api/v1/admin/{resource}`
- 例如: `https://api-test.hahachat.ai/api/v1/admin/auth/login`

## 环境切换

### 开发模式

```bash
# 使用本地环境（默认）
npm run dev

# 或指定环境
VITE_ENVIRONMENT=staging npm run dev
```

### 构建模式

```bash
# 构建测试环境
VITE_ENVIRONMENT=staging npm run build

# 构建生产环境
VITE_ENVIRONMENT=production npm run build
```

### 部署脚本

部署脚本会自动根据环境参数设置 `VITE_ENVIRONMENT`：

```bash
# 部署到测试环境
./scripts/deploy-admin-panel.sh staging

# 部署到生产环境
./scripts/deploy-admin-panel.sh production
```

## 验证配置

### 检查当前环境

在浏览器控制台中：

```javascript
// 查看当前 API 配置
console.log(import.meta.env.VITE_ENVIRONMENT);
console.log(import.meta.env.VITE_API_BASE_URL);
```

### 检查 API 请求

打开浏览器开发者工具的 Network 标签，查看 API 请求的 URL：
- 应该以配置的 `API_BASE_URL` 开头
- 应该包含 `/api/v1` 路径

## 常见问题

### 1. API 请求仍然指向 localhost

**原因**: 环境变量未生效

**解决方案**:
1. 检查 `.env.local` 文件是否存在且配置正确
2. 重启开发服务器
3. 清除浏览器缓存

### 2. API 请求 URL 格式错误

**原因**: `VITE_API_BASE_URL` 包含了 `/api/v1`

**解决方案**:
- 移除 `VITE_API_BASE_URL` 中的 `/api/v1` 部分
- 代码会自动添加 `/api/v1`

### 3. 构建后环境配置不正确

**原因**: 构建时未指定环境

**解决方案**:
- 使用 `VITE_ENVIRONMENT=staging npm run build` 明确指定环境
- 或确保对应的 `.env.staging` 或 `.env.production` 文件存在

## 相关文件

- `src/config/env.ts` - 环境配置模块
- `src/services/api.ts` - API 客户端（使用 `API_URL`）
- `src/services/dataProvider.ts` - 数据提供者（使用 `API_URL`）
- `.env.local` - 本地开发环境配置
- `.env.staging` - 测试环境配置
- `.env.production` - 生产环境配置
