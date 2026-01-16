const TOKEN_KEY = 'admin_token';
const ADMIN_INFO_KEY = 'admin_info';
export const authUtils = {
    getToken() {
        return localStorage.getItem(TOKEN_KEY);
    },
    setToken(token) {
        localStorage.setItem(TOKEN_KEY, token);
    },
    removeToken() {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(ADMIN_INFO_KEY);
    },
    getAdminInfo() {
        const info = localStorage.getItem(ADMIN_INFO_KEY);
        return info ? JSON.parse(info) : null;
    },
    setAdminInfo(info) {
        localStorage.setItem(ADMIN_INFO_KEY, JSON.stringify(info));
    },
    isAuthenticated() {
        return !!this.getToken();
    },
};
