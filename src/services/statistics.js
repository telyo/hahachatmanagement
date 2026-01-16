import apiClient from './api';
export const statisticsService = {
    async getStatistics() {
        const response = await apiClient.get('/admin/statistics');
        return response.data;
    },
};
