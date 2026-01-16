import apiClient from './api';
export const aiUsageService = {
    async getUsageList(params) {
        const queryParams = new URLSearchParams();
        if (params.page)
            queryParams.append('page', String(params.page));
        if (params.pageSize)
            queryParams.append('pageSize', String(params.pageSize));
        if (params.userId)
            queryParams.append('userId', params.userId);
        if (params.modelId)
            queryParams.append('modelId', params.modelId);
        if (params.startTime)
            queryParams.append('startTime', String(params.startTime));
        if (params.endTime)
            queryParams.append('endTime', String(params.endTime));
        const response = await apiClient.get(`/admin/ai/usage?${queryParams.toString()}`);
        return response.data;
    },
    async getStatistics(params) {
        const queryParams = new URLSearchParams();
        if (params?.startTime)
            queryParams.append('startTime', String(params.startTime));
        if (params?.endTime)
            queryParams.append('endTime', String(params.endTime));
        try {
            const response = await apiClient.get(`/admin/ai/statistics?${queryParams.toString()}`);
            // 后端返回格式: { success: true, data: AIUsageStatistics }
            // 我们需要返回 { data: AIUsageStatistics }
            if (!response.data.success) {
                throw new Error('后端返回失败状态');
            }
            if (!response.data.data) {
                throw new Error('后端返回数据为空');
            }
            return { data: response.data.data };
        }
        catch (error) {
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
