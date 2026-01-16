import { ReactNode } from 'react';
import { usePermissions } from 'react-admin';
import { Alert } from '@mui/material';
import { hasPermission } from '../utils/permissions';
import { authUtils } from '../utils/auth';

interface PermissionGuardProps {
  permission: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * 权限保护组件
 * 如果用户没有指定权限，显示 fallback 或默认提示
 */
export const PermissionGuard = ({ permission, children, fallback }: PermissionGuardProps) => {
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const hasAccess = hasPermission(permissions, permission, adminInfo?.role);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return (
      <Alert severity="warning" sx={{ m: 2 }}>
        您没有权限访问此功能。如需使用，请联系超级管理员。
      </Alert>
    );
  }

  return <>{children}</>;
};

