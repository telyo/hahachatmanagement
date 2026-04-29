export interface User {
  id: string;
  email: string;
  phone?: string;
  username?: string;
  status: 'active' | 'inactive' | 'suspended';
  createdAt: string;
  updatedAt: string;
  credits?: number;
  virtualCurrency?: {
    balance: number;
  };
  subscription?: {
    planId: string;
    planName: string;
    status: string;
    renewalStatus?: 'auto_renew' | 'onetime' | 'cancelled';
    startDate?: string;
    endDate?: string;
    expiresAt?: string; // 兼容旧字段
  };
  /** 首次登录平台：win | mac | ios | android */
  firstLoginPlatform?: string;
}

export interface UserListResponse {
  data: {
    items: User[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface UserDetailResponse {
  data: User;
}

