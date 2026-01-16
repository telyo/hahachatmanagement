import apiClient from './api';
import { LoginRequest, LoginResponse, AdminInfoResponse } from '../types/auth';
import { authUtils } from '../utils/auth';

export const authService = {
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    // 后端期望的是 email 和 password，但前端传的是 username
    const response = await apiClient.post<LoginResponse>('/admin/auth/login', {
      email: credentials.username, // 将 username 映射为 email
      password: credentials.password,
    });
    const { token, admin } = response.data.data;
    authUtils.setToken(token);
    // 确保 admin 信息格式正确
    if (admin) {
      authUtils.setAdminInfo({
        id: admin.id || admin.adminId,
        username: admin.name || admin.username,
        email: admin.email,
        role: admin.role, // 保存角色信息
        permissions: admin.permissions || [],
      });
    }
    return response.data;
  },

  async getMe(): Promise<AdminInfoResponse> {
    const response = await apiClient.get<AdminInfoResponse>('/admin/auth/me');
    authUtils.setAdminInfo(response.data.data);
    return response.data;
  },

  logout(): void {
    authUtils.removeToken();
    window.location.href = '/#/login';
  },
};

