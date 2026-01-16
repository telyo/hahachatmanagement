import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Show, SimpleShowLayout, TextField, NumberField, DateField, Button, useNotify, useRefresh, } from 'react-admin';
import { Box } from '@mui/material';
import apiClient from '../../services/api';
import { formatUtils } from '../../utils/format';
import { useState } from 'react';
const RefundButton = ({ record }) => {
    const notify = useNotify();
    const refresh = useRefresh();
    const [loading, setLoading] = useState(false);
    const handleRefund = async () => {
        if (!window.confirm('确定要退款吗？')) {
            return;
        }
        setLoading(true);
        try {
            await apiClient.post(`/admin/orders/${record.id}/refund`, {
                reason: '管理员操作',
            });
            notify('退款成功', { type: 'success' });
            refresh();
        }
        catch (error) {
            notify(error.response?.data?.message || '退款失败', { type: 'error' });
        }
        finally {
            setLoading(false);
        }
    };
    if (record.status === 'refunded' || record.status === 'partially_refunded') {
        return null;
    }
    return (_jsx(Button, { label: "\u9000\u6B3E", onClick: handleRefund, disabled: loading, variant: "contained", color: "error" }));
};
export const OrderShow = () => (_jsx(Show, { actions: _jsx(Box, { sx: { display: 'flex', gap: 1 }, children: _jsx(RefundButton, {}) }), children: _jsxs(SimpleShowLayout, { children: [_jsx(TextField, { source: "id", label: "\u8BA2\u5355ID" }), _jsx(TextField, { source: "userId", label: "\u7528\u6237ID" }), _jsx(TextField, { source: "type", label: "\u8BA2\u5355\u7C7B\u578B" }), _jsx(TextField, { source: "status", label: "\u72B6\u6001", format: (status) => formatUtils.status(status) }), _jsx(NumberField, { source: "amount", label: "\u91D1\u989D", options: { style: 'currency', currency: 'USD' } }), _jsx(TextField, { source: "currency", label: "\u8D27\u5E01" }), _jsx(TextField, { source: "paymentMethod", label: "\u652F\u4ED8\u65B9\u5F0F" }), _jsx(DateField, { source: "createdAt", label: "\u521B\u5EFA\u65F6\u95F4", showTime: true }), _jsx(DateField, { source: "paidAt", label: "\u652F\u4ED8\u65F6\u95F4", showTime: true }), _jsx(DateField, { source: "refundedAt", label: "\u9000\u6B3E\u65F6\u95F4", showTime: true }), _jsx(NumberField, { source: "refundAmount", label: "\u9000\u6B3E\u91D1\u989D", options: { style: 'currency', currency: 'USD' } })] }) }));
