import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { List, Datagrid, TextField, DateField, ShowButton, Filter, TextInput, SelectInput } from 'react-admin';
import { formatUtils } from '../../utils/format';
const FeedbackFilter = (props) => (_jsxs(Filter, { ...props, children: [_jsx(TextInput, { source: "search", label: "\u641C\u7D22\u6807\u9898\u6216\u5185\u5BB9", alwaysOn: true }), _jsx(SelectInput, { source: "type", label: "\u7C7B\u578B", choices: [
                { id: 'bug', name: 'Bug' },
                { id: 'feature', name: '功能建议' },
                { id: 'complaint', name: '投诉' },
                { id: 'other', name: '其他' },
            ] }), _jsx(SelectInput, { source: "status", label: "\u72B6\u6001", choices: [
                { id: 'pending', name: '待处理' },
                { id: 'processing', name: '处理中' },
                { id: 'resolved', name: '已解决' },
                { id: 'closed', name: '已关闭' },
            ] })] }));
export const FeedbackList = () => (_jsx(List, { filters: _jsx(FeedbackFilter, {}), children: _jsxs(Datagrid, { rowClick: "show", children: [_jsx(TextField, { source: "id", label: "\u53CD\u9988ID" }), _jsx(TextField, { source: "userId", label: "\u7528\u6237ID" }), _jsx(TextField, { source: "type", label: "\u7C7B\u578B" }), _jsx(TextField, { source: "title", label: "\u6807\u9898" }), _jsx(TextField, { source: "status", label: "\u72B6\u6001", format: (status) => formatUtils.status(status) }), _jsx(DateField, { source: "createdAt", label: "\u521B\u5EFA\u65F6\u95F4", showTime: true }), _jsx(ShowButton, {})] }) }));
