import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { Box, Card, CardContent, Typography, Switch, FormControlLabel, TextField, Button, Chip, Stack, Alert, CircularProgress, Divider, } from '@mui/material';
import { Save as SaveIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useNotify, List } from 'react-admin';
import apiClient from '../../services/api';
// 作为 List 组件使用（用于 Resource）
export const APILoggerConfigList = () => {
    return (_jsx(List, { children: _jsx(APILoggerConfigContent, {}) }));
};
// 作为独立页面使用（用于 CustomRoutes）
export const APILoggerConfig = () => {
    return _jsx(APILoggerConfigContent, {});
};
// 实际的内容组件
const APILoggerConfigContent = () => {
    const [config, setConfig] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newPath, setNewPath] = useState('');
    const notify = useNotify();
    const loadConfig = useCallback(async () => {
        try {
            setLoading(true);
            const response = await apiClient.get('/admin/api-logger/config');
            const data = response.data.data || {};
            // 确保 whitelist 始终是数组
            setConfig({
                enabled: data.enabled ?? false,
                logAll: data.logAll ?? false,
                whitelist: Array.isArray(data.whitelist) ? data.whitelist : [],
                logResponseOnSuccess: data.logResponseOnSuccess ?? false,
                logRequestHeaders: data.logRequestHeaders ?? true,
                logRequestBody: data.logRequestBody ?? true,
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
    // 加载配置
    useEffect(() => {
        loadConfig();
    }, [loadConfig]);
    const handleSave = async () => {
        if (!config)
            return;
        try {
            setSaving(true);
            await apiClient.put('/admin/api-logger/config', config);
            notify('配置保存成功', { type: 'success' });
        }
        catch (error) {
            const err = error;
            notify(err.response?.data?.message || '保存配置失败', { type: 'error' });
        }
        finally {
            setSaving(false);
        }
    };
    const handleReset = async () => {
        try {
            setSaving(true);
            await apiClient.post('/admin/api-logger/config/reset');
            notify('配置已重置为初始值', { type: 'success' });
            await loadConfig();
        }
        catch (error) {
            const err = error;
            notify(err.response?.data?.message || '重置配置失败', { type: 'error' });
        }
        finally {
            setSaving(false);
        }
    };
    const handleAddPath = () => {
        if (!newPath.trim() || !config)
            return;
        const trimmedPath = newPath.trim();
        if (config.whitelist.includes(trimmedPath)) {
            notify('该路径已存在', { type: 'warning' });
            return;
        }
        setConfig({
            ...config,
            whitelist: [...config.whitelist, trimmedPath],
        });
        setNewPath('');
    };
    const handleRemovePath = (path) => {
        if (!config)
            return;
        setConfig({
            ...config,
            whitelist: config.whitelist.filter((p) => p !== path),
        });
    };
    if (loading) {
        return (_jsx(Box, { sx: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }, children: _jsx(CircularProgress, {}) }));
    }
    if (!config) {
        return _jsx(Alert, { severity: "error", children: "\u65E0\u6CD5\u52A0\u8F7D\u914D\u7F6E" });
    }
    return (_jsxs(Box, { sx: { mt: 2, maxWidth: 1200, mx: 'auto' }, children: [_jsx(Typography, { variant: "h4", gutterBottom: true, children: "API \u65E5\u5FD7\u914D\u7F6E" }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 3 }, children: "\u914D\u7F6E API \u65E5\u5FD7\u7684\u8F93\u51FA\u89C4\u5219\u3002\u53EF\u4EE5\u542F\u7528/\u7981\u7528\u65E5\u5FD7\uFF0C\u8BBE\u7F6E\u662F\u5426\u8BB0\u5F55\u6240\u6709\u63A5\u53E3\uFF0C\u6216\u914D\u7F6E\u767D\u540D\u5355\u3002" }), _jsx(Card, { children: _jsx(CardContent, { children: _jsxs(Stack, { spacing: 3, children: [_jsx(FormControlLabel, { control: _jsx(Switch, { checked: config.enabled, onChange: (e) => setConfig({ ...config, enabled: e.target.checked }) }), label: "\u542F\u7528 API \u65E5\u5FD7" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "\u542F\u7528\u540E\uFF0C\u7CFB\u7EDF\u5C06\u6839\u636E\u4E0B\u65B9\u914D\u7F6E\u8BB0\u5F55 API \u8BF7\u6C42\u548C\u54CD\u5E94\u65E5\u5FD7" }), _jsx(Divider, {}), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: config.logAll, onChange: (e) => setConfig({ ...config, logAll: e.target.checked }), disabled: !config.enabled }), label: "\u8BB0\u5F55\u6240\u6709\u63A5\u53E3" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "\u542F\u7528\u540E\uFF0C\u5C06\u8BB0\u5F55\u6240\u6709 API \u63A5\u53E3\u7684\u65E5\u5FD7\u3002\u7981\u7528\u540E\uFF0C\u53EA\u8BB0\u5F55\u767D\u540D\u5355\u4E2D\u7684\u63A5\u53E3" }), _jsx(Divider, {}), !config.logAll && (_jsxs(_Fragment, { children: [_jsxs(Box, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "\u63A5\u53E3\u767D\u540D\u5355" }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 2 }, children: "\u53EA\u8BB0\u5F55\u767D\u540D\u5355\u4E2D\u7684\u63A5\u53E3\u3002\u652F\u6301\u901A\u914D\u7B26 *\uFF0C\u4F8B\u5982\uFF1A/api/v1/admin/*" }), _jsxs(Stack, { direction: "row", spacing: 2, sx: { mb: 2 }, children: [_jsx(TextField, { label: "\u63A5\u53E3\u8DEF\u5F84", value: newPath, onChange: (e) => setNewPath(e.target.value), placeholder: "/api/v1/admin/*", size: "small", fullWidth: true, disabled: !config.enabled, onKeyPress: (e) => {
                                                            if (e.key === 'Enter') {
                                                                handleAddPath();
                                                            }
                                                        } }), _jsx(Button, { variant: "outlined", onClick: handleAddPath, disabled: !config.enabled || !newPath.trim(), children: "\u6DFB\u52A0" })] }), _jsx(Stack, { direction: "row", spacing: 1, flexWrap: "wrap", useFlexGap: true, children: config.whitelist && Array.isArray(config.whitelist) && config.whitelist.length > 0 ? (config.whitelist.map((path) => (_jsx(Chip, { label: path, onDelete: () => handleRemovePath(path), color: "primary", variant: "outlined" }, path)))) : (_jsx(Typography, { variant: "body2", color: "text.secondary", children: "\u6682\u65E0\u767D\u540D\u5355\u8DEF\u5F84" })) })] }), _jsx(Divider, {})] })), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: config.logResponseOnSuccess, onChange: (e) => setConfig({ ...config, logResponseOnSuccess: e.target.checked }), disabled: !config.enabled }), label: "\u8BB0\u5F55\u6210\u529F\u54CD\u5E94\u7684\u54CD\u5E94\u4F53" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "\u542F\u7528\u540E\uFF0C\u6210\u529F\u54CD\u5E94\uFF082xx\uFF09\u7684\u54CD\u5E94\u4F53\u4E5F\u4F1A\u88AB\u8BB0\u5F55\u3002\u9ED8\u8BA4\u53EA\u8BB0\u5F55\u9519\u8BEF\u54CD\u5E94\uFF084xx\u30015xx\uFF09\u7684\u54CD\u5E94\u4F53" }), _jsx(Divider, {}), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: config.logRequestHeaders, onChange: (e) => setConfig({ ...config, logRequestHeaders: e.target.checked }), disabled: !config.enabled }), label: "\u8BB0\u5F55\u8BF7\u6C42\u5934" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "\u542F\u7528\u540E\uFF0CAPI \u65E5\u5FD7\u5C06\u5305\u542B\u8BF7\u6C42\u5934\u4FE1\u606F\uFF08\u654F\u611F\u4FE1\u606F\u5982 Authorization \u548C Cookie \u4F1A\u88AB\u9690\u85CF\uFF09" }), _jsx(Divider, {}), _jsx(FormControlLabel, { control: _jsx(Switch, { checked: config.logRequestBody, onChange: (e) => setConfig({ ...config, logRequestBody: e.target.checked }), disabled: !config.enabled }), label: "\u8BB0\u5F55\u8BF7\u6C42\u4F53" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "\u542F\u7528\u540E\uFF0CAPI \u65E5\u5FD7\u5C06\u5305\u542B\u8BF7\u6C42\u4F53\u5185\u5BB9\u3002\u7981\u7528\u65F6\uFF0C\u5373\u4F7F\u8BF7\u6C42\u4F53\u6709\u5185\u5BB9\u4E5F\u4E0D\u4F1A\u8BB0\u5F55\uFF08\u4F46\u4F1A\u663E\u793A\u8BF7\u6C42\u4F53\u5927\u5C0F\uFF09" }), _jsx(Divider, {}), _jsxs(Stack, { direction: "row", spacing: 2, children: [_jsx(Button, { variant: "contained", startIcon: _jsx(SaveIcon, {}), onClick: handleSave, disabled: saving, children: saving ? '保存中...' : '保存配置' }), _jsx(Button, { variant: "outlined", startIcon: _jsx(RefreshIcon, {}), onClick: handleReset, disabled: saving, children: "\u91CD\u7F6E\u4E3A\u521D\u59CB\u503C" })] })] }) }) })] }));
};
