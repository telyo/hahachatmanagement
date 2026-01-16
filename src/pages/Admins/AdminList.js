import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { List, Datagrid, TextField, EmailField, DateField, EditButton, ShowButton, Filter, SelectInput, usePermissions, FunctionField } from 'react-admin';
import { formatUtils } from '../../utils/format';
const AdminFilter = (props) => (_jsx(Filter, { ...props, children: _jsx(SelectInput, { source: "status", label: "\u72B6\u6001", choices: [
            { id: 'active', name: '活跃' },
            { id: 'inactive', name: '未激活' },
            { id: 'suspended', name: '已暂停' },
        ] }) }));
export const AdminList = () => {
    const { permissions } = usePermissions();
    // 检查是否有 admins:read 权限
    const hasPermission = permissions?.includes('admins:read') || permissions?.includes('admins:write');
    if (!hasPermission) {
        return _jsx("div", { children: "\u65E0\u6743\u9650\u8BBF\u95EE\u6B64\u9875\u9762" });
    }
    return (_jsx(List, { filters: _jsx(AdminFilter, {}), children: _jsxs(Datagrid, { rowClick: "show", children: [_jsx(TextField, { source: "id", label: "\u7BA1\u7406\u5458ID" }), _jsx(EmailField, { source: "email", label: "\u90AE\u7BB1" }), _jsx(TextField, { source: "name", label: "\u59D3\u540D" }), _jsx(TextField, { source: "role", label: "\u89D2\u8272", format: (role) => role === 'super_admin' ? '超级管理员' : '普通管理员' }), _jsx(TextField, { source: "status", label: "\u72B6\u6001", format: (status) => formatUtils.status(status) }), _jsx(DateField, { source: "createdAt", label: "\u521B\u5EFA\u65F6\u95F4", showTime: true }), _jsx(DateField, { source: "lastLoginAt", label: "\u6700\u540E\u767B\u5F55", showTime: true }), _jsx(ShowButton, {}), _jsx(FunctionField, { label: "\u64CD\u4F5C", render: (record) => {
                        // 超级管理员不可编辑
                        if (record?.role === 'super_admin') {
                            return null;
                        }
                        return _jsx(EditButton, { record: record });
                    } })] }) }));
};
