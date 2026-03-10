import { DataProvider, fetchUtils, GetListParams } from 'react-admin';
import { isLoginPage } from '../utils/routing';
import { authUtils } from '../utils/auth';
import {
  calculateSignature,
  generateNonce,
  getCurrentTimestamp,
} from '../utils/signature';

const httpClient = (url: string, options: Record<string, unknown> = {}) => {
  // 如果在登录页且没有 token，直接拒绝请求，避免不必要的 API 调用
  const onLoginPage = isLoginPage();
  const token = authUtils.getToken();
  
  if (onLoginPage && !token) {
    if (import.meta.env.DEV) {
      console.log('[dataProvider] 在登录页且无 token，跳过请求:', url);
    }
    // 返回一个拒绝的 Promise，但不会触发错误处理
    return Promise.reject({
      status: 0,
      message: 'Not authenticated',
      body: { error: 'User not authenticated' },
    });
  }

  if (!options.headers) {
    options.headers = new Headers({ Accept: 'application/json' });
  }
  if (token) {
    options.headers.set('Authorization', `Bearer ${token}`);
  }

  // 添加签名验证头（登录接口除外）
  if (!url.includes('/admin/auth/login')) {
    const timestamp = getCurrentTimestamp();
    const nonce = generateNonce();

    // 解析 URL 以获取路径和查询字符串
    let urlObj: URL;
    try {
      urlObj = new URL(url);
    } catch {
      // 如果 URL 是相对路径，需要拼接 baseURL
      urlObj = new URL(url, API_BASE_URL);
    }
    const path = urlObj.pathname;
    
    // 获取查询字符串（按键名排序）
    let queryString = '';
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

    // 获取请求体（用于签名计算）
    let body = '';
    if (options.body) {
      if (typeof options.body === 'string') {
        body = options.body;
      } else {
        body = JSON.stringify(options.body);
      }
    }

    // 计算签名
    const signature = calculateSignature(
      (options.method as string || 'GET').toUpperCase(),
      path,
      queryString || '',
      body,
      timestamp,
      nonce
    );

    // 添加签名验证头
    options.headers.set('X-Timestamp', timestamp.toString());
    options.headers.set('X-Nonce', nonce);
    options.headers.set('X-Signature', signature);
  }

  return fetchUtils.fetchJson(url, options).catch((error: any) => {
    // 如果是网络错误，包装成有 status 的错误，避免触发认证检查
    if (!error.status && (error.message?.includes('Failed to fetch') || error.message?.includes('Network'))) {
      // 网络错误，返回一个特殊的错误，让 checkError 处理
      const networkError = new Error(error.message || 'Network error');
      (networkError as any).status = 0; // 使用 0 表示网络错误
      (networkError as any).body = error;
      throw networkError;
    }
    
    // 如果错误有 body，检查是否是后端错误格式，并规范化错误对象
    // 这样可以避免 React Admin 错误地将字段值当作错误消息
    if (error.body && typeof error.body === 'object') {
      console.log('[httpClient] 原始错误 body:', JSON.stringify(error.body, null, 2));
      
      let errorMessage = '请求失败';
      
      // 检查后端返回的错误格式: { success: false, error: { code: 4006, message: "..." } }
      if (error.body.error && error.body.error.message) {
        errorMessage = error.body.error.message;
      } else if (error.body.message) {
        errorMessage = error.body.message;
      } else {
        // 如果 error.body 包含其他字段（可能是请求数据），忽略它们
        // 只使用默认错误消息，避免 React Admin 将字段值当作错误消息
        console.warn('[httpClient] 错误响应包含非标准格式，忽略字段值:', Object.keys(error.body));
        // 检查是否是请求数据（包含表单字段）
        const requestDataFields = ['isHahachat', 'status', 'sortOrder', 'timeoutSeconds', 'retryAttempts', 'name', 'displayName', 'loginUrl', 'subscriptionUrl'];
        const hasRequestDataFields = requestDataFields.some(field => field in error.body);
        if (hasRequestDataFields) {
          console.error('[httpClient] 错误：error.body 包含请求数据字段，这不应该发生！');
          errorMessage = '服务器返回了无效的错误格式';
        }
      }
      
      // 创建一个新的错误对象，只包含 message，不包含其他字段
      // 使用 Object.create(null) 创建纯净对象，避免继承 Object.prototype 的方法
      const formattedError: any = new Error(errorMessage);
      formattedError.status = error.status;
      formattedError.body = Object.create(null);
      formattedError.body.message = errorMessage;
      
      console.log('[httpClient] 规范化后的错误 body:', JSON.stringify(formattedError.body, null, 2));
      throw formattedError;
    }
    
    throw error;
  });
};

import { API_URL, API_BASE_URL } from '../config/env';
import apiClient from './api';

/**
 * 确保数据项有 id 字段（React Admin 要求）
 * 对于不同的资源类型，从不同的字段映射 id
 */
function ensureIdField(item: any, resource?: string): any {
  if (!item || item.id) {
    return item;
  }
  
  // 根据资源类型和常见字段名映射 id
  // 注意：对于 orders 资源，优先使用 orderId，而不是 planId
  const idValue = item.id || 
                  (resource === 'orders' ? item.orderId : null) ||
                  (resource === 'ai-models' ? item.modelId : null) ||
                  (resource === 'audit-logs' ? item.logId : null) ||
                  (resource === 'client-providers' ? item.providerId : null) ||
                  (resource === 'hahachat-providers' ? item.providerId : null) ||
                  item.modelId || 
                  item.orderId ||  // 对于非 orders 资源，orderId 也在 planId 之前
                  item.planId || 
                  item.userId || 
                  item.adminId ||
                  item.subscriptionId ||
                  item.logId ||
                  item.providerId;
  
  if (idValue) {
    return { ...item, id: idValue };
  }
  
  return item;
}

// 资源名称到 API 路径的映射
const resourceMap: Record<string, string> = {
  users: 'users',
  orders: 'orders',
  'subscription-plans': 'subscriptions/plans',
  'ai-models': 'ai/models',
  'ai-usage': 'ai/usage', // AI 使用记录
  feedback: 'feedback',
  'audit-logs': 'audit-logs',
  'api-logger': 'api-logger/config', // API 日志配置使用特殊路径
  admins: 'admins',
  'client-providers': 'client-providers',
  'hahachat-providers': 'hahachat-providers', // Hahachat 提供商管理
};

export const dataProvider: DataProvider = {
  getList: async (resource, params: GetListParams) => {
    console.log('[dataProvider] ===== getList 调用 =====', { 
      resource, 
      resourceType: typeof resource,
      params 
    });
    
    // API 日志配置特殊处理：返回单个配置对象作为列表
    if (resource === 'api-logger') {
      const apiPath = resourceMap[resource] || resource;
      const url = `${API_URL}/admin/${apiPath}`;
      const { json } = await httpClient(url);
      
      // 将配置对象包装成数组，并添加一个 id 字段
      const configData = json.data || {};
      return {
        data: [{ id: 'current', ...configData }],
        total: 1,
      };
    }

    const page = params.pagination?.page || 1;
    const perPage = params.pagination?.perPage || 10;
    const { sort, filter } = params;
    const apiPath = resourceMap[resource] || resource;
    
    const queryParams = new URLSearchParams({
      page: String(page),
      pageSize: String(perPage),
    });

    // 添加排序
    if (sort?.field) {
      queryParams.append('sortBy', sort.field);
      queryParams.append('order', sort.order);
    }

    // 添加筛选
    Object.entries(filter || {}).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, String(value));
      }
    });

    const url = `${API_URL}/admin/${apiPath}?${queryParams}`;
    console.log('[dataProvider] ===== 准备发送请求 =====', { resource, url });
    const { json } = await httpClient(url);
    console.log('[dataProvider] ===== 收到响应 =====', { resource, url, json });

    // 处理不同的响应格式
    let data: unknown[] = [];
    let total = 0;

    if (json.data) {
      if (json.data.items) {
        data = json.data.items;
        total = json.data.pagination?.total || json.data.items.length;
        console.log('[dataProvider] 使用 json.data.items:', { count: data.length, total });
      } else if (json.data.plans) {
        data = json.data.plans;
        total = json.data.pagination?.total || json.data.plans.length;
        console.log('[dataProvider] 使用 json.data.plans:', { count: data.length, total });
      } else if (json.data.models) {
        data = json.data.models;
        total = json.data.pagination?.total || json.data.models.length;
        console.log('[dataProvider] 使用 json.data.models:', { count: data.length, total });
      } else if (Array.isArray(json.data)) {
        data = json.data;
        total = json.data.length;
        console.log('[dataProvider] 使用 json.data (数组):', { count: data.length, total });
      } else {
        console.warn('[dataProvider] json.data 存在但不是预期格式:', json.data);
      }
    } else if (json.items) {
      // 处理直接返回 items 的情况（如 AI 模型列表）
      data = json.items;
      total = json.pagination?.total || json.items.length;
      console.log('[dataProvider] 使用 json.items:', { count: data.length, total });
    } else {
      console.warn('[dataProvider] 未找到预期的数据格式:', { json, resource });
    }

        // 如果是 AI 模型，需要先转换后端嵌套结构为前端扁平结构
        // 转换函数会正确处理 id 和 modelId 的映射
        if (resource === 'ai-models') {
          data = data.map((item: any) => convertAIModelBackendToFrontend(item));
        } else if (resource === 'audit-logs') {
          // 操作日志：确保 logId 映射到 id，并保留所有字段
          data = data.map((item: any) => {
            const mappedItem = { ...item };
            if (!mappedItem.id && mappedItem.logId) {
              mappedItem.id = mappedItem.logId;
            }
            // 确保 requestParams 字段被保留（即使为空字符串）
            if (import.meta.env.DEV) {
              console.log('Audit log item:', mappedItem);
              console.log('requestParams:', mappedItem.requestParams);
            }
            return mappedItem;
          });
        } else if (resource === 'subscription-plans') {
          // 订阅套餐：确保 id 字段使用 planId（后端API使用 planId 作为标识符）
          data = data.map((item: any) => {
            if (!item) return item;
            // 如果 item 有 planId，使用 planId 作为 id（React Admin 需要 id 字段）
            // 同时保留顶层 id 字段（如果存在）
            const mappedItem = { ...item };
            if (mappedItem.planId) {
              // 使用 planId 作为 id，因为后端API使用 planId 作为路径参数
              mappedItem.id = mappedItem.planId;
            }
            return mappedItem;
          });
        } else if (resource === 'users') {
          // 用户：确保 userId 映射到 id，并保留所有字段（包括 subscription 和 virtualCurrency）
          data = data.map((item: any) => {
            if (!item) return item;
            const mappedItem = { ...item };
            // 确保 id 字段存在（使用 userId）
            if (!mappedItem.id && mappedItem.userId) {
              mappedItem.id = mappedItem.userId;
            }
            // 调试日志：检查 subscription 和 virtualCurrency 字段
            if (import.meta.env.DEV) {
              console.log('[dataProvider] 用户数据映射:', {
                userId: mappedItem.userId,
                id: mappedItem.id,
                subscription: mappedItem.subscription,
                virtualCurrency: mappedItem.virtualCurrency,
              });
            }
            return mappedItem;
          });
        } else {
          // 其他资源：确保每个数据项都有 id 字段（React Admin 要求）
          data = data.map((item: any) => ensureIdField(item, resource));
        }

    // 最终检查：确保所有数据项都有 id 字段
    const dataWithId = data.map((item: any, index: number) => {
      if (!item) return item;
      
      // 如果还没有 id，尝试从常见字段获取
      if (!item.id) {
        let idValue: string | undefined;
        
        // 根据资源类型优先选择字段
        if (resource === 'ai-models') {
          idValue = item.modelId;
        } else if (resource === 'audit-logs') {
          idValue = item.logId;
        } else if (resource === 'subscription-plans') {
          // 订阅套餐：优先使用 planId（后端API使用 planId 作为标识符）
          idValue = item.planId;
        } else if (resource === 'orders') {
          // 订单：优先使用 orderId，而不是 planId
          idValue = item.orderId;
        } else {
          // 通用字段检查（注意：orderId 在 planId 之前，避免订单被错误映射）
          idValue = item.modelId || item.orderId || item.planId || 
                    item.userId || item.adminId || item.logId || item.providerId;
        }
        
        if (idValue) {
          return { ...item, id: idValue };
        }
        
        // 如果还是没有找到 id，记录错误
        if (import.meta.env.DEV) {
          console.error('[dataProvider] 数据项缺少 id 字段', {
            resource,
            index,
            item,
            availableFields: Object.keys(item),
          });
        }
      }
      
      return item;
    });

    // 最终强制检查：确保所有数据项都有 id 字段（React Admin 要求）
    const finalData = dataWithId.map((item: any, index: number) => {
      if (!item) return item;
      if (!item.id) {
        // 如果还是没有 id，尝试从所有可能的字段获取
        // 注意：对于 orders 资源，优先使用 orderId，而不是 planId
        const idValue = item.id || 
                        (resource === 'orders' ? item.orderId : null) ||
                        item.modelId || item.orderId || item.planId || 
                        item.userId || item.adminId || item.logId || 
                        item.providerId || item.feedbackId;
        if (idValue) {
          console.warn(`[dataProvider] 最终检查：为项 ${index} 添加 id`, { 
            idValue, 
            item: Object.keys(item) 
          });
          return { ...item, id: idValue };
        }
        // 如果还是没有，创建一个临时 id（不应该发生）
        console.error(`[dataProvider] 最终检查：项 ${index} 缺少所有 id 字段`, item);
        return { ...item, id: `temp_${index}_${Date.now()}` };
      }
      return item;
    });

    const result = {
      data: finalData,
      total,
    };
    
    // 验证所有项都有 id
    const missingId = finalData.filter((item: any) => !item?.id);
    if (missingId.length > 0) {
      console.error('[dataProvider] ===== 错误：仍有项缺少 id =====', missingId);
    }
    
    return result;
  },

  getOne: async (resource, params) => {
    const apiPath = resourceMap[resource] || resource;
    // 对于 subscription-plans，params.id 应该是 planId（因为列表返回时 id 就是 planId）
    const url = `${API_URL}/admin/${apiPath}/${params.id}`;
    const { json } = await httpClient(url);
    // 确保返回的数据有 id 字段（React Admin 要求）
    let responseData = ensureIdField(json.data || {}, resource);
    
    // 如果是 AI 模型，需要将后端嵌套结构转换为前端扁平结构
    if (resource === 'ai-models') {
      responseData = convertAIModelBackendToFrontend(responseData);
    } else if (resource === 'subscription-plans') {
      // 订阅套餐：确保 id 字段使用 planId（后端API使用 planId 作为标识符）
      if (responseData.planId && responseData.id !== responseData.planId) {
        responseData.id = responseData.planId;
      }
      // 确保 pricing 数组中的嵌套对象结构正确
      if (responseData.pricing && Array.isArray(responseData.pricing)) {
        responseData.pricing = responseData.pricing.map((item: any) => {
          if (!item || typeof item !== 'object') return item;
          const cleanedItem = { ...item };
          // 确保 benefits 是对象（不是 null 或 undefined）
          if (cleanedItem.benefits === null || cleanedItem.benefits === undefined) {
            cleanedItem.benefits = {};
          } else if (typeof cleanedItem.benefits !== 'object' || Array.isArray(cleanedItem.benefits)) {
            // 如果 benefits 不是对象，初始化为空对象
            cleanedItem.benefits = {};
          }
          // 确保 advantages 是数组（不是 null 或 undefined）
          if (cleanedItem.advantages === null || cleanedItem.advantages === undefined) {
            cleanedItem.advantages = [];
          } else if (!Array.isArray(cleanedItem.advantages)) {
            // 如果 advantages 不是数组，初始化为空数组
            cleanedItem.advantages = [];
          }
          // 确保 supportedModels 和 exclusiveModels 是数组
          if (cleanedItem.supportedModels === null || cleanedItem.supportedModels === undefined) {
            cleanedItem.supportedModels = [];
          } else if (!Array.isArray(cleanedItem.supportedModels)) {
            cleanedItem.supportedModels = [];
          }
          if (cleanedItem.exclusiveModels === null || cleanedItem.exclusiveModels === undefined) {
            cleanedItem.exclusiveModels = [];
          } else if (!Array.isArray(cleanedItem.exclusiveModels)) {
            cleanedItem.exclusiveModels = [];
          }
          return cleanedItem;
        });
      }
      // 调试：打印返回的数据结构
      if (import.meta.env.DEV) {
        console.log('[dataProvider] subscription-plans getOne 返回数据:', JSON.stringify(responseData, null, 2));
        console.log('[dataProvider] pricing 数组:', responseData.pricing);
        if (responseData.pricing && Array.isArray(responseData.pricing) && responseData.pricing.length > 0) {
          console.log('[dataProvider] 第一个 pricing 项:', JSON.stringify(responseData.pricing[0], null, 2));
          console.log('[dataProvider] 第一个 pricing 项的 benefits:', responseData.pricing[0].benefits);
          console.log('[dataProvider] 第一个 pricing 项的 advantages:', responseData.pricing[0].advantages);
          console.log('[dataProvider] 第一个 pricing 项的 supportedModels:', responseData.pricing[0].supportedModels);
          console.log('[dataProvider] 第一个 pricing 项的 exclusiveModels:', responseData.pricing[0].exclusiveModels);
        }
      }
    }
    
    return { data: responseData };
  },

  getMany: async (resource, params) => {
    const apiPath = resourceMap[resource] || resource;
    // 对于 subscription-plans，params.ids 应该是 planId 列表
    const promises = params.ids.map((id) =>
      httpClient(`${API_URL}/admin/${apiPath}/${id}`)
    );
    const responses = await Promise.all(promises);
    // 确保每个数据项都有 id 字段（React Admin 要求）
    let data = responses.map(({ json }) => ensureIdField(json.data || {}, resource));
    
    // 如果是 AI 模型，需要将后端嵌套结构转换为前端扁平结构
    if (resource === 'ai-models') {
      data = data.map((item: any) => convertAIModelBackendToFrontend(item));
    } else if (resource === 'subscription-plans') {
      // 订阅套餐：确保 id 字段使用 planId
      data = data.map((item: any) => {
        if (!item) return item;
        const mappedItem = { ...item };
        if (mappedItem.planId && mappedItem.id !== mappedItem.planId) {
          mappedItem.id = mappedItem.planId;
        }
        return mappedItem;
      });
    }
    
    return {
      data,
    };
  },

  getManyReference: async () => {
    // 实现 getManyReference 逻辑
    return { data: [], total: 0 };
  },

  create: async (resource, params) => {
    const apiPath = resourceMap[resource] || resource;
    const url = `${API_URL}/admin/${apiPath}`;
    
    // 如果是 AI 模型，需要转换扁平结构为嵌套结构
    let requestData = params.data;
    if (resource === 'ai-models') {
      requestData = convertAIModelFrontendToBackendRequest(params.data);
    }
    
    // 清理数据：移除 undefined 字段，避免序列化问题
    const cleanData = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return null;
      }
      if (Array.isArray(obj)) {
        return obj.map(item => cleanData(item));
      }
      if (typeof obj === 'object') {
        const cleaned: any = {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined) {
            cleaned[key] = cleanData(obj[key]);
          }
        }
        return cleaned;
      }
      return obj;
    };
    
    requestData = cleanData(requestData);
    
    try {
      console.log('[dataProvider] create 请求:', { resource, url, requestData });
      const { json } = await httpClient(url, {
        method: 'POST',
        body: JSON.stringify(requestData),
      });
      console.log('[dataProvider] create 响应:', { resource, json });
      
      // 检查后端返回的错误（后端可能返回 200 状态码但 success: false）
      if (json.success === false) {
        const errorMessage = json.error?.message || json.message || '创建失败';
        const error: any = new Error(errorMessage);
        error.body = {
          message: errorMessage,
        };
        error.status = 400;
        throw error;
      }
      
      // React Admin 要求返回的数据必须有 id 字段
      // 对于 AI 模型，后端返回的 modelId 是系统生成的ID，应该作为 id
      // providerModelId 是提供商模型ID，应该映射到前端的 modelId 字段
      let responseData = json.data || {};
      
      if (resource === 'ai-models') {
        // 将后端嵌套结构转换为前端扁平结构（这个函数会处理 id 和 modelId 的映射）
        responseData = convertAIModelBackendToFrontend(responseData);
      } else {
        // 其他资源：确保返回的数据有 id 字段
        responseData = ensureIdField(responseData, resource);
      }
      
      console.log('[dataProvider] create 返回数据:', { resource, responseData });
      return { data: responseData };
    } catch (error: any) {
      // 处理服务器验证错误
      console.error('[dataProvider] create 错误:', error);
      console.error('[dataProvider] create 错误详情:', {
        status: error.status,
        body: error.body,
        message: error.message,
        stack: error.stack,
      });
      
      // 检查后端返回的错误格式
      // 后端返回格式: { success: false, error: { code: 4006, message: "..." } }
      let errorMessage = '创建失败';
      
      if (error.body) {
        console.error('[dataProvider] create 错误 body 内容:', JSON.stringify(error.body, null, 2));
        
        // 检查是否是请求数据（包含表单字段）
        const requestDataFields = ['isHahachat', 'status', 'sortOrder', 'timeoutSeconds', 'retryAttempts', 'name', 'displayName', 'loginUrl', 'subscriptionUrl', 'apiEndpoint', 'apiKey', 'secretKey', 'supportedModels'];
        const hasRequestDataFields = requestDataFields.some(field => field in error.body);
        
        if (hasRequestDataFields) {
          console.error('[dataProvider] create 错误：error.body 包含请求数据字段，这不应该发生！');
          // 如果 error.body 包含请求数据，说明错误处理有问题，使用默认错误消息
          errorMessage = '创建失败，请检查表单数据';
        } else if (error.body.message && Object.keys(error.body).length === 1) {
          // 如果 error.body 已经是规范化格式（只有 message 字段），直接使用
          errorMessage = error.body.message;
        } else if (error.body.error && error.body.error.message) {
          // 如果后端返回的是标准错误格式
          errorMessage = error.body.error.message;
        } else if (error.body.message) {
          // 兼容其他错误格式
          errorMessage = error.body.message;
        } else {
          // 如果 error.body 本身就是错误消息字符串
          errorMessage = typeof error.body === 'string' ? error.body : '创建失败';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // 创建格式化的错误对象，只包含 message，不包含其他字段
      // 使用 Object.create(null) 创建纯净对象，避免继承 Object.prototype 的方法
      const formattedError: any = new Error(errorMessage);
      formattedError.status = error.status || 400;
      formattedError.body = Object.create(null);
      formattedError.body.message = errorMessage;
      
      console.log('[dataProvider] create 规范化后的错误 body:', JSON.stringify(formattedError.body, null, 2));
      throw formattedError;
    }
  },

  update: async (resource, params) => {
    console.log('[dataProvider] ===== update 被调用 =====', { resource, params });
    
    // API 日志配置特殊处理
    if (resource === 'api-logger') {
      const apiPath = resourceMap[resource] || resource;
      const url = `${API_URL}/admin/${apiPath}`;
      // 移除 id 字段，只发送配置数据
      const configData = { ...params.data };
      delete configData.id;
      const { json } = await httpClient(url, {
        method: 'PUT',
        body: JSON.stringify(configData),
      });
      const responseData = json.data || {};
      return { data: { id: 'current', ...responseData } };
    }

    const apiPath = resourceMap[resource] || resource;
    
    // 对于 hahachat-providers，使用 providerId 而不是 id
    let resourceId = params.id;
    if (resource === 'hahachat-providers' && params.data?.providerId) {
      resourceId = params.data.providerId;
    }
    
    const url = `${API_URL}/admin/${apiPath}/${resourceId}`;
    
    // 如果是 AI 模型，需要转换扁平结构为嵌套结构
    let requestData = params.data;
    if (resource === 'ai-models') {
      requestData = convertAIModelFrontendUpdateToBackendRequest(params.data);
    }
    // 注意：subscription-plans 的转换在后端处理，前端直接发送扁平数据
    
    console.log('[dataProvider] update 请求:', { resource, url, requestData });
    
    try {
      const { json } = await httpClient(url, {
        method: 'PUT',
        body: JSON.stringify(requestData),
      });
      
      console.log('[dataProvider] update 响应:', { resource, json });
      
      // 检查后端返回的错误（后端可能返回 200 状态码但 success: false）
      if (json.success === false) {
        const errorMessage = json.error?.message || json.message || '更新失败';
        const error: any = new Error(errorMessage);
        error.body = {
          message: errorMessage,
        };
        error.status = 400;
        throw error;
      }
      
      // 确保返回的数据有 id 字段（React Admin 要求）
      let responseData = json.data || {};
      responseData = ensureIdField(responseData, resource);
      
      // 如果是 AI 模型，需要将后端嵌套结构转换为前端扁平结构
      if (resource === 'ai-models') {
        responseData = convertAIModelBackendToFrontend(responseData);
      }
      
      return { data: responseData };
    } catch (error: any) {
      // 处理服务器验证错误
      console.error('[dataProvider] update 错误:', error);
      console.error('[dataProvider] update 错误详情:', {
        status: error.status,
        body: error.body,
        message: error.message,
      });
      
      // 检查后端返回的错误格式
      // 后端返回格式: { success: false, error: { code: 4006, message: "..." } }
      let errorMessage = '更新失败';
      
      if (error.body) {
        console.error('[dataProvider] update 错误 body 内容:', JSON.stringify(error.body, null, 2));
        
        // 如果 error.body 已经是规范化格式（只有 message 字段），直接使用
        if (error.body.message && Object.keys(error.body).length === 1) {
          errorMessage = error.body.message;
        } else if (error.body.error && error.body.error.message) {
          // 如果后端返回的是标准错误格式
          errorMessage = error.body.error.message;
        } else if (error.body.message) {
          // 兼容其他错误格式
          errorMessage = error.body.message;
        } else {
          // 如果 error.body 本身就是错误消息字符串
          errorMessage = typeof error.body === 'string' ? error.body : '更新失败';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // 创建格式化的错误对象，只包含 message，不包含其他字段
      // 这样可以避免 React Admin 错误地将字段值当作错误消息
      const formattedError: any = new Error(errorMessage);
      formattedError.body = {
        message: errorMessage,
      };
      formattedError.status = error.status || 400;
      throw formattedError;
    }
  },

  updateMany: async (resource, params) => {
    const promises = params.ids.map((id) =>
      httpClient(`${API_URL}/admin/${resourceMap[resource] || resource}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(params.data),
      })
    );
    await Promise.all(promises);
    return { data: params.ids };
  },

  delete: async (resource, params) => {
    // 操作日志通常不应该被删除，禁用删除功能
    if (resource === 'audit-logs') {
      throw new Error('操作日志不允许删除');
    }
    const apiPath = resourceMap[resource] || resource;
    // AI 模型使用 apiClient 确保请求正确发送
    if (resource === 'ai-models') {
      await apiClient.delete(`/admin/${apiPath}/${params.id}`);
    } else {
      const url = `${API_URL}/admin/${apiPath}/${params.id}`;
      await httpClient(url, { method: 'DELETE' });
    }
    return { data: { id: params.id } };
  },

  deleteMany: async (resource, params) => {
    // 操作日志通常不应该被删除，禁用删除功能
    if (resource === 'audit-logs') {
      throw new Error('操作日志不允许删除');
    }
    const apiPath = resourceMap[resource] || resource;
    // AI 模型等使用 apiClient 确保请求正确发送（含签名、Token）
    if (resource === 'ai-models') {
      await Promise.all(
        params.ids.map((id) =>
          apiClient.delete(`/admin/${apiPath}/${id}`)
        )
      );
    } else {
      const promises = params.ids.map((id) =>
        httpClient(`${API_URL}/admin/${apiPath}/${id}`, {
          method: 'DELETE',
        })
      );
      await Promise.all(promises);
    }
    return { data: params.ids };
  },
};

/**
 * 生成唯一的模型ID
 */
function generateModelId(): string {
  return `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 将前端的扁平 AI 模型数据转换为后端期望的嵌套结构（创建）
 * React Admin 的 SimpleForm 会将嵌套字段（如 pricing.inputPrice）转换为嵌套对象
 */
function convertAIModelFrontendToBackendRequest(frontendData: any): any {
  // 生成 modelId（用于后端存储的唯一ID）
  const modelId = generateModelId();
  
  // providerModelId 是用户输入的提供商模型ID（如 gpt-4, claude-3 等）
  const providerModelId = frontendData.modelId || frontendData.providerModelId || '';
  
  const backendRequest: any = {
    modelId: modelId,
    name: frontendData.name || '',
    displayName: frontendData.displayName || frontendData.name || '',
    description: frontendData.description || '',
    provider: frontendData.provider || '',
    providerModelId: providerModelId,
    category: frontendData.category || '',
    type: frontendData.type || 'chat',
    status: frontendData.status || 'active',
  };

  // Pricing（直接使用后端字段名）
  const pricing = frontendData.pricing || {};
  if (pricing.creditsPerRequest !== undefined) {
    backendRequest.pricing = {
      creditsPerRequest: pricing.creditsPerRequest ?? 1,
    };
  }

  // 转换 Capabilities
  const capabilities = frontendData.capabilities || {};
  const hasCapabilities = 
    capabilities.maxTokens !== undefined ||
    capabilities.supportsStreaming !== undefined ||
    capabilities.supportsFunctionCalling !== undefined ||
    capabilities.supportsVision !== undefined ||
    capabilities.supportsImageGeneration !== undefined ||
    capabilities.supportsMultiDocument !== undefined ||
    capabilities.maxImages !== undefined ||
    capabilities.maxDocuments !== undefined ||
    frontendData['capabilities.maxTokens'] !== undefined ||
    frontendData['capabilities.supportsStreaming'] !== undefined ||
    frontendData['capabilities.supportsFunctionCalling'] !== undefined ||
    frontendData['capabilities.supportsVision'] !== undefined ||
    frontendData['capabilities.supportsImageGeneration'] !== undefined ||
    frontendData['capabilities.supportsMultiDocument'] !== undefined ||
    frontendData['capabilities.maxImages'] !== undefined ||
    frontendData['capabilities.maxDocuments'] !== undefined;
    
  if (hasCapabilities) {
    backendRequest.capabilities = {
      maxTokens: capabilities.maxTokens ?? frontendData['capabilities.maxTokens'] ?? 0,
      supportsStreaming: capabilities.supportsStreaming ?? frontendData['capabilities.supportsStreaming'] ?? false,
      supportsMultiImage: capabilities.supportsVision ?? frontendData['capabilities.supportsVision'] ?? false,
      supportsFunctionCalling: capabilities.supportsFunctionCalling ?? frontendData['capabilities.supportsFunctionCalling'] ?? false,
      supportsImageGeneration: capabilities.supportsImageGeneration ?? frontendData['capabilities.supportsImageGeneration'] ?? false,
      supportsMultiDocument: capabilities.supportsMultiDocument ?? frontendData['capabilities.supportsMultiDocument'] ?? false,
      maxImages: capabilities.maxImages ?? frontendData['capabilities.maxImages'] ?? 0,
      maxDocuments: capabilities.maxDocuments ?? frontendData['capabilities.maxDocuments'] ?? 0,
    };
  }

  // 转换 Access（前端使用 permissions，后端使用 access）
  const permissions = frontendData.permissions || {};
  const hasAccess = 
    permissions.category !== undefined ||
    permissions.allowedPlans !== undefined ||
    permissions.excludedPlans !== undefined ||
    permissions.exclusiveToPlans !== undefined ||
    frontendData['permissions.category'] !== undefined ||
    frontendData['permissions.allowedPlans'] !== undefined ||
    frontendData['permissions.excludedPlans'] !== undefined ||
    frontendData['permissions.exclusiveToPlans'] !== undefined;
    
  if (hasAccess) {
    backendRequest.access = {
      category: permissions.category ?? frontendData['permissions.category'] ?? 'common',
      allowedPlans: permissions.allowedPlans ?? frontendData['permissions.allowedPlans'] ?? [],
      excludedPlans: permissions.excludedPlans ?? frontendData['permissions.excludedPlans'] ?? [],
      exclusiveToPlans: permissions.exclusiveToPlans ?? frontendData['permissions.exclusiveToPlans'] ?? [],
    };
  }

  // 转换 Display（前端使用 displayConfig，后端使用 display）
  const displayConfig = frontendData.displayConfig || {};
  const hasDisplay = 
    displayConfig.sortOrder !== undefined ||
    displayConfig.isFeatured !== undefined ||
    displayConfig.iconUrl !== undefined ||
    frontendData['displayConfig.sortOrder'] !== undefined ||
    frontendData['displayConfig.iconUrl'] !== undefined;

    
  if (hasDisplay) {
    backendRequest.display = {
      sortOrder: displayConfig.sortOrder ?? frontendData['displayConfig.sortOrder'] ?? 0,
      iconURL: displayConfig.iconUrl ?? frontendData['displayConfig.iconUrl'] ?? null,
      tags: [],
      badge: null,
      description: frontendData.description || null,
    };
  }

  // Config 是必需的，提供默认值
  backendRequest.config = {
    apiEndpoint: '',
    apiKey: '',
    secretKey: '',
    timeoutSeconds: 30,
    retryAttempts: 3,
    requestParamsMapping: {},
  };

  if (import.meta.env.DEV) {
    console.log('[dataProvider] AI模型创建请求转换', {
      frontend: frontendData,
      backend: backendRequest,
    });
  }

  return backendRequest;
}

/**
 * 将前端的扁平 AI 模型数据转换为后端期望的嵌套结构（更新）
 * React Admin 的 SimpleForm 会将嵌套字段转换为嵌套对象
 */
function convertAIModelFrontendUpdateToBackendRequest(frontendData: any): any {
  const backendRequest: any = {};

  // 基本字段
  if (frontendData.name !== undefined) backendRequest.name = frontendData.name;
  if (frontendData.displayName !== undefined) backendRequest.displayName = frontendData.displayName;
  if (frontendData.description !== undefined) backendRequest.description = frontendData.description;
  if (frontendData.provider !== undefined) backendRequest.provider = frontendData.provider;
  // 处理 providerModelId：前端表单使用 modelId 字段，需要映射到后端的 providerModelId
  // 优先使用 modelId 字段（这是用户在表单中实际编辑的字段）
  // 如果 modelId 不存在，才使用 providerModelId（可能是从后端返回的旧值）
  if (frontendData.modelId !== undefined && frontendData.modelId !== null && frontendData.modelId !== '') {
    // 前端的 modelId 字段实际上是提供商模型ID（如 gpt-4），不是系统生成的 modelId
    backendRequest.providerModelId = frontendData.modelId;
  } else if (frontendData.providerModelId !== undefined && frontendData.providerModelId !== null && frontendData.providerModelId !== '') {
    // 兼容：如果 modelId 不存在，使用 providerModelId
    backendRequest.providerModelId = frontendData.providerModelId;
  }
  
  // 调试日志
  if (import.meta.env.DEV) {
    console.log('[dataProvider] convertAIModelFrontendUpdateToBackendRequest - providerModelId 映射:', {
      frontendModelId: frontendData.modelId,
      frontendProviderModelId: frontendData.providerModelId,
      backendProviderModelId: backendRequest.providerModelId,
    });
  }
  if (frontendData.category !== undefined) backendRequest.category = frontendData.category;
  if (frontendData.type !== undefined) backendRequest.type = frontendData.type;
  if (frontendData.status !== undefined) backendRequest.status = frontendData.status;

  // Pricing（直接使用后端字段名）
  const pricing = frontendData.pricing || {};
  if (pricing.creditsPerRequest !== undefined) {
    backendRequest.pricing = {
      creditsPerRequest: pricing.creditsPerRequest,
    };
  }

  // 转换 Capabilities
  const capabilities = frontendData.capabilities || {};
  const hasCapabilities = 
    capabilities.maxTokens !== undefined ||
    capabilities.supportsStreaming !== undefined ||
    capabilities.supportsFunctionCalling !== undefined ||
    capabilities.supportsVision !== undefined ||
    capabilities.supportsImageGeneration !== undefined ||
    capabilities.supportsMultiDocument !== undefined ||
    capabilities.maxImages !== undefined ||
    capabilities.maxDocuments !== undefined ||
    frontendData['capabilities.maxTokens'] !== undefined ||
    frontendData['capabilities.supportsStreaming'] !== undefined ||
    frontendData['capabilities.supportsFunctionCalling'] !== undefined ||
    frontendData['capabilities.supportsVision'] !== undefined ||
    frontendData['capabilities.supportsImageGeneration'] !== undefined ||
    frontendData['capabilities.supportsMultiDocument'] !== undefined ||
    frontendData['capabilities.maxImages'] !== undefined ||
    frontendData['capabilities.maxDocuments'] !== undefined;
    
  if (hasCapabilities) {
    backendRequest.capabilities = {
      maxTokens: capabilities.maxTokens ?? frontendData['capabilities.maxTokens'] ?? 0,
      supportsStreaming: capabilities.supportsStreaming ?? frontendData['capabilities.supportsStreaming'] ?? false,
      supportsMultiImage: capabilities.supportsVision ?? frontendData['capabilities.supportsVision'] ?? false,
      supportsFunctionCalling: capabilities.supportsFunctionCalling ?? frontendData['capabilities.supportsFunctionCalling'] ?? false,
      supportsImageGeneration: capabilities.supportsImageGeneration ?? frontendData['capabilities.supportsImageGeneration'] ?? false,
      supportsMultiDocument: capabilities.supportsMultiDocument ?? frontendData['capabilities.supportsMultiDocument'] ?? false,
      maxImages: capabilities.maxImages ?? frontendData['capabilities.maxImages'] ?? 0,
      maxDocuments: capabilities.maxDocuments ?? frontendData['capabilities.maxDocuments'] ?? 0,
    };
  }

  // 转换 Access
  const permissions = frontendData.permissions || {};
  const hasAccess = 
    permissions.category !== undefined ||
    permissions.allowedPlans !== undefined ||
    permissions.excludedPlans !== undefined ||
    permissions.exclusiveToPlans !== undefined ||
    frontendData['permissions.category'] !== undefined ||
    frontendData['permissions.allowedPlans'] !== undefined ||
    frontendData['permissions.excludedPlans'] !== undefined ||
    frontendData['permissions.exclusiveToPlans'] !== undefined;
    
  if (hasAccess) {
    backendRequest.access = {
      category: permissions.category ?? frontendData['permissions.category'] ?? 'common',
      allowedPlans: permissions.allowedPlans ?? frontendData['permissions.allowedPlans'] ?? [],
      excludedPlans: permissions.excludedPlans ?? frontendData['permissions.excludedPlans'] ?? [],
      exclusiveToPlans: permissions.exclusiveToPlans ?? frontendData['permissions.exclusiveToPlans'] ?? [],
    };
  }

  // 转换 Display
  const displayConfig = frontendData.displayConfig || {};
  const hasDisplay = 
    displayConfig.sortOrder !== undefined ||
    displayConfig.isFeatured !== undefined ||
    displayConfig.iconUrl !== undefined ||
    frontendData['displayConfig.sortOrder'] !== undefined ||
    frontendData['displayConfig.iconUrl'] !== undefined;
    
  if (hasDisplay) {
    backendRequest.display = {
      sortOrder: displayConfig.sortOrder ?? frontendData['displayConfig.sortOrder'] ?? 0,
      iconURL: displayConfig.iconUrl ?? frontendData['displayConfig.iconUrl'] ?? null,
      tags: [],
      badge: null,
      description: frontendData.description || null,
    };
  }

  // 处理 Providers（提供商配置列表）
  // 注意：即使 providers 为空数组，也应该发送到后端（表示清空所有提供商）
  if (frontendData.providers !== undefined) {
    if (Array.isArray(frontendData.providers) && frontendData.providers.length > 0) {
      // 确保格式为 [{ providerId, sortOrder }]
      backendRequest.providers = frontendData.providers.map((item: any, index: number) => {
        if (typeof item === 'string') {
          return { providerId: item, sortOrder: index };
        }
        if (typeof item === 'object' && item !== null) {
          return {
            providerId: item.providerId || item.id,
            sortOrder: item.sortOrder !== undefined ? item.sortOrder : index,
          };
        }
        return null;
      }).filter((item: any) => item !== null && item.providerId);
    } else {
      // 如果 providers 为空数组或 undefined，设置为空数组（清空所有提供商）
      backendRequest.providers = [];
    }
  } else {
    // 如果 providers 字段不存在，不设置（表示不更新该字段）
    // 但如果用户明确清空了所有提供商，providers 应该是空数组，所以这里不应该设置
  }

  if (import.meta.env.DEV) {
    console.log('[dataProvider] AI模型更新请求转换', {
      frontend: frontendData,
      backend: backendRequest,
      providers: backendRequest.providers,
    });
  }

  return backendRequest;
}

/**
 * 将后端返回的嵌套 AI 模型数据转换为前端期望的扁平结构
 * 后端格式：{ pricing: { inputTokensPerCredit, outputTokensPerCredit }, access: { ... }, ... }
 * 前端格式：{ pricing: { inputTokensPerCredit, outputTokensPerCredit }, permissions: { ... }, ... }
 */
function convertAIModelBackendToFrontend(backendData: any): any {
  if (!backendData) {
    return backendData;
  }

  const frontendData: any = { ...backendData };
  
  // 重要：正确映射 id 和 modelId 字段
  // 后端返回的 modelId 是系统生成的ID（如 model_1234567890_abc），应该作为前端的 id（用于 React Admin 标识）
  // 后端返回的 providerModelId 是提供商模型ID（如 gpt-4），应该作为前端的 modelId（用于编辑）
  if (backendData.modelId && !frontendData.id) {
    frontendData.id = backendData.modelId; // 系统生成的ID作为 id
  }
  
  // 将 providerModelId 映射到前端的 modelId 字段（这是可编辑的提供商模型ID）
  if (backendData.providerModelId) {
    frontendData.modelId = backendData.providerModelId; // 提供商模型ID作为 modelId
  } else {
    // 如果没有 providerModelId，设置为空字符串（不应该使用系统生成的 modelId）
    frontendData.modelId = '';
  }

  // Pricing（直接使用后端字段名，无需转换）
  if (backendData.pricing) {
    frontendData.pricing = {
      creditsPerRequest: backendData.pricing.creditsPerRequest || 1,
    };
  } else {
    frontendData.pricing = {
      creditsPerRequest: 1,
    };
  }

  // 转换 capabilities（基本保持不变，但需要确保字段存在）
  if (backendData.capabilities) {
    frontendData.capabilities = {
      maxTokens: backendData.capabilities.maxTokens || 0,
      supportsStreaming: backendData.capabilities.supportsStreaming || false,
      supportsFunctionCalling: backendData.capabilities.supportsFunctionCalling || false,
      supportsVision: backendData.capabilities.supportsMultiImage || false, // 注意：后端是 supportsMultiImage
      supportsImageGeneration: backendData.capabilities.supportsImageGeneration || false,
      supportsMultiDocument: backendData.capabilities.supportsMultiDocument || false,
      maxImages: backendData.capabilities.maxImages || 0,
      maxDocuments: backendData.capabilities.maxDocuments || 0,
    };
  } else {
    frontendData.capabilities = {
      maxTokens: 0,
      supportsStreaming: false,
      supportsFunctionCalling: false,
      supportsVision: false,
      supportsImageGeneration: false,
      supportsMultiDocument: false,
      maxImages: 0,
      maxDocuments: 0,
    };
  }

  // 转换 access -> permissions
  if (backendData.access) {
    frontendData.permissions = {
      category: backendData.access.category || 'common',
      allowedPlans: backendData.access.allowedPlans || [],
      excludedPlans: backendData.access.excludedPlans || [],
      exclusiveToPlans: backendData.access.exclusiveToPlans || [],
    };
  } else {
    frontendData.permissions = {
      category: 'common',
      allowedPlans: [],
      excludedPlans: [],
      exclusiveToPlans: [],
    };
  }

  // 转换 display -> displayConfig: display.sortOrder -> displayConfig.sortOrder
  if (backendData.display) {
    frontendData.displayConfig = {
      sortOrder: backendData.display.sortOrder || 0,
      iconUrl: backendData.display.iconURL || undefined,
    };
  } else {
    frontendData.displayConfig = {
      sortOrder: 0,
      iconUrl: undefined,
    };
  }

  // 处理 Providers（提供商配置列表）- 直接传递，无需转换
  if (backendData.providers !== undefined) {
    frontendData.providers = Array.isArray(backendData.providers) ? backendData.providers : [];
  } else {
    frontendData.providers = [];
  }

  if (import.meta.env.DEV) {
    console.log('[dataProvider] AI模型后端数据转换', {
      backend: backendData,
      frontend: frontendData,
      providers: frontendData.providers,
    });
  }

  return frontendData;
}

