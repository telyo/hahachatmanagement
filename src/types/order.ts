export interface Order {
  id: string;
  orderId: string;
  userId: string;
  planId?: string;
  pricingType?: string;
  billingCycle?: string;
  type: 'subscription' | 'virtual_currency';
  status: 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded';
  amount: number;
  currency: string;
  paymentMethod?: string;
  createdAt: string;
  updatedAt: string;
  paidAt?: string;
  refundedAt?: string;
  refundAmount?: number;
  items?: OrderItem[];
  plan?: OrderPlanInfo;
  user?: OrderUserInfo;
}

export interface OrderPlanInfo {
  planId: string;
  name: string;
}

export interface OrderUserInfo {
  userId: string;
  email: string;
  phone?: string;
}

export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface OrderListResponse {
  data: {
    items: Order[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface OrderDetailResponse {
  data: Order;
}

