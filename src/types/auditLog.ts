export interface AuditLog {
  id: string;
  adminId: string;
  adminUsername: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  description: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface AuditLogListResponse {
  data: {
    items: AuditLog[];
    pagination: {
      page: number;
      pageSize: number;
      total: number;
      totalPages: number;
    };
  };
}

