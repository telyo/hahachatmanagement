import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { List, Datagrid, TextField, ImageField, DateField, EditButton, ShowButton, Filter, SelectInput, usePermissions, TopToolbar, CreateButton, ExportButton } from 'react-admin';
import { formatUtils } from '../../utils/format';
import { hasPermission } from '../../utils/permissions';
import { authUtils } from '../../utils/auth';
import { Upload as UploadIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Button, Box, Typography } from '@mui/material';
// 导出为 JSON 格式，与导入接口格式一致 { providers: [...] }
const clientProviderJsonExporter = (records) => {
    const providers = records.map((record) => ({
        providerCode: record.providerCode ?? '',
        displayName: record.displayName ?? '',
        baseUrl: record.baseUrl ?? '',
        defaultModel: record.defaultModel ?? '',
        modelList: record.modelList ?? [],
        sortOrder: record.sortOrder ?? 0,
        isHahachat: record.isHahachat ?? false,
        loginUrl: record.loginUrl ?? '',
        subscriptionUrl: record.subscriptionUrl ?? '',
        ...(record.statusConfig && Object.keys(record.statusConfig).length > 0 ? { statusConfig: record.statusConfig } : {}),
    }));
    const exportData = { providers };
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `client-providers-export-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
};
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
    // 强制输出调试日志（即使不在 DEV 模式）
    console.log('[ClientProviderList] ListActions 组件被渲染', {
        canWrite,
        userRole,
        permissions: Array.isArray(permissions) ? permissions : 'not array',
        adminInfo,
        timestamp: new Date().toISOString(),
    });
    return (_jsxs(TopToolbar, { children: [canWrite && _jsx(CreateButton, {}), canWrite && (_jsx(Button, { variant: "contained", color: "primary", startIcon: _jsx(UploadIcon, {}), onClick: () => {
                    console.log('[ClientProviderList] 点击导入按钮');
                    navigate('/client-providers-import');
                }, sx: { ml: 1 }, children: "\u5BFC\u5165\u63D0\u4F9B\u5546" })), _jsx(ExportButton, {})] }));
};
// 空状态组件
const EmptyState = () => {
    const navigate = useNavigate();
    const { permissions } = usePermissions();
    const adminInfo = authUtils.getAdminInfo();
    const userRole = adminInfo?.role;
    const canWrite = hasPermission(permissions, 'client_providers:write', userRole);
    // 强制输出调试日志（即使不在 DEV 模式）
    console.log('[ClientProviderList] EmptyState 组件被渲染', {
        canWrite,
        userRole,
        permissions: Array.isArray(permissions) ? permissions : 'not array',
        adminInfo,
        timestamp: new Date().toISOString(),
    });
    if (!canWrite) {
        console.log('[ClientProviderList] EmptyState: 没有写权限，返回 null');
        return null; // 如果没有写权限，使用默认空状态
    }
    console.log('[ClientProviderList] EmptyState: 渲染空状态 UI');
    return (_jsxs(Box, { sx: { textAlign: 'center', py: 5 }, children: [_jsx(Typography, { variant: "h6", color: "text.secondary", gutterBottom: true, children: "\u8FD8\u6CA1\u6709\u5BA2\u6237\u63D0\u4F9B\u5546" }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 3 }, children: "\u60A8\u53EF\u4EE5\u521B\u5EFA\u65B0\u7684\u63D0\u4F9B\u5546\u6216\u6279\u91CF\u5BFC\u5165\u63D0\u4F9B\u5546\u914D\u7F6E" }), _jsxs(Box, { sx: { display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }, children: [_jsx(CreateButton, {}), _jsx(Button, { variant: "contained", color: "primary", startIcon: _jsx(UploadIcon, {}), onClick: () => {
                            console.log('[ClientProviderList] EmptyState 点击导入按钮');
                            navigate('/client-providers-import');
                        }, children: "\u5BFC\u5165\u63D0\u4F9B\u5546" })] })] }));
};
export const ClientProviderList = () => {
    const { permissions } = usePermissions();
    const adminInfo = authUtils.getAdminInfo();
    const userRole = adminInfo?.role;
    // 检查是否有 client_providers:read 权限（超级管理员自动有所有权限）
    const canRead = hasPermission(permissions, 'client_providers:read', userRole);
    // 强制输出调试日志
    console.log('[ClientProviderList] 主组件被渲染', {
        canRead,
        userRole,
        permissions: Array.isArray(permissions) ? permissions : 'not array',
        adminInfo,
        timestamp: new Date().toISOString(),
    });
    if (!canRead) {
        return _jsx("div", { children: "\u65E0\u6743\u9650\u8BBF\u95EE\u6B64\u9875\u9762" });
    }
    console.log('[ClientProviderList] 渲染 List 组件，empty prop:', typeof EmptyState);
    return (_jsx(List, { filters: _jsx(ClientProviderFilter, {}), actions: _jsx(ListActions, {}), empty: _jsx(EmptyState, {}), exporter: clientProviderJsonExporter, children: _jsxs(Datagrid, { rowClick: "show", children: [_jsx(ImageField, { source: "iconUrl", label: "\u56FE\u6807", sx: { '& img': { maxWidth: 40, maxHeight: 40 } } }), _jsx(TextField, { source: "providerCode", label: "\u63D0\u4F9B\u5546\u4EE3\u7801" }), _jsx(TextField, { source: "displayName", label: "\u663E\u793A\u540D\u79F0" }), _jsx(TextField, { source: "baseUrl", label: "API URL" }), _jsx(TextField, { source: "defaultModel", label: "\u9ED8\u8BA4\u6A21\u578B" }), _jsx(TextField, { source: "status", label: "\u72B6\u6001", format: (status) => formatUtils.status(status) }), _jsx(TextField, { source: "sortOrder", label: "\u6392\u5E8F" }), _jsx(DateField, { source: "createdAt", label: "\u521B\u5EFA\u65F6\u95F4", showTime: true }), _jsx(ShowButton, {}), _jsx(EditButton, {})] }) }));
};
