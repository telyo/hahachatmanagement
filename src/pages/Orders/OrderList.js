import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { List, Datagrid, TextField, NumberField, DateField, ShowButton, Filter, TextInput, SelectInput } from 'react-admin';
import { formatUtils } from '../../utils/format';
const OrderFilter = (props) => (_jsxs(Filter, { ...props, children: [_jsx(TextInput, { source: "search", label: "\u641C\u7D22\u8BA2\u5355ID\u6216\u7528\u6237\u90AE\u7BB1", alwaysOn: true }), _jsx(SelectInput, { source: "status", label: "\u8BA2\u5355\u72B6\u6001", choices: [
                { id: 'pending', name: '待处理' },
                { id: 'paid', name: '已支付' },
                { id: 'failed', name: '失败' },
                { id: 'refunded', name: '已退款' },
                { id: 'partially_refunded', name: '部分退款' },
            ] })] }));
export const OrderList = () => (_jsx(List, { filters: _jsx(OrderFilter, {}), children: _jsxs(Datagrid, { rowClick: "show", children: [_jsx(TextField, { source: "id", label: "\u8BA2\u5355ID" }), _jsx(TextField, { source: "userId", label: "\u7528\u6237ID" }), _jsx(TextField, { source: "type", label: "\u8BA2\u5355\u7C7B\u578B" }), _jsx(TextField, { source: "status", label: "\u72B6\u6001", format: (status) => formatUtils.status(status) }), _jsx(NumberField, { source: "amount", label: "\u91D1\u989D", options: { style: 'currency', currency: 'USD' } }), _jsx(TextField, { source: "currency", label: "\u8D27\u5E01" }), _jsx(DateField, { source: "createdAt", label: "\u521B\u5EFA\u65F6\u95F4", showTime: true }), _jsx(ShowButton, {})] }) }));
