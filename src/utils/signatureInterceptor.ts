import axios, { InternalAxiosRequestConfig } from 'axios';
import CryptoJS from 'crypto-js';
import {
  calculateSignature,
  generateNonce,
  getCurrentTimestamp,
} from './signature';

/**
 * 签名验证拦截器
 * 自动为所有请求添加签名验证头
 */
export function createSignatureInterceptor() {
  return (config: InternalAxiosRequestConfig) => {
    // 跳过登录接口（登录接口不需要签名验证）
    if (config.url?.includes('/admin/auth/login')) {
      return config;
    }

    // 生成签名参数
    const timestamp = getCurrentTimestamp();
    const nonce = generateNonce();

    // 获取请求路径（相对于 baseURL）
    // axios 会将 baseURL 和 url 组合，所以我们需要从完整 URL 中提取路径
    let fullUrl = config.url || '';
    
    // 如果 config.url 是相对路径，需要与 baseURL 组合
    if (config.baseURL && !fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      // 组合 baseURL 和 path
      const baseUrl = config.baseURL.endsWith('/') ? config.baseURL.slice(0, -1) : config.baseURL;
      const urlPath = fullUrl.startsWith('/') ? fullUrl : '/' + fullUrl;
      fullUrl = baseUrl + urlPath;
    }
    
    // 从完整 URL 中提取路径和查询字符串
    let path = '';
    let queryString = '';
    
    // 优先使用 config.params（如果存在），因为 axios 可能还没有将 params 添加到 URL
    if (config.params && Object.keys(config.params).length > 0) {
      const sortedParams = Object.keys(config.params)
        .sort()
        .map((key) => {
          const value = config.params![key];
          if (value === null || value === undefined) {
            return null;
          }
          return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
        })
        .filter((item) => item !== null);
      queryString = sortedParams.join('&');
      
      // 从 URL 中提取路径（不包含查询参数）
      try {
        const urlObj = new URL(fullUrl);
        path = urlObj.pathname;
      } catch {
        path = fullUrl.split('?')[0];
        if (!path.startsWith('/')) {
          path = '/' + path;
        }
      }
    } else {
      // 如果没有 config.params，从 URL 中提取
      try {
        const urlObj = new URL(fullUrl);
        path = urlObj.pathname;
        
        // 从 URL 对象中提取查询参数并排序
        if (urlObj.search) {
          const params = new URLSearchParams(urlObj.search.substring(1));
          const sortedParams = Array.from(params.keys())
            .sort()
            .map((key) => {
              const value = params.get(key);
              return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
            });
          queryString = sortedParams.join('&');
        }
      } catch {
        // 如果解析失败，使用原始路径
        path = fullUrl.split('?')[0];
        if (!path.startsWith('/')) {
          path = '/' + path;
        }
        // 尝试从 URL 中提取查询字符串
        const queryIndex = fullUrl.indexOf('?');
        if (queryIndex !== -1) {
          const rawQuery = fullUrl.substring(queryIndex + 1);
          const params = new URLSearchParams(rawQuery);
          const sortedParams = Array.from(params.keys())
            .sort()
            .map((key) => {
              const value = params.get(key);
              return `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`;
            });
          queryString = sortedParams.join('&');
        }
      }
    }

    // 路径部分（不含查询参数）
    const pathOnly = path;

    // 获取请求体（用于签名计算）
    let body = '';
    if (config.data) {
      if (typeof config.data === 'string') {
        body = config.data;
      } else if (config.data instanceof FormData) {
        // FormData 的情况（如文件上传），请求体为空（文件在 multipart/form-data 中）
        body = '';
      } else {
        body = JSON.stringify(config.data);
      }
    }

    // 计算签名
    const signature = calculateSignature(
      (config.method || 'GET').toUpperCase(),
      pathOnly, // 路径部分（不含查询参数）
      queryString || '', // 查询字符串
      body,
      timestamp,
      nonce
    );

    // 调试日志（开发环境）
    if (import.meta.env.DEV) {
      const bodyHash = CryptoJS.SHA256(body || '').toString(CryptoJS.enc.Hex);
      const stringToSign = [
        (config.method || 'GET').toUpperCase(),
        pathOnly,
        queryString || '',
        bodyHash,
        timestamp.toString(),
        nonce,
      ].join('\n');
      console.log('[签名计算]', {
        method: (config.method || 'GET').toUpperCase(),
        path: pathOnly,
        queryString: queryString || '',
        bodyHash,
        timestamp: timestamp.toString(),
        nonce,
        signature,
        stringToSign,
      });
    }

    // 添加签名验证头
    if (!config.headers) {
      config.headers = {} as any;
    }
    config.headers['X-Timestamp'] = timestamp.toString();
    config.headers['X-Nonce'] = nonce;
    config.headers['X-Signature'] = signature;

    return config;
  };
}

