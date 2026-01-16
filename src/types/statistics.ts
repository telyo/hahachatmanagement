export interface Statistics {
  users: {
    total: number;
    newToday: number;
    activeToday: number;
    growth: {
      date: string;
      count: number;
    }[];
  };
  revenue: {
    today: number;
    thisMonth: number;
    thisYear: number;
    trend: {
      date: string;
      amount: number;
    }[];
  };
  ai: {
    requestsToday: number;
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

