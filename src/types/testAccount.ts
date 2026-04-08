export interface TestAccount {
  id: string; // userId
  userId?: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending_deletion';
  isTestAccount?: boolean;
  createdAt?: string;
  updatedAt?: string;
  virtualCurrency?: {
    totalBalance?: number;
  };
}

