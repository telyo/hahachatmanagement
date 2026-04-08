// 套餐管理类型定义（新结构：pricing 为数组，benefits 和 advantages 在 pricing 项内）

// PricingBenefits 价格项内的权益配置（简化版）
export interface PricingBenefits {
  monthlyCredits: number;
  creditsLabel?: string;
  creditsDescription?: string;
}

// PricingItem 价格配置项（每个 pricing 数组中的元素）
export interface PricingItem {
  id?: string; // 唯一字符串，创建时自动生成，用于支付时获取支付相关信息
  price: number;
  currency: string;
  displayPrice?: string;
  originalPrice?: number;
  savedAmount?: number;
  savedLabel?: string;
  autoRenew: boolean;
  type: string; // 套餐类型，如 "Pro", "Max", "Ultra"
  renewLabel?: string;
  icon?: string; // 图标URL
  iosProductId?: string; // iOS IAP 商品ID（用于内购发放）
  supportedModels?: string[];
  exclusiveModels?: string[];
  benefits?: PricingBenefits; // 权益（嵌套在 pricing 项内）
  advantages?: AdvantageItem[]; // 优势列表（嵌套在 pricing 项内）
}

export interface AllowedModelsConfig {
  include?: string[];
  exclude?: string[];
  description?: string;
}

export interface FeaturesConfig {
  highSpeedChannel: boolean;
  highSpeedChannelDescription?: string;
  exclusiveModels?: string[];
  multiImageUpload: boolean;
  imageGeneration?: boolean;
  multiDocumentUpload: boolean;
  unlimitedDocumentParsing: boolean;
  webVersionAccess: boolean;
  advancedDataAnalysis: boolean;
  deepResearch?: boolean;
  deepResearchModel?: string;
  webAccess?: boolean; // 兼容旧字段
}

export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay?: number;
}

export interface PlanBenefits {
  monthlyCredits: number;
  creditsLabel?: string;
  creditsDescription?: string;
  allowedModels?: AllowedModelsConfig;
  features?: FeaturesConfig;
  rateLimit?: RateLimitConfig;
}

export interface ModelInfo {
  modelId: string;
  name: string;
  icon?: string;
  isPlaceholder?: boolean;
}

export interface AdvantageItem {
  title: string;
  description?: string;
  items?: string[];
  models?: ModelInfo[];
  icon?: string;
}

export interface ButtonText {
  monthly: string;
  annual: string;
  onetime: string;
}

export interface SubscriptionPlan {
  id: string;
  planId: string;
  name: string;
  duration: number; // 有效期天数
  billingCycle: 'monthly' | 'annual' | 'onetime'; // 计费周期
  pricing: PricingItem[]; // 价格配置数组
  sortOrder?: number;
  isPopular?: boolean;
  status: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface SubscriptionPlanListResponse {
  data: {
    items: SubscriptionPlan[];
    pagination?: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface SubscriptionPlanDetailResponse {
  data: SubscriptionPlan;
}
