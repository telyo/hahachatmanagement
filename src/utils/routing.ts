/**
 * 路由工具函数
 * 用于统一处理路由相关的检查逻辑
 */

/**
 * 检查当前是否在登录页
 * React Admin 使用 hash 路由，登录页的实际路径是 #/login
 * 支持多种路径格式：
 * - #/login（标准格式）
 * - /#/login（带 pathname）
 * - /login#/login（兼容格式）
 */
export const isLoginPage = (): boolean => {
  const pathname = window.location.pathname;
  const hash = window.location.hash;
  const fullUrl = window.location.href;
  
  // 调试信息（开发环境）- 使用 console.log 确保能看到
  if (import.meta.env.DEV) {
    console.log('[isLoginPage] 检查登录页', { 
      pathname, 
      hash, 
      fullUrl,
      hashIsLogin: hash === '#/login' || hash.startsWith('#/login'),
    });
  }
  
  // React Admin 使用 hash 路由，登录页的 hash 是 #/login
  // 优先检查 hash（这是 React Admin 的标准格式）
  if (hash === '#/login' || hash.startsWith('#/login')) {
    if (import.meta.env.DEV) {
      console.log('[isLoginPage] 匹配：hash 是 #/login');
    }
    return true;
  }
  
  // 兼容检查：pathname 是 /login 且 hash 是 #/login（这种情况不应该出现，但为了兼容性保留）
  if (pathname === '/login' && (hash === '#/login' || hash.startsWith('#/login'))) {
    if (import.meta.env.DEV) {
      console.log('[isLoginPage] 匹配：pathname /login + hash #/login');
    }
    return true;
  }
  
  if (import.meta.env.DEV) {
    console.log('[isLoginPage] 未匹配任何登录页条件');
  }
  
  return false;
};

