import apiClient from './api';
export const statisticsService = {
    async getStatistics(params) {
        const end = Date.now();
        const start = params?.startTime ?? (end - 7 * 24 * 60 * 60 * 1000);
        const endTime = params?.endTime ?? end;
        const query = new URLSearchParams();
        query.set('startTime', String(start));
        query.set('endTime', String(endTime));
        const url = `/admin/statistics?${query.toString()}`;
        const response = await apiClient.get(url);
        return response.data;
    },
};
