import { authService } from './auth';
import { authUtils } from '../utils/auth';
import { isLoginPage } from '../utils/routing';
export const authProvider = {
    login: async ({ username, password }) => {
        try {
            await authService.login({ username, password });
            return Promise.resolve();
        }
        catch (error) {
            return Promise.reject(new Error(error.response?.data?.message || '登录失败，请检查用户名和密码'));
        }
    },
    logout: () => {
        authService.logout();
        return Promise.resolve();
    },
    checkError: (error) => {
        // 如果是网络错误（CORS、连接失败等），不处理认证逻辑
        if (!error.status && (error.message?.includes('Failed to fetch') || error.message?.includes('Network'))) {
            // 网络错误，可能是后端未启动或 CORS 问题，不处理认证
            return Promise.resolve();
        }
        // 401 未授权：清除 token 并跳转登录
        if (error.status === 401) {
            authUtils.removeToken();
            return Promise.reject();
        }
        // 403 禁止访问：权限不足，但不应该清除 token 和跳转登录
        // 应该显示友好的错误提示，让用户知道没有权限
        if (error.status === 403) {
            // 不 reject，让错误继续传播，由页面组件处理
            // 这样可以在页面上显示"无权限"提示，而不是跳转到登录页
            return Promise.resolve();
        }
        return Promise.resolve();
    },
    checkAuth: async () => {
        const onLoginPage = isLoginPage();
        const token = authUtils.getToken();
        // 调试信息（开发环境）- 使用 console.log 确保能看到
        if (import.meta.env.DEV) {
            console.log('[checkAuth] 开始检查认证', {
                pathname: window.location.pathname,
                hash: window.location.hash,
                fullUrl: window.location.href,
                onLoginPage,
                hasToken: !!token,
            });
        }
        // 如果没有 token
        if (!token) {
            // 无论是否在登录页，都返回 reject，让 React Admin 显示登录页
            // 如果在登录页，React Admin 会显示登录页组件
            // 如果不在登录页，React Admin 会重定向到登录页
            return Promise.reject({ redirectTo: '/login' }); // React Admin 会自动转换为 #/login
        }
        // 如果有 token，检查是否在登录页
        if (onLoginPage) {
            // 在登录页且有 token，验证 token 是否有效
            try {
                // 尝试验证 token
                await authService.getMe();
                // Token 有效，允许继续（React Admin 会自动重定向到主页）
                return Promise.resolve();
            }
            catch (error) {
                // Token 无效或网络错误
                if (error.response?.status === 401) {
                    // Token 无效，清除并拒绝认证（显示登录页）
                    authUtils.removeToken();
                    return Promise.reject({ redirectTo: '/login' }); // React Admin 会自动转换为 #/login
                }
                // 网络错误，如果有缓存信息，允许继续（可能是后端暂时不可用）
                const adminInfo = authUtils.getAdminInfo();
                if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || !error.response) {
                    // 网络错误时，如果有缓存信息，允许继续
                    if (adminInfo && adminInfo.id) {
                        return Promise.resolve();
                    }
                    // 没有缓存信息，拒绝认证（显示登录页）
                    return Promise.reject({ redirectTo: '/login' }); // React Admin 会自动转换为 #/login
                }
                // 其他错误，如果有缓存信息，允许继续
                if (adminInfo && adminInfo.id) {
                    return Promise.resolve();
                }
                // 没有缓存信息，拒绝认证（显示登录页）
                return Promise.reject({ redirectTo: '/login' }); // React Admin 会自动转换为 #/login
            }
        }
        // 如果有缓存的 adminInfo，直接返回成功，不验证 token
        // 这样可以避免在网络错误时触发重定向
        const adminInfo = authUtils.getAdminInfo();
        if (adminInfo && adminInfo.id) {
            // 异步验证 token（不阻塞，静默处理）
            authService.getMe().catch((err) => {
                // 如果是网络错误（CORS、后端未启动等），不处理
                if (err.code === 'ERR_NETWORK' || err.code === 'ECONNABORTED' || !err.response) {
                    return;
                }
                // 如果验证失败（401），清除 token
                if (err.response?.status === 401) {
                    authUtils.removeToken();
                }
            });
            return Promise.resolve();
        }
        // 如果没有缓存，尝试验证 token
        // 但如果网络错误，允许继续（使用缓存的 token）
        try {
            await authService.getMe();
            return Promise.resolve();
        }
        catch (error) {
            // 如果是网络错误（CORS、后端未启动等），允许继续
            // 因为可能是后端暂时不可用，不应该强制登出
            if (error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED' || !error.response) {
                // 网络错误时，如果有 token，允许继续（可能是后端暂时不可用）
                console.warn('网络错误，但保留认证状态:', error.message);
                return Promise.resolve();
            }
            // Token 无效（401），清除并重定向到登录页
            if (error.response?.status === 401) {
                authUtils.removeToken();
                return Promise.reject({ redirectTo: '/login' }); // React Admin 会自动转换为 #/login
            }
            // 其他错误，也允许继续（可能是临时错误）
            console.warn('认证检查失败，但允许继续:', error.message);
            return Promise.resolve();
        }
    },
    getPermissions: () => {
        const adminInfo = authUtils.getAdminInfo();
        return Promise.resolve(adminInfo?.permissions || []);
    },
    getIdentity: async () => {
        try {
            // 优先使用缓存的 adminInfo
            const adminInfo = authUtils.getAdminInfo();
            if (adminInfo && adminInfo.id) {
                return {
                    id: adminInfo.id,
                    fullName: adminInfo.username || adminInfo.email,
                    avatar: undefined,
                };
            }
            // 如果缓存不存在，从服务器获取
            const response = await authService.getMe();
            return {
                id: response.data.id,
                fullName: response.data.username || response.data.email,
                avatar: undefined,
            };
        }
        catch (error) {
            // 如果获取失败，清除 token
            authUtils.removeToken();
            throw error;
        }
    },
};
