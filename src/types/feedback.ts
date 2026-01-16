export interface Feedback {
  id: string;
  userId: string;
  type: 'bug' | 'feature' | 'complaint' | 'other';
  category?: string;
  title: string;
  content: string;
  status: 'pending' | 'processing' | 'resolved' | 'closed';
  createdAt: string;
  updatedAt: string;
  adminReply?: string;
  repliedAt?: string;
}

export interface FeedbackListResponse {
  data: {
    items: Feedback[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface FeedbackDetailResponse {
  data: Feedback;
}

