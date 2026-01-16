import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Edit, SimpleForm, TextInput, SelectInput, CheckboxGroupInput, useNotify, useRedirect, usePermissions, useRecordContext } from 'react-admin';
import { Alert } from '@mui/material';
import apiClient from '../../services/api';
// 权限分组定义（与后端保持一致）
const PERMISSION_GROUPS = [
    {
        group: '仪表盘',
        permissions: [
            { id: 'dashboard:read', name: '查看仪表盘' },
        ],
    },
    {
        group: '用户管理',
        permissions: [
            { id: 'users:read', name: '查看用户' },
            { id: 'users:write', name: '编辑用户' },
        ],
    },
    {
        group: '订单管理',
        permissions: [
            { id: 'orders:read', name: '查看订单' },
            { id: 'orders:write', name: '更新订单状态' },
            { id: 'orders:refund', name: '处理退款' },
        ],
    },
    {
        group: '订阅套餐管理',
        permissions: [
            { id: 'subscriptions:read', name: '查看套餐' },
            { id: 'subscriptions:write', name: '编辑套餐' },
        ],
    },
    {
        group: 'AI 模型管理',
        permissions: [
            { id: 'ai_models:read', name: '查看模型' },
            { id: 'ai_models:write', name: '编辑模型' },
            { id: 'ai_models:import_export', name: '导入/导出模型' },
        ],
    },
    {
        group: 'AI 使用统计',
        permissions: [
            { id: 'ai_usage:read', name: '查看使用统计' },
        ],
    },
    {
        group: '反馈管理',
        permissions: [
            { id: 'feedback:read', name: '查看反馈' },
            { id: 'feedback:write', name: '处理反馈' },
        ],
    },
    {
        group: '操作日志',
        permissions: [
            { id: 'audit_logs:read', name: '查看操作日志' },
        ],
    },
    {
        group: '数据统计',
        permissions: [
            { id: 'statistics:read', name: '查看统计数据' },
        ],
    },
];
// 所有权限选项（扁平化）
const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap(group => group.permissions);
const AdminEdit = () => {
    const notify = useNotify();
    const redirect = useRedirect();
    const { permissions } = usePermissions();
    const record = useRecordContext();
    const handleSave = async (data) => {
        try {
            // 如果没有选择权限，使用空数组
            if (!data.permissions) {
                data.permissions = [];
            }
            await apiClient.put(`/admin/admins/${data.id}`, data);
            notify('管理员更新成功', { type: 'success' });
            redirect('list', 'admins');
        }
        catch (error) {
            const errorMessage = error?.response?.data?.message || '更新失败';
            notify(errorMessage, { type: 'error' });
        }
    };
    const hasWritePermission = permissions?.includes('admins:write');
    if (!hasWritePermission) {
        return _jsx("div", { children: "\u65E0\u6743\u9650\u7F16\u8F91\u7BA1\u7406\u5458" });
    }
    // 检查是否是超级管理员
    const isSuperAdmin = record?.role === 'super_admin';
    if (isSuperAdmin) {
        return (_jsx(Edit, { children: _jsxs(SimpleForm, { children: [_jsx(Alert, { severity: "warning", sx: { mb: 2 }, children: "\u8D85\u7EA7\u7BA1\u7406\u5458\u4E0D\u53EF\u88AB\u7F16\u8F91" }), _jsx(TextInput, { source: "id", disabled: true, label: "\u7BA1\u7406\u5458ID" }), _jsx(TextInput, { source: "email", disabled: true, label: "\u90AE\u7BB1" }), _jsx(TextInput, { source: "name", disabled: true, label: "\u59D3\u540D" }), _jsx(SelectInput, { source: "role", label: "\u89D2\u8272", choices: [
                            { id: 'super_admin', name: '超级管理员' },
                            { id: 'admin', name: '普通管理员' },
                        ], disabled: true }), _jsx(SelectInput, { source: "status", label: "\u72B6\u6001", choices: [
                            { id: 'active', name: '活跃' },
                            { id: 'inactive', name: '未激活' },
                            { id: 'suspended', name: '已暂停' },
                        ], disabled: true })] }) }));
    }
    return (_jsx(Edit, { children: _jsxs(SimpleForm, { onSubmit: handleSave, children: [_jsx(TextInput, { source: "id", disabled: true, label: "\u7BA1\u7406\u5458ID" }), _jsx(TextInput, { source: "email", disabled: true, label: "\u90AE\u7BB1" }), _jsx(TextInput, { source: "name", label: "\u59D3\u540D" }), _jsx(SelectInput, { source: "role", label: "\u89D2\u8272", choices: [
                        { id: 'super_admin', name: '超级管理员' },
                        { id: 'admin', name: '普通管理员' },
                    ], disabled: true, helperText: "\u89D2\u8272\u4E0D\u80FD\u4FEE\u6539" }), _jsx(SelectInput, { source: "status", label: "\u72B6\u6001", choices: [
                        { id: 'active', name: '活跃' },
                        { id: 'inactive', name: '未激活' },
                        { id: 'suspended', name: '已暂停' },
                    ] }), _jsx(CheckboxGroupInput, { source: "permissions", label: "\u6743\u9650\u914D\u7F6E", choices: ALL_PERMISSIONS, optionText: "name", optionValue: "id" })] }) }));
};
export default AdminEdit;
