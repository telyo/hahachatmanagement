import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { List, Datagrid, TextField, ImageField, DateField, EditButton, ShowButton, Filter, SelectInput, usePermissions, TopToolbar, CreateButton, ExportButton } from 'react-admin';
import { formatUtils } from '../../utils/format';
import { hasPermission } from '../../utils/permissions';
import { authUtils } from '../../utils/auth';
import { Upload as UploadIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
const ClientProviderFilter = (props) => (_jsx(Filter, { ...props, children: _jsx(SelectInput, { source: "status", label: "\u72B6\u6001", choices: [
            { id: 'active', name: '活跃' },
            { id: 'inactive', name: '未激活' },
        ] }) }));
const ListActions = () => {
    const navigate = useNavigate();
    const { permissions } = usePermissions();
    const adminInfo = authUtils.getAdminInfo();
    const userRole = adminInfo?.role;
    // 检查是否有 client_providers:write 权限（超级管理员自动有所有权限）
    const canWrite = hasPermission(permissions, 'client_providers:write', userRole);
    // 调试日志
    if (import.meta.env.DEV) {
        console.log('[ClientProviderList] ListActions', {
            canWrite,
            userRole,
            permissions: Array.isArray(permissions) ? permissions : 'not array',
            adminInfo,
        });
    }
    return (_jsxs(TopToolbar, { children: [canWrite && _jsx(CreateButton, {}), _jsx(Button, { variant: "contained", color: "primary", startIcon: _jsx(UploadIcon, {}), onClick: () => {
                    console.log('[ClientProviderList] 点击导入按钮');
                    navigate('/client-providers-import');
                }, sx: { ml: 1 }, children: "\u5BFC\u5165\u63D0\u4F9B\u5546" }), _jsx(ExportButton, {})] }));
};
export const ClientProviderList = () => {
    const { permissions } = usePermissions();
    const adminInfo = authUtils.getAdminInfo();
    const userRole = adminInfo?.role;
    // 检查是否有 client_providers:read 权限（超级管理员自动有所有权限）
    const canRead = hasPermission(permissions, 'client_providers:read', userRole);
    if (!canRead) {
        return _jsx("div", { children: "\u65E0\u6743\u9650\u8BBF\u95EE\u6B64\u9875\u9762" });
    }
    return (_jsx(List, { filters: _jsx(ClientProviderFilter, {}), actions: _jsx(ListActions, {}), children: _jsxs(Datagrid, { rowClick: "show", children: [_jsx(ImageField, { source: "iconUrl", label: "\u56FE\u6807", sx: { '& img': { maxWidth: 40, maxHeight: 40 } } }), _jsx(TextField, { source: "providerCode", label: "\u63D0\u4F9B\u5546\u4EE3\u7801" }), _jsx(TextField, { source: "displayName", label: "\u663E\u793A\u540D\u79F0" }), _jsx(TextField, { source: "baseUrl", label: "API URL" }), _jsx(TextField, { source: "defaultModel", label: "\u9ED8\u8BA4\u6A21\u578B" }), _jsx(TextField, { source: "status", label: "\u72B6\u6001", format: (status) => formatUtils.status(status) }), _jsx(TextField, { source: "sortOrder", label: "\u6392\u5E8F" }), _jsx(DateField, { source: "createdAt", label: "\u521B\u5EFA\u65F6\u95F4", showTime: true }), _jsx(ShowButton, {}), _jsx(EditButton, {})] }) }));
};
