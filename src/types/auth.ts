export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  data: {
    token: string;
    admin: {
      id: string;
      username: string;
      email: string;
      role?: string; // 角色：super_admin 或 admin
      permissions: string[];
    };
  };
}

export interface AdminInfo {
  id: string;
  username: string;
  email: string;
  role?: string; // 角色：super_admin 或 admin
  permissions: string[];
}

export interface AdminInfoResponse {
  data: AdminInfo;
}

