import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Switch, FormControlLabel, TextField, Button, Alert, CircularProgress, Stack, Divider, } from '@mui/material';
import { Save as SaveIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useNotify, usePermissions } from 'react-admin';
import apiClient from '../../services/api';
import { hasPermission } from '../../utils/permissions';
import { authUtils } from '../../utils/auth';
export const WebSearchConfig = () => {
    const notify = useNotify();
    const { permissions } = usePermissions();
    const adminInfo = authUtils.getAdminInfo();
    const userRole = adminInfo?.role;
    const canRead = hasPermission(permissions, 'web_search:read', userRole);
    const canWrite = hasPermission(permissions, 'web_search:write', userRole);
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const loadConfig = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/admin/web-search/config');
            const data = response.data?.data || {};
            setConfig({
                tavilyApiKey: data.tavilyApiKey || '',
                tavilyEnabled: data.tavilyEnabled || false,
                googleApiKey: data.googleApiKey || '',
                googleEnabled: data.googleEnabled || false,
                googleSearchEngineId: data.googleSearchEngineId || '',
                bingApiKey: data.bingApiKey || '',
                bingEnabled: data.bingEnabled || false,
                baiduApiKey: data.baiduApiKey || '',
                baiduEnabled: data.baiduEnabled || false,
                baiduSecretKey: data.baiduSecretKey || '',
            });
        }
        catch (error) {
            const err = error;
            notify(err.response?.data?.message || '加载配置失败', { type: 'error' });
        }
        finally {
            setLoading(false);
        }
    }, [notify]);
    useEffect(() => {
        if (canRead) {
            loadConfig();
        }
    }, [canRead, loadConfig]);
    const handleSave = async () => {
        if (!config || !canWrite) {
            notify('无权限修改配置', { type: 'error' });
            return;
        }
        try {
            setSaving(true);
            await apiClient.put('/admin/web-search/config', config);
            notify('配置保存成功', { type: 'success' });
            // 重新加载配置以获取掩码后的 API Key
            await loadConfig();
        }
        catch (error) {
            const err = error;
            notify(err.response?.data?.message || '保存失败', { type: 'error' });
        }
        finally {
            setSaving(false);
        }
    };
    const handleChange = (field, value) => {
        if (!config)
            return;
        setConfig((prev) => ({
            ...prev,
            [field]: value,
        }));
    };
    if (!canRead) {
        return (_jsx(Box, { sx: { p: 3 }, children: _jsx(Alert, { severity: "warning", children: "\u65E0\u6743\u9650\u8BBF\u95EE\u6B64\u9875\u9762" }) }));
    }
    if (loading) {
        return (_jsx(Box, { sx: { display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }, children: _jsx(CircularProgress, {}) }));
    }
    if (!config) {
        return (_jsx(Box, { sx: { p: 3 }, children: _jsx(Alert, { severity: "error", children: "\u65E0\u6CD5\u52A0\u8F7D\u914D\u7F6E" }) }));
    }
    return (_jsxs(Box, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h4", gutterBottom: true, children: "\u8054\u7F51\u641C\u7D22\u914D\u7F6E" }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 3 }, children: "\u914D\u7F6E\u5404\u641C\u7D22\u5F15\u64CE\u7684 API Key \u548C\u4F18\u5148\u7EA7\u3002\u7CFB\u7EDF\u4F1A\u6309\u4F18\u5148\u7EA7\u987A\u5E8F\u5C1D\u8BD5\u4F7F\u7528\u641C\u7D22\u5F15\u64CE\uFF0C\u5F53\u524D\u641C\u7D22\u5F15\u64CE\u4E0D\u53EF\u7528\u65F6\u81EA\u52A8\u5207\u6362\u5230\u4E0B\u4E00\u4E2A\u3002" }), _jsx(Card, { children: _jsx(CardContent, { children: _jsxs(Stack, { spacing: 4, children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Tavily" }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: config.tavilyEnabled, onChange: (e) => handleChange('tavilyEnabled', e.target.checked), disabled: !canWrite }), label: "\u4F18\u5148\u4F7F\u7528" }), _jsx(TextField, { label: "Tavily API Key", type: "password", value: config.tavilyApiKey, onChange: (e) => handleChange('tavilyApiKey', e.target.value), disabled: !canWrite, fullWidth: true, sx: { mt: 2 }, helperText: "Tavily \u641C\u7D22\u5F15\u64CE\u7684 API Key\uFF08\u7559\u7A7A\u8868\u793A\u4E0D\u66F4\u65B0\uFF09" })] }), _jsx(Divider, {}), _jsxs(Box, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Google" }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: config.googleEnabled, onChange: (e) => handleChange('googleEnabled', e.target.checked), disabled: !canWrite }), label: "\u4F18\u5148\u4F7F\u7528" }), _jsx(TextField, { label: "Google API Key", type: "password", value: config.googleApiKey, onChange: (e) => handleChange('googleApiKey', e.target.value), disabled: !canWrite, fullWidth: true, sx: { mt: 2 }, helperText: "Google Custom Search API \u7684 API Key\uFF08\u7559\u7A7A\u8868\u793A\u4E0D\u66F4\u65B0\uFF09" }), _jsx(TextField, { label: "Google Search Engine ID", value: config.googleSearchEngineId, onChange: (e) => handleChange('googleSearchEngineId', e.target.value), disabled: !canWrite, fullWidth: true, sx: { mt: 2 }, helperText: "Google Custom Search Engine ID" })] }), _jsx(Divider, {}), _jsxs(Box, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Bing" }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: config.bingEnabled, onChange: (e) => handleChange('bingEnabled', e.target.checked), disabled: !canWrite }), label: "\u4F18\u5148\u4F7F\u7528" }), _jsx(TextField, { label: "Bing API Key", type: "password", value: config.bingApiKey, onChange: (e) => handleChange('bingApiKey', e.target.value), disabled: !canWrite, fullWidth: true, sx: { mt: 2 }, helperText: "Bing Search API \u7684 API Key\uFF08\u7559\u7A7A\u8868\u793A\u4E0D\u66F4\u65B0\uFF09" })] }), _jsx(Divider, {}), _jsxs(Box, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "Baidu\uFF08\u767E\u5EA6\uFF09" }), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: config.baiduEnabled, onChange: (e) => handleChange('baiduEnabled', e.target.checked), disabled: !canWrite }), label: "\u4F18\u5148\u4F7F\u7528" }), _jsx(TextField, { label: "Baidu API Key", type: "password", value: config.baiduApiKey, onChange: (e) => handleChange('baiduApiKey', e.target.value), disabled: !canWrite, fullWidth: true, sx: { mt: 2 }, helperText: "\u767E\u5EA6\u641C\u7D22 API \u7684 API Key\uFF08\u7559\u7A7A\u8868\u793A\u4E0D\u66F4\u65B0\uFF09" }), _jsx(TextField, { label: "Baidu Secret Key", type: "password", value: config.baiduSecretKey, onChange: (e) => handleChange('baiduSecretKey', e.target.value), disabled: !canWrite, fullWidth: true, sx: { mt: 2 }, helperText: "\u767E\u5EA6\u641C\u7D22 API \u7684 Secret Key\uFF08\u7559\u7A7A\u8868\u793A\u4E0D\u66F4\u65B0\uFF09" })] }), canWrite && (_jsxs(Stack, { direction: "row", spacing: 2, sx: { mt: 2, justifyContent: 'flex-end' }, children: [_jsx(Button, { variant: "outlined", startIcon: _jsx(RefreshIcon, {}), onClick: loadConfig, disabled: saving || loading, children: "\u91CD\u7F6E" }), _jsx(Button, { variant: "contained", startIcon: _jsx(SaveIcon, {}), onClick: handleSave, disabled: saving || loading, children: saving ? '保存中...' : '保存配置' })] }))] }) }) })] }));
};
