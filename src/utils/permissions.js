/**
 * 权限工具函数
 * 处理权限的包含关系和检查逻辑
 */
/**
 * 权限包含关系映射
 * 如果用户有 write 权限，自动包含 read 权限
 */
const PERMISSION_INCLUDES = {
    'users:write': ['users:read'],
    'orders:write': ['orders:read'],
    'orders:refund': ['orders:read'],
    'subscriptions:write': ['subscriptions:read'],
    'ai_models:write': ['ai_models:read'],
    'ai_models:import_export': ['ai_models:read'],
    'ai_models:manage_api_keys': ['ai_models:read'],
    'feedback:write': ['feedback:read'],
    'admins:write': ['admins:read'],
    'api_logger:write': ['api_logger:read'],
    'client_providers:write': ['client_providers:read'],
    'app_versions:write': ['app_versions:read'],
    'credit_exchange:write': ['credit_exchange:read'],
};
/**
 * 检查用户是否有指定权限
 * 考虑权限的包含关系（如 write 包含 read）
 * @param userPermissions 用户拥有的权限列表
 * @param requiredPermission 需要检查的权限
 * @param userRole 用户角色（可选，用于判断超级管理员）
 * @returns 是否有权限
 */
export function hasPermission(userPermissions, requiredPermission, userRole) {
    // 超级管理员有所有权限
    if (userRole === 'super_admin') {
        return true;
    }
    // 如果没有权限列表，返回 false
    if (!userPermissions || userPermissions.length === 0) {
        return false;
    }
    // 直接检查权限
    if (userPermissions.includes(requiredPermission)) {
        return true;
    }
    // 检查权限包含关系
    // 如果用户有包含该权限的更高权限，也返回 true
    for (const [higherPermission, includedPermissions] of Object.entries(PERMISSION_INCLUDES)) {
        if (userPermissions.includes(higherPermission)) {
            if (includedPermissions.includes(requiredPermission)) {
                return true;
            }
        }
    }
    return false;
}
/**
 * 检查用户是否有任一权限
 * @param userPermissions 用户拥有的权限列表
 * @param requiredPermissions 需要检查的权限列表（任一即可）
 * @param userRole 用户角色（可选）
 * @returns 是否有任一权限
 */
export function hasAnyPermission(userPermissions, requiredPermissions, userRole) {
    return requiredPermissions.some((permission) => hasPermission(userPermissions, permission, userRole));
}
/**
 * 检查用户是否有所有权限
 * @param userPermissions 用户拥有的权限列表
 * @param requiredPermissions 需要检查的权限列表（全部需要）
 * @param userRole 用户角色（可选）
 * @returns 是否有所有权限
 */
export function hasAllPermissions(userPermissions, requiredPermissions, userRole) {
    return requiredPermissions.every((permission) => hasPermission(userPermissions, permission, userRole));
}
/**
 * 资源权限映射
 * 定义每个资源需要什么权限才能访问
 */
export const RESOURCE_PERMISSIONS = {
    users: ['users:read'],
    orders: ['orders:read'],
    'subscription-plans': ['subscriptions:read'],
    'ai-models': ['ai_models:read'],
    'ai-usage': ['ai_usage:read'],
    feedback: ['feedback:read'],
    'audit-logs': ['audit_logs:read'],
    'api-logger': ['api_logger:read'],
    admins: ['admins:read'],
    'client-providers': ['client_providers:read'],
    'hahachat-providers': ['hahachat_providers:read'],
    'web-search': ['web_search:read'],
    'app-versions': ['app_versions:read'],
    'credit-exchange': ['credit_exchange:read'],
};
/**
 * 检查用户是否可以访问指定资源
 * @param userPermissions 用户拥有的权限列表
 * @param resourceName 资源名称
 * @param userRole 用户角色（可选）
 * @returns 是否可以访问
 */
export function canAccessResource(userPermissions, resourceName, userRole) {
    // 超级管理员有所有权限
    if (userRole === 'super_admin') {
        return true;
    }
    const requiredPermissions = RESOURCE_PERMISSIONS[resourceName];
    if (!requiredPermissions || requiredPermissions.length === 0) {
        // 如果没有定义权限要求，默认允许访问
        return true;
    }
    return hasAnyPermission(userPermissions, requiredPermissions, userRole);
}
