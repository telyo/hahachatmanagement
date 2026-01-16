/**
 * 环境配置
 * 支持本地、线上测试、线上生产三个环境
 */
// 环境配置映射
const ENV_CONFIG = {
    local: {
        apiBaseUrl: 'http://localhost:8080',
    },
    staging: {
        apiBaseUrl: 'https://api-test.hahachat.ai',
    },
    production: {
        apiBaseUrl: 'https://api.hahachat.ai',
    },
};
// 从环境变量获取当前环境，默认为 local
const getCurrentEnvironment = () => {
    const env = import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE;
    if (env === 'production' || env === 'prod') {
        return 'production';
    }
    if (env === 'staging' || env === 'test') {
        return 'staging';
    }
    return 'local';
};
// 获取当前环境配置
export const getEnvConfig = () => {
    const env = getCurrentEnvironment();
    const config = ENV_CONFIG[env];
    // 如果设置了 VITE_API_BASE_URL，优先使用环境变量
    const customApiBaseUrl = import.meta.env.VITE_API_BASE_URL;
    if (customApiBaseUrl) {
        return {
            ...config,
            apiBaseUrl: customApiBaseUrl.endsWith('/')
                ? customApiBaseUrl.slice(0, -1)
                : customApiBaseUrl,
        };
    }
    return config;
};
// 导出当前环境
export const currentEnvironment = getCurrentEnvironment();
// 导出 API 基础 URL（不包含 /api/v1）
export const API_BASE_URL = getEnvConfig().apiBaseUrl;
// 导出完整的 API URL（包含 /api/v1）
export const API_URL = `${API_BASE_URL}/api/v1`;
