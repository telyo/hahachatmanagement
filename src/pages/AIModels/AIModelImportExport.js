import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Alert, TextField as MuiTextField, CircularProgress, Grid, } from '@mui/material';
import { Download as DownloadIcon, Upload as UploadIcon } from '@mui/icons-material';
import { useNotify, Title } from 'react-admin';
import apiClient from '../../services/api';
export const AIModelImportExport = () => {
    const notify = useNotify();
    const [exporting, setExporting] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importData, setImportData] = useState('');
    const [importResult, setImportResult] = useState(null);
    const handleExport = async () => {
        setExporting(true);
        try {
            const response = await apiClient.get('/admin/ai/models/export', {
                responseType: 'blob',
            });
            // 创建下载链接
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `ai-models-export-${new Date().toISOString().split('T')[0]}.json`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            notify('导出成功', { type: 'success' });
        }
        catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message || '导出失败';
            notify(errorMessage, { type: 'error' });
        }
        finally {
            setExporting(false);
        }
    };
    const handleImport = async () => {
        if (!importData.trim()) {
            notify('请先粘贴要导入的JSON数据', { type: 'error' });
            return;
        }
        setImporting(true);
        setImportResult(null);
        try {
            let modelsData;
            try {
                modelsData = JSON.parse(importData);
            }
            catch (e) {
                throw new Error('JSON格式错误，请检查数据格式');
            }
            // 如果直接是数组，包装成导入格式
            if (Array.isArray(modelsData)) {
                modelsData = { models: modelsData, options: { overwrite: false, skipErrors: false } };
            }
            const response = await apiClient.post('/admin/ai/models/import', modelsData);
            setImportResult(response.data.data);
            if (response.data.data.failedCount === 0) {
                notify('导入成功', { type: 'success' });
            }
            else {
                notify(`导入完成：成功 ${response.data.data.successCount}，失败 ${response.data.data.failedCount}`, {
                    type: 'warning',
                });
            }
        }
        catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message || '导入失败';
            notify(errorMessage, { type: 'error' });
            setImportResult({
                totalCount: 0,
                successCount: 0,
                failedCount: 1,
                results: [{ status: 'failed', message: errorMessage }],
            });
        }
        finally {
            setImporting(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(Title, { title: "\u6A21\u578B\u5BFC\u5165/\u5BFC\u51FA" }), _jsxs(Box, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h4", gutterBottom: true, children: "\u6A21\u578B\u5BFC\u5165/\u5BFC\u51FA" }), _jsxs(Grid, { container: true, spacing: 3, children: [_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "\u5BFC\u51FA\u6A21\u578B\u914D\u7F6E" }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 2 }, children: "\u5BFC\u51FA\u6240\u6709AI\u6A21\u578B\u914D\u7F6E\u4E3AJSON\u6587\u4EF6\uFF0C\u53EF\u7528\u4E8E\u5907\u4EFD\u6216\u8FC1\u79FB\u5230\u5176\u4ED6\u73AF\u5883" }), _jsx(Button, { variant: "contained", startIcon: exporting ? _jsx(CircularProgress, { size: 20 }) : _jsx(DownloadIcon, {}), onClick: handleExport, disabled: exporting, children: exporting ? '导出中...' : '导出模型配置' })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "\u5BFC\u5165\u6A21\u578B\u914D\u7F6E" }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 2 }, children: "\u4ECEJSON\u6587\u4EF6\u5BFC\u5165AI\u6A21\u578B\u914D\u7F6E" }), _jsx(MuiTextField, { fullWidth: true, multiline: true, rows: 6, label: "JSON\u6570\u636E", value: importData, onChange: (e) => setImportData(e.target.value), disabled: importing, sx: { mb: 2 }, placeholder: '{"models": [...], "options": {"overwrite": false, "skipErrors": false}}' }), _jsx(Button, { variant: "contained", startIcon: importing ? _jsx(CircularProgress, { size: 20 }) : _jsx(UploadIcon, {}), onClick: handleImport, disabled: importing || !importData.trim(), children: importing ? '导入中...' : '导入模型配置' }), importResult && (_jsxs(Box, { sx: { mt: 2 }, children: [_jsx(Alert, { severity: importResult.failedCount === 0 ? 'success' : 'warning', sx: { mb: 2 }, children: _jsxs(Typography, { variant: "body2", children: ["\u603B\u8BA1: ", importResult.totalCount, " | \u6210\u529F: ", importResult.successCount, " | \u5931\u8D25:", ' ', importResult.failedCount] }) }), importResult.results && importResult.results.length > 0 && (_jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle2", gutterBottom: true, children: "\u5BFC\u5165\u8BE6\u60C5:" }), importResult.results.map((result, index) => (_jsxs(Alert, { severity: result.status === 'success' ? 'success' : 'error', sx: { mb: 1 }, children: [result.modelId || `模型 ${index + 1}`, ": ", result.status, " -", ' ', result.message || result.error || ''] }, index)))] }))] }))] }) }) })] })] })] }));
};
