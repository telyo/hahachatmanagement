import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Show, SimpleShowLayout, TextField, DateField, FunctionField, useNotify, useRefresh, useUpdate, useRecordContext, } from 'react-admin';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography } from '@mui/material';
import { formatUtils } from '../../utils/format';
const TYPE_LABELS = {
    suggestion: '建议',
    bug: 'Bug',
    complaint: '投诉',
};
function StatusEdit() {
    const record = useRecordContext();
    const notify = useNotify();
    const refresh = useRefresh();
    const [update, { isLoading }] = useUpdate();
    if (!record?.id)
        return null;
    const handleChange = async (event) => {
        const newStatus = event.target.value;
        try {
            await update('feedback', {
                id: record.id,
                data: { status: newStatus },
                previousData: record,
            });
            notify('状态已更新', { type: 'success' });
            refresh();
        }
        catch (e) {
            notify(e?.message || '更新失败', { type: 'error' });
        }
    };
    return (_jsxs(FormControl, { size: "small", sx: { minWidth: 160 }, disabled: isLoading, children: [_jsx(InputLabel, { children: "\u72B6\u6001" }), _jsxs(Select, { value: record.status || 'pending', label: "\u72B6\u6001", onChange: handleChange, children: [_jsx(MenuItem, { value: "pending", children: formatUtils.status('pending') }), _jsx(MenuItem, { value: "processing", children: formatUtils.status('processing') }), _jsx(MenuItem, { value: "resolved", children: formatUtils.status('resolved') }), _jsx(MenuItem, { value: "closed", children: formatUtils.status('closed') })] })] }));
}
function DeviceInfoShow() {
    const record = useRecordContext();
    if (!record)
        return null;
    const parts = [
        record.deviceType && `设备类型: ${record.deviceType}`,
        record.deviceModel && `型号: ${record.deviceModel}`,
        record.osVersion && `系统: ${record.osVersion}`,
    ].filter(Boolean);
    return (_jsx(Typography, { variant: "body2", children: parts.length ? parts.join(' | ') : '—' }));
}
const FeedbackShow = () => (_jsx(Show, { children: _jsxs(SimpleShowLayout, { children: [_jsx(TextField, { source: "type", label: "\u7C7B\u578B", format: (v) => TYPE_LABELS[v] ?? v ?? '—' }), _jsx(TextField, { source: "title", label: "\u6807\u9898" }), _jsx(TextField, { source: "content", label: "\u5185\u5BB9", fullWidth: true }), _jsx(FunctionField, { label: "\u8BBE\u5907\u4FE1\u606F", render: () => _jsx(DeviceInfoShow, {}) }), _jsx(TextField, { source: "appVersion", label: "\u7248\u672C\u4FE1\u606F", emptyText: "\u2014" }), _jsx(DateField, { source: "createdAt", label: "\u521B\u5EFA\u65F6\u95F4", showTime: true }), _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 1 }, children: [_jsx(Typography, { variant: "body2", color: "text.secondary", sx: { width: 120 }, children: "\u72B6\u6001" }), _jsx(StatusEdit, {})] }), _jsx(TextField, { source: "adminReply", label: "\u7BA1\u7406\u5458\u56DE\u590D", fullWidth: true }), _jsx(DateField, { source: "repliedAt", label: "\u56DE\u590D\u65F6\u95F4", showTime: true }), _jsx(DateField, { source: "updatedAt", label: "\u66F4\u65B0\u65F6\u95F4", showTime: true })] }) }));
export default FeedbackShow;
