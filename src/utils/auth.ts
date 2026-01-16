const TOKEN_KEY = 'admin_token';
const ADMIN_INFO_KEY = 'admin_info';

export const authUtils = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(ADMIN_INFO_KEY);
  },

  getAdminInfo(): any | null {
    const info = localStorage.getItem(ADMIN_INFO_KEY);
    return info ? JSON.parse(info) : null;
  },

  setAdminInfo(info: any): void {
    localStorage.setItem(ADMIN_INFO_KEY, JSON.stringify(info));
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },
};

