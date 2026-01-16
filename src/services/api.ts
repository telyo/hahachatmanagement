import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { authUtils } from '../utils/auth';
import { isLoginPage } from '../utils/routing';
import { createSignatureInterceptor } from '../utils/signatureInterceptor';
import { API_URL } from '../config/env';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器：先添加签名验证头，再添加 Token
const signatureInterceptor = createSignatureInterceptor();

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // 1. 先添加签名验证头（登录接口会跳过）
    const configWithSignature = signatureInterceptor(config);

    // 2. 再添加 Token
    const token = authUtils.getToken();
    if (token) {
      configWithSignature.headers.Authorization = `Bearer ${token}`;
    }
    
    // 如果是 FormData，删除 Content-Type，让浏览器自动设置（包含 boundary）
    if (configWithSignature.data instanceof FormData) {
      delete configWithSignature.headers['Content-Type'];
    }
    
    return configWithSignature;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器：处理 Token 过期
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // 如果是网络错误（CORS、连接失败等），不处理认证逻辑
    if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || !error.response) {
      // 网络错误，可能是 CORS 或连接问题，不处理认证
      return Promise.reject(error);
    }

    if (error.response?.status === 401) {
      // Token 过期，清除本地存储
      authUtils.removeToken();
      // 避免在登录页或认证相关请求时重复跳转
      const isAuthRequest = error.config?.url?.includes('/auth/');
      const onLoginPage = isLoginPage();
      if (!isAuthRequest && !onLoginPage) {
        // 延迟跳转，避免与 React Admin 的认证流程冲突
        setTimeout(() => {
          if (!isLoginPage()) {
            window.location.href = '/#/login';
          }
        }, 100);
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;

