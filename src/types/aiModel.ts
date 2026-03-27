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
    creditsPerRequest: number; // 每次对话消耗的积分
  };
  capabilities: {
    maxTokens?: number;
    supportsStreaming: boolean;
    supportsFunctionCalling: boolean;
    supportsVision: boolean;
    supportsImageGeneration?: boolean;
  };
  defaultImageGenerationModelId?: string;
  permissions: {
    category: 'common' | 'exclusive' | 'embedding';
  };
  displayConfig: {
    sortOrder: number;
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

