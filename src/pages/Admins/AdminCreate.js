import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Create, SimpleForm, TextInput, PasswordInput, SelectInput, CheckboxGroupInput, useNotify, useRedirect } from 'react-admin';
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
const AdminCreate = () => {
    const notify = useNotify();
    const redirect = useRedirect();
    const handleSave = async (data) => {
        try {
            // 确保 role 默认为 admin（普通管理员）
            if (!data.role) {
                data.role = 'admin';
            }
            // 如果没有选择权限，使用空数组
            if (!data.permissions) {
                data.permissions = [];
            }
            await apiClient.post('/admin/admins', data);
            notify('管理员创建成功', { type: 'success' });
            redirect('list', 'admins');
        }
        catch (error) {
            const errorMessage = error?.response?.data?.message || '创建失败';
            notify(errorMessage, { type: 'error' });
        }
    };
    return (_jsx(Create, { children: _jsxs(SimpleForm, { onSubmit: handleSave, children: [_jsx(TextInput, { source: "email", label: "\u90AE\u7BB1", required: true }), _jsx(PasswordInput, { source: "password", label: "\u5BC6\u7801", required: true, helperText: "\u81F3\u5C118\u4F4D\u5B57\u7B26" }), _jsx(TextInput, { source: "name", label: "\u59D3\u540D", required: true }), _jsx(SelectInput, { source: "role", label: "\u89D2\u8272", choices: [
                        { id: 'admin', name: '普通管理员' },
                    ], defaultValue: "admin", disabled: true, helperText: "\u53EA\u80FD\u521B\u5EFA\u666E\u901A\u7BA1\u7406\u5458" }), _jsx(CheckboxGroupInput, { source: "permissions", label: "\u6743\u9650\u914D\u7F6E", choices: ALL_PERMISSIONS, optionText: "name", optionValue: "id" })] }) }));
};
export default AdminCreate;
