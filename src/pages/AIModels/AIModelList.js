import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { List, Datagrid, TextField, NumberField, DateField, EditButton, ShowButton, CreateButton, Filter, TextInput, SelectInput, TopToolbar, Button, usePermissions } from 'react-admin';
import { formatUtils } from '../../utils/format';
import { useNotify, useRedirect } from 'react-admin';
import { hasPermission } from '../../utils/permissions';
import { authUtils } from '../../utils/auth';
import apiClient from '../../services/api';
import { ContentCopy as CopyIcon, ImportExport as ImportExportIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
const AIModelFilter = (props) => (_jsxs(Filter, { ...props, children: [_jsx(TextInput, { source: "search", label: "\u641C\u7D22\u6A21\u578BID\u6216\u540D\u79F0", alwaysOn: true }), _jsx(SelectInput, { source: "status", label: "\u72B6\u6001", choices: [
                { id: 'active', name: '活跃' },
                { id: 'inactive', name: '未激活' },
            ] }), _jsx(SelectInput, { source: "provider", label: "\u63D0\u4F9B\u5546", choices: [
                { id: 'openai', name: 'OpenAI' },
                { id: 'anthropic', name: 'Anthropic' },
                { id: 'google', name: 'Google' },
            ] })] }));
const DuplicateButton = ({ record }) => {
    const notify = useNotify();
    const redirect = useRedirect();
    const handleDuplicate = async () => {
        if (!record?.id) {
            notify('模型ID不存在', { type: 'error' });
            return;
        }
        if (!window.confirm(`确定要复制模型 "${record.displayName || record.name}" 吗？`)) {
            return;
        }
        try {
            const response = await apiClient.post(`/admin/ai/models/${record.id}/duplicate`, {
                newModelId: `${record.id}-copy`,
                name: `${record.displayName || record.name} (副本)`,
            });
            notify('复制成功', { type: 'success' });
            redirect('show', 'ai-models', response.data.data.id);
        }
        catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message || '复制失败';
            notify(errorMessage, { type: 'error' });
        }
    };
    return (_jsx(Button, { label: "\u590D\u5236", onClick: handleDuplicate, startIcon: _jsx(CopyIcon, {}) }));
};
const CustomActions = () => {
    const navigate = useNavigate();
    const { permissions } = usePermissions();
    const adminInfo = authUtils.getAdminInfo();
    const canWrite = hasPermission(permissions, 'ai_models:write', adminInfo?.role);
    const canImportExport = hasPermission(permissions, 'ai_models:import_export', adminInfo?.role);
    return (_jsxs(TopToolbar, { children: [canWrite && _jsx(CreateButton, {}), canImportExport && (_jsx(Button, { label: "\u5BFC\u5165/\u5BFC\u51FA", onClick: () => navigate('/ai-models-import-export'), startIcon: _jsx(ImportExportIcon, {}) }))] }));
};
export const AIModelList = () => {
    const { permissions } = usePermissions();
    const adminInfo = authUtils.getAdminInfo();
    const canWrite = hasPermission(permissions, 'ai_models:write', adminInfo?.role);
    return (_jsx(List, { filters: _jsx(AIModelFilter, {}), actions: _jsx(CustomActions, {}), children: _jsxs(Datagrid, { rowClick: "show", children: [_jsx(TextField, { source: "name", label: "\u540D\u79F0" }), _jsx(TextField, { source: "displayName", label: "\u663E\u793A\u540D\u79F0" }), _jsx(TextField, { source: "provider", label: "\u63D0\u4F9B\u5546" }), _jsx(TextField, { source: "category", label: "\u5206\u7C7B" }), _jsx(TextField, { source: "type", label: "\u7C7B\u578B" }), _jsx(TextField, { source: "status", label: "\u72B6\u6001", format: (status) => String(formatUtils.status(status || '')) }), _jsx(NumberField, { source: "pricing.inputPrice", label: "\u8F93\u5165\u4EF7\u683C\uFF08\u6BCF1K tokens\uFF09" }), _jsx(NumberField, { source: "pricing.outputPrice", label: "\u8F93\u51FA\u4EF7\u683C\uFF08\u6BCF1K tokens\uFF09" }), _jsx(NumberField, { source: "displayConfig.sortOrder", label: "\u6392\u5E8F" }), _jsx(DateField, { source: "createdAt", label: "\u521B\u5EFA\u65F6\u95F4", showTime: true }), _jsx(ShowButton, {}), canWrite && _jsx(EditButton, {}), canWrite && _jsx(DuplicateButton, {})] }) }));
};
