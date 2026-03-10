import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { List, Datagrid, TextField, DateField, ShowButton, Filter, TextInput, SelectInput, useUpdate, useNotify, FunctionField, useRecordContext, } from 'react-admin';
import { MenuItem, Select, FormControl, InputLabel, Box, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { formatUtils } from '../../utils/format';
const TYPE_LABELS = {
    suggestion: '建议',
    bug: 'Bug',
    complaint: '投诉',
};
const FeedbackFilter = (props) => (_jsxs(Filter, { ...props, children: [_jsx(TextInput, { source: "search", label: "\u641C\u7D22\u6807\u9898\u6216\u5185\u5BB9", alwaysOn: true }), _jsx(SelectInput, { source: "type", label: "\u7C7B\u578B", choices: [
                { id: 'suggestion', name: '建议' },
                { id: 'bug', name: 'Bug' },
                { id: 'complaint', name: '投诉' },
            ] }), _jsx(SelectInput, { source: "status", label: "\u72B6\u6001", choices: [
                { id: 'pending', name: '待处理' },
                { id: 'processing', name: '进行中' },
                { id: 'resolved', name: '已处理' },
                { id: 'closed', name: '忽略' },
            ] })] }));
function ContentCollapseField() {
    const record = useRecordContext();
    const [open, setOpen] = useState(false);
    const content = record?.content ?? '';
    const maxLen = 80;
    const truncated = content.length <= maxLen ? content : content.slice(0, maxLen) + '…';
    return (_jsxs(Box, { sx: { maxWidth: 320 }, children: [_jsx(Box, { component: "span", sx: { whiteSpace: 'pre-wrap', wordBreak: 'break-word' }, children: open ? content : truncated }), content.length > maxLen && (_jsx(IconButton, { size: "small", onClick: () => setOpen(!open), "aria-label": open ? '收起' : '展开', children: open ? _jsx(ExpandLessIcon, { fontSize: "small" }) : _jsx(ExpandMoreIcon, { fontSize: "small" }) }))] }));
}
function DeviceInfoField() {
    const record = useRecordContext();
    if (!record)
        return null;
    const parts = [
        record.deviceType,
        record.deviceModel,
        record.osVersion,
    ].filter(Boolean);
    return _jsx("span", { children: parts.length ? parts.join(' / ') : '—' });
}
function StatusEditField() {
    const record = useRecordContext();
    const [update, { isLoading }] = useUpdate();
    const notify = useNotify();
    if (!record?.id)
        return null;
    const handleChange = async (event) => {
        const newStatus = event.target.value;
        try {
            await update('feedback', { id: record.id, data: { status: newStatus }, previousData: record });
            notify('状态已更新', { type: 'success' });
        }
        catch (e) {
            notify(e?.message || '更新失败', { type: 'error' });
        }
    };
    return (_jsx(Box, { onClick: (e) => e.stopPropagation(), onMouseDown: (e) => e.stopPropagation(), children: _jsxs(FormControl, { size: "small", sx: { minWidth: 120 }, disabled: isLoading, children: [_jsx(InputLabel, { children: "\u72B6\u6001" }), _jsxs(Select, { value: record.status || 'pending', label: "\u72B6\u6001", onChange: handleChange, children: [_jsx(MenuItem, { value: "pending", children: formatUtils.status('pending') }), _jsx(MenuItem, { value: "processing", children: formatUtils.status('processing') }), _jsx(MenuItem, { value: "resolved", children: formatUtils.status('resolved') }), _jsx(MenuItem, { value: "closed", children: formatUtils.status('closed') })] })] }) }));
}
export const FeedbackList = () => (_jsx(List, { filters: _jsx(FeedbackFilter, {}), children: _jsxs(Datagrid, { rowClick: "show", children: [_jsx(FunctionField, { source: "type", label: "\u7C7B\u578B", render: (r) => TYPE_LABELS[r?.type] ?? r?.type ?? '—' }), _jsx(TextField, { source: "title", label: "\u6807\u9898" }), _jsx(FunctionField, { label: "\u5185\u5BB9", render: () => _jsx(ContentCollapseField, {}) }), _jsx(FunctionField, { label: "\u8BBE\u5907\u4FE1\u606F", render: () => _jsx(DeviceInfoField, {}) }), _jsx(TextField, { source: "appVersion", label: "\u7248\u672C\u4FE1\u606F", emptyText: "\u2014" }), _jsx(DateField, { source: "createdAt", label: "\u521B\u5EFA\u65F6\u95F4", showTime: true }), _jsx(FunctionField, { label: "\u72B6\u6001", render: () => _jsx(StatusEditField, {}) }), _jsx(ShowButton, {})] }) }));
