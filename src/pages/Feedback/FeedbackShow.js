import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Show, SimpleShowLayout, TextField, DateField, useNotify, useRefresh, } from 'react-admin';
import { formatUtils } from '../../utils/format';
import apiClient from '../../services/api';
const FeedbackShow = () => {
    const notify = useNotify();
    const refresh = useRefresh();
    const handleUpdate = async (data) => {
        try {
            await apiClient.put(`/admin/feedback/${data.id}`, {
                status: data.status,
                adminReply: data.adminReply,
            });
            notify('反馈更新成功', { type: 'success' });
            refresh();
        }
        catch (error) {
            notify(error.response?.data?.message || '更新失败', { type: 'error' });
        }
    };
    return (_jsx(Show, { children: _jsxs(SimpleShowLayout, { children: [_jsx(TextField, { source: "id", label: "\u53CD\u9988ID" }), _jsx(TextField, { source: "userId", label: "\u7528\u6237ID" }), _jsx(TextField, { source: "type", label: "\u7C7B\u578B" }), _jsx(TextField, { source: "category", label: "\u5206\u7C7B" }), _jsx(TextField, { source: "title", label: "\u6807\u9898" }), _jsx(TextField, { source: "content", label: "\u5185\u5BB9" }), _jsx(TextField, { source: "status", label: "\u72B6\u6001", format: (status) => formatUtils.status(status) }), _jsx(TextField, { source: "adminReply", label: "\u7BA1\u7406\u5458\u56DE\u590D" }), _jsx(DateField, { source: "createdAt", label: "\u521B\u5EFA\u65F6\u95F4", showTime: true }), _jsx(DateField, { source: "updatedAt", label: "\u66F4\u65B0\u65F6\u95F4", showTime: true }), _jsx(DateField, { source: "repliedAt", label: "\u56DE\u590D\u65F6\u95F4", showTime: true })] }) }));
};
export default FeedbackShow;
