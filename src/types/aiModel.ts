export interface AIModel {
  id: string;
  name: string;
  displayName: string;
  description?: string;
  provider: string;
  modelId: string;
  category: string;
  type: 'chat' | 'image' | 'audio' | 'video' | 'embedding';
  status: 'active' | 'inactive';
  pricing: {
    inputPrice: number; // 每1000 tokens
    outputPrice: number; // 每1000 tokens
  };
  capabilities: {
    maxTokens?: number;
    supportsStreaming: boolean;
    supportsFunctionCalling: boolean;
    supportsVision: boolean;
  };
  permissions: {
    requiresSubscription: boolean;
    allowedPlans?: string[];
    minCredits?: number;
  };
  displayConfig: {
    sortOrder: number;
    isFeatured: boolean;
    icon?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AIModelListResponse {
  data: {
    models: AIModel[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface AIModelDetailResponse {
  data: AIModel;
}

