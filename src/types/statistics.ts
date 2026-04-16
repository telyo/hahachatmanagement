export interface Statistics {
  users: {
    total: number;
    newToday: number;
    newInRange?: number; // 指定时间段内新增用户数
    activeToday: number;
    dailyActive: {
      total: number;
      byVersion: {
        name: string;
        count: number;
      }[];
      byDevice: {
        name: string;
        count: number;
      }[];
    };
    growth: {
      date: string;
      count: number;
    }[];
  };
  revenue: {
    today: number;
    revenueInRange?: number; // 指定时间段内收入
    thisMonth: number;
    thisYear: number;
    trend: {
      date: string;
      amount: number;
    }[];
  };
  ai: {
    requestsToday: number; // 今日或指定时间段内请求数
    tokensToday: number;
    distribution: {
      modelId: string;
      modelName: string;
      requests: number;
      tokens: number;
    }[];
    topModels: {
      modelId: string;
      modelName: string;
      requests: number;
    }[];
  };
}

export interface StatisticsResponse {
  data: Statistics;
}

