import apiClient from './api';
import { StatisticsResponse } from '../types/statistics';

export const statisticsService = {
  async getStatistics(): Promise<StatisticsResponse> {
    const response = await apiClient.get<StatisticsResponse>('/admin/statistics');
    return response.data;
  },
};

