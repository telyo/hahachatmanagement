import apiClient from './api';

export interface AIUsage {
  id: string;
  userId: string;
  modelId: string;
  modelName: string;
  requestId: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  createdAt: string;
}

export interface AIUsageListResponse {
  data: {
    items: AIUsage[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface AIUsageStatistics {
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  successRequests?: number;
  failedRequests?: number;
  byProvider?: Record<string, any>;
  byModel: {
    modelId: string;
    modelName: string;
    requests: number;
    tokens: number;
    cost: number;
  }[];
  timeRange?: {
    startTime: number;
    endTime: number;
  };
}

export interface AIUsageStatisticsResponse {
  data: AIUsageStatistics;
}

export const aiUsageService = {
  async getUsageList(params: {
    page?: number;
    pageSize?: number;
    userId?: string;
    modelId?: string;
    startTime?: number;
    endTime?: number;
  }): Promise<AIUsageListResponse> {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', String(params.page));
    if (params.pageSize) queryParams.append('pageSize', String(params.pageSize));
    if (params.userId) queryParams.append('userId', params.userId);
    if (params.modelId) queryParams.append('modelId', params.modelId);
    if (params.startTime) queryParams.append('startTime', String(params.startTime));
    if (params.endTime) queryParams.append('endTime', String(params.endTime));

    const response = await apiClient.get<AIUsageListResponse>(
      `/admin/ai/usage?${queryParams.toString()}`
    );
    return response.data;
  },

  async getStatistics(params?: {
    startTime?: number;
    endTime?: number;
  }): Promise<AIUsageStatisticsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.startTime) queryParams.append('startTime', String(params.startTime));
    if (params?.endTime) queryParams.append('endTime', String(params.endTime));

    try {
      const response = await apiClient.get<{ success: boolean; data: AIUsageStatistics }>(
        `/admin/ai/statistics?${queryParams.toString()}`
      );
      // 后端返回格式: { success: true, data: AIUsageStatistics }
      // 我们需要返回 { data: AIUsageStatistics }
      if (!response.data.success) {
        throw new Error('后端返回失败状态');
      }
      if (!response.data.data) {
        throw new Error('后端返回数据为空');
      }
      return { data: response.data.data };
    } catch (error: any) {
      console.error('获取统计信息API调用失败:', error);
      console.error('错误详情:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      throw error;
    }
  },
};

