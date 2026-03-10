import { Menu as RAdminMenu, usePermissions } from 'react-admin';
import { canAccessResource, hasPermission } from '../../utils/permissions';
import { authUtils } from '../../utils/auth';

export const Menu = () => {
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const userRole = adminInfo?.role;

  // 检查是否有仪表盘权限
  const canAccessDashboard = hasPermission(permissions, 'dashboard:read', userRole);
  
  // 检查版本管理权限
  const canAccessAppVersions = canAccessResource(permissions, 'app-versions', userRole);
  
  // 调试：检查版本管理权限
  if (import.meta.env.DEV) {
    console.log('[Menu] 版本管理权限检查:', {
      userRole,
      permissions: Array.isArray(permissions) ? permissions : 'not array',
      canAccessAppVersions,
      adminInfo,
      requiredPermissions: ['app_versions:read'],
    });
  }

  return (
    <RAdminMenu>
      {/* 仪表盘 - 需要 dashboard:read 权限 */}
      {canAccessDashboard && (
        <RAdminMenu.Item
          to="/"
          primaryText="仪表盘"
          leftIcon={<span>📊</span>}
        />
      )}
      
      {/* 用户管理 */}
      {canAccessResource(permissions, 'users', userRole) && (
        <RAdminMenu.Item
          to="/users"
          primaryText="用户管理"
          leftIcon={<span>👥</span>}
        />
      )}
      
      {/* 订单管理 */}
      {canAccessResource(permissions, 'orders', userRole) && (
        <RAdminMenu.Item
          to="/orders"
          primaryText="订单管理"
          leftIcon={<span>🛒</span>}
        />
      )}
      
      {/* 套餐管理 */}
      {canAccessResource(permissions, 'subscription-plans', userRole) && (
        <RAdminMenu.Item
          to="/subscription-plans"
          primaryText="套餐管理"
          leftIcon={<span>💳</span>}
        />
      )}
      
      {/* AI 模型 */}
      {canAccessResource(permissions, 'ai-models', userRole) && (
        <RAdminMenu.Item
          to="/ai-models"
          primaryText="AI模型"
          leftIcon={<span>🤖</span>}
        />
      )}
      
      {/* AI 使用统计 */}
      {canAccessResource(permissions, 'ai-usage', userRole) && (
        <RAdminMenu.Item
          to="/ai-usage"
          primaryText="AI使用统计"
          leftIcon={<span>📈</span>}
        />
      )}
      
      {/* 反馈管理 */}
      {canAccessResource(permissions, 'feedback', userRole) && (
        <RAdminMenu.Item
          to="/feedback"
          primaryText="反馈管理"
          leftIcon={<span>💬</span>}
        />
      )}
      
      {/* 操作日志 */}
      {canAccessResource(permissions, 'audit-logs', userRole) && (
        <RAdminMenu.Item
          to="/audit-logs"
          primaryText="操作日志"
          leftIcon={<span>📝</span>}
        />
      )}
      
      {/* API 日志配置 */}
      {canAccessResource(permissions, 'api-logger', userRole) && (
        <RAdminMenu.Item
          to="/api-logger"
          primaryText="API日志配置"
          leftIcon={<span>⚙️</span>}
        />
      )}
      
      {/* 管理员管理 */}
      {canAccessResource(permissions, 'admins', userRole) && (
        <RAdminMenu.Item
          to="/admins"
          primaryText="管理员管理"
          leftIcon={<span>👤</span>}
        />
      )}
      
      {/* 客户端提供商管理 */}
      {canAccessResource(permissions, 'client-providers', userRole) && (
        <RAdminMenu.Item
          to="/client-providers"
          primaryText="客户端提供商管理"
          leftIcon={<span>☁️</span>}
        />
      )}
      
      {/* Hahachat 提供商管理 */}
      {canAccessResource(permissions, 'hahachat-providers', userRole) && (
        <RAdminMenu.Item
          to="/hahachat-providers"
          primaryText="Hahachat 提供商管理"
          leftIcon={<span>🔧</span>}
        />
      )}
      
      {/* 联网搜索配置 */}
      {canAccessResource(permissions, 'web-search', userRole) && (
        <RAdminMenu.Item
          to="/web-search/config"
          primaryText="联网搜索配置"
          leftIcon={<span>🔍</span>}
        />
      )}
      
      {/* 积分兑换管理 */}
      {canAccessResource(permissions, 'credit-exchange', userRole) && (
        <RAdminMenu.Item
          to="/credit-exchange"
          primaryText="积分兑换"
          leftIcon={<span>🎁</span>}
        />
      )}

      {/* 版本管理 */}
      {canAccessAppVersions && (
        <RAdminMenu.Item
          to="/app-versions"
          primaryText="版本管理"
          leftIcon={<span>📱</span>}
        />
      )}
    </RAdminMenu>
  );
};

