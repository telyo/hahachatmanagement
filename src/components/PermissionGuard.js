import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { usePermissions } from 'react-admin';
import { Alert } from '@mui/material';
import { hasPermission } from '../utils/permissions';
import { authUtils } from '../utils/auth';
/**
 * 权限保护组件
 * 如果用户没有指定权限，显示 fallback 或默认提示
 */
export const PermissionGuard = ({ permission, children, fallback }) => {
    const { permissions } = usePermissions();
    const adminInfo = authUtils.getAdminInfo();
    const hasAccess = hasPermission(permissions, permission, adminInfo?.role);
    if (!hasAccess) {
        if (fallback) {
            return _jsx(_Fragment, { children: fallback });
        }
        return (_jsx(Alert, { severity: "warning", sx: { m: 2 }, children: "\u60A8\u6CA1\u6709\u6743\u9650\u8BBF\u95EE\u6B64\u529F\u80FD\u3002\u5982\u9700\u4F7F\u7528\uFF0C\u8BF7\u8054\u7CFB\u8D85\u7EA7\u7BA1\u7406\u5458\u3002" }));
    }
    return _jsx(_Fragment, { children: children });
};
