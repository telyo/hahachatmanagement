# 后台管理系统脚本目录

本目录包含所有后台管理系统相关的脚本，包括开发、部署和配置脚本。

## 脚本分类

### 开发脚本

- **restart-local.sh** - 本地环境重启脚本（连接到 http://localhost:8080）
- **restart-staging.sh** - 测试环境部署脚本（部署到 AWS 测试环境）
- **restart-production.sh** - 生产环境部署脚本（部署到 AWS 生产环境）

### 部署脚本

- **deploy-admin-panel.sh** - 部署后台管理系统到 AWS S3 + CloudFront
  ```bash
  ./scripts/deploy-admin-panel.sh [环境]
  # 环境: dev, staging, production
  ```

### 配置脚本

- **configure-admin-panel-domain.sh** - 配置自定义域名（ACM 证书、DNS 等）
- **create-cloudfront-for-admin-panel.sh** - 创建 CloudFront Distribution
- **verify-admin-panel-deployment.sh** - 验证部署配置（包括 CloudFront、S3、DNS 等）

## 使用方法

所有脚本都需要在 `admin-panel` 目录下运行：

```bash
cd admin-panel

# 本地开发
./scripts/restart-local.sh

# 部署到测试环境
./scripts/restart-staging.sh

# 部署到生产环境
./scripts/restart-production.sh

# 直接部署（不重启）
./scripts/deploy-admin-panel.sh staging
```

## 脚本说明

### 开发脚本

开发脚本用于本地开发和快速重启服务。

### 部署脚本

部署脚本会自动：
1. 检查环境配置
2. 构建生产版本
3. 上传到 AWS S3
4. 清除 CloudFront 缓存

### 配置脚本

配置脚本用于设置 AWS 基础设施（S3、CloudFront、ACM 证书等）。

## 注意事项

- 所有脚本都需要在 `admin-panel` 目录下运行
- 部署脚本需要配置好 AWS CLI 凭证
- 生产环境部署前会要求确认
