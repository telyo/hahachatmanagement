import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { List, Datagrid, TextField, EmailField, DateField, Filter, TextInput, SelectInput, FunctionField } from 'react-admin';
import { formatUtils } from '../../utils/format';
import { useState } from 'react';
import { IconButton, Box } from '@mui/material';
import { Visibility as VisibilityIcon } from '@mui/icons-material';
import { RequestParamsDialog } from './RequestParamsDialog';
const AuditLogFilter = (props) => (_jsxs(Filter, { ...props, children: [_jsx(TextInput, { source: "adminId", label: "\u7BA1\u7406\u5458ID" }), _jsx(TextInput, { source: "action", label: "\u64CD\u4F5C\u7C7B\u578B" }), _jsx(SelectInput, { source: "resource", label: "\u8D44\u6E90\u7C7B\u578B", choices: [
                { id: 'user', name: '用户' },
                { id: 'order', name: '订单' },
                { id: 'subscription', name: '订阅' },
                { id: 'ai_model', name: 'AI模型' },
                { id: 'feedback', name: '反馈' },
                { id: 'admin', name: '管理员' },
                { id: 'api_logger_config', name: 'API日志配置' },
            ] }), _jsx(SelectInput, { source: "status", label: "\u72B6\u6001", choices: [
                { id: 'success', name: '成功' },
                { id: 'failed', name: '失败' },
                { id: 'partial', name: '部分成功' },
            ] })] }));
// 操作类型映射
const actionMap = {
    'login': '登录',
    'change_password': '修改密码',
    'create_admin': '创建管理员',
    'update_admin': '更新管理员',
    'delete_admin': '删除管理员',
    'update_admin_status': '更新管理员状态',
    'add_balance': '增加积分',
    'deduct_balance': '减少积分',
    'update_status': '更新状态',
    'refund': '退款',
    'update': '更新',
    'create': '创建',
    'delete': '删除',
    'test': '测试',
    'import': '导入',
    'export': '导出',
    'update_feedback': '更新反馈',
    'reset': '重置',
};
// 资源类型映射
const resourceMap = {
    'user': '用户',
    'order': '订单',
    'subscription': '订阅',
    'ai_model': 'AI模型',
    'feedback': '反馈',
    'admin': '管理员',
    'api_logger_config': 'API日志配置',
};
export const AuditLogList = () => {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [dialogParams, setDialogParams] = useState(null);
    return (_jsxs(_Fragment, { children: [_jsx(List, { filters: _jsx(AuditLogFilter, {}), sort: { field: 'createdAt', order: 'DESC' }, children: _jsxs(Datagrid, { rowClick: false, bulkActionButtons: false, children: [_jsx(TextField, { source: "id", label: "\u65E5\u5FD7ID" }), _jsx(EmailField, { source: "adminEmail", label: "\u7BA1\u7406\u5458\u90AE\u7BB1" }), _jsx(TextField, { source: "action", label: "\u64CD\u4F5C", transform: (action) => actionMap[action] || action }), _jsx(TextField, { source: "resource", label: "\u8D44\u6E90\u7C7B\u578B", transform: (resource) => resourceMap[resource] || resource }), _jsx(TextField, { source: "resourceId", label: "\u8D44\u6E90ID" }), _jsx(TextField, { source: "status", label: "\u72B6\u6001", transform: (status) => formatUtils.status(status) }), _jsx(TextField, { source: "ipAddress", label: "IP\u5730\u5740" }), _jsx(DateField, { source: "createdAt", label: "\u65F6\u95F4", showTime: true }), _jsx(FunctionField, { label: "\u8BF7\u6C42\u53C2\u6570", render: (record) => {
                                // 调试：打印记录数据
                                if (import.meta.env.DEV) {
                                    console.log('AuditLog record in FunctionField:', record);
                                    console.log('requestParams:', record?.requestParams);
                                }
                                const hasRequestParams = record?.requestParams && record.requestParams.trim() !== '';
                                if (!hasRequestParams) {
                                    return _jsx(Box, { sx: { width: 40 } }); // 占位，保持列宽一致
                                }
                                return (_jsx(IconButton, { onClick: (e) => {
                                        e.stopPropagation();
                                        setDialogParams(record.requestParams);
                                        setDialogOpen(true);
                                    }, size: "small", title: "\u67E5\u770B\u8BF7\u6C42\u53C2\u6570", sx: { color: 'primary.main' }, children: _jsx(VisibilityIcon, { fontSize: "small" }) }));
                            } })] }) }), _jsx(RequestParamsDialog, { open: dialogOpen, onClose: () => setDialogOpen(false), requestParams: dialogParams })] }));
};
