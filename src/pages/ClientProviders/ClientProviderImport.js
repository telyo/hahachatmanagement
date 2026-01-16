import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from 'react';
import { Box, Card, CardContent, Typography, Button, Alert, TextField as MuiTextField, CircularProgress, } from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { useNotify, Title } from 'react-admin';
import apiClient from '../../services/api';
export const ClientProviderImport = () => {
    const notify = useNotify();
    const [importing, setImporting] = useState(false);
    const [importData, setImportData] = useState('');
    const [importResult, setImportResult] = useState(null);
    const [fileInput, setFileInput] = useState(null);
    const handleFileSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file)
            return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result;
            setImportData(content);
        };
        reader.onerror = () => {
            notify('读取文件失败', { type: 'error' });
        };
        reader.readAsText(file);
    };
    const handleImport = async () => {
        if (!importData.trim()) {
            notify('请先粘贴或选择要导入的JSON文件', { type: 'error' });
            return;
        }
        setImporting(true);
        setImportResult(null);
        try {
            let providersData;
            try {
                providersData = JSON.parse(importData);
            }
            catch (e) {
                throw new Error('JSON格式错误，请检查数据格式');
            }
            // 如果直接是数组，包装成导入格式
            if (Array.isArray(providersData)) {
                providersData = { providers: providersData };
            }
            // 验证数据结构
            if (!providersData.providers || !Array.isArray(providersData.providers)) {
                throw new Error('JSON格式错误：必须包含 providers 数组');
            }
            const response = await apiClient.post('/admin/client-providers/import', providersData);
            setImportResult(response.data.data);
            if (response.data.data.failedCount === 0) {
                notify(`导入成功：成功导入 ${response.data.data.successCount} 个提供商`, { type: 'success' });
            }
            else {
                notify(`导入完成：成功 ${response.data.data.successCount}，失败 ${response.data.data.failedCount}`, { type: 'warning' });
            }
        }
        catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message || '导入失败';
            notify(errorMessage, { type: 'error' });
            setImportResult({
                totalCount: 0,
                successCount: 0,
                failedCount: 1,
                results: [{ providerCode: 'unknown', displayName: '未知', success: false, message: errorMessage }],
            });
        }
        finally {
            setImporting(false);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(Title, { title: "\u5BA2\u6237\u7AEF\u63D0\u4F9B\u5546\u5BFC\u5165" }), _jsxs(Box, { sx: { p: 3, maxWidth: 1200, margin: '0 auto' }, children: [_jsx(Typography, { variant: "h4", gutterBottom: true, children: "\u5BA2\u6237\u7AEF\u63D0\u4F9B\u5546\u5BFC\u5165" }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 3 }, children: "\u4ECEJSON\u6587\u4EF6\u6279\u91CF\u5BFC\u5165\u5BA2\u6237\u7AEF\u63D0\u4F9B\u5546\u914D\u7F6E\u3002\u5BFC\u5165\u7684\u63D0\u4F9B\u5546\u9ED8\u8BA4\u4E3A\u6D3B\u8DC3\u72B6\u6001\u3002" }), _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "\u5BFC\u5165\u63D0\u4F9B\u5546\u914D\u7F6E" }), _jsx(Typography, { variant: "body2", color: "text.secondary", sx: { mb: 2 }, children: "\u652F\u6301\u4E24\u79CD\u65B9\u5F0F\uFF1A1) \u9009\u62E9JSON\u6587\u4EF6 2) \u76F4\u63A5\u7C98\u8D34JSON\u6570\u636E" }), _jsxs(Box, { sx: { mb: 2 }, children: [_jsx("input", { accept: ".json", style: { display: 'none' }, id: "file-upload", type: "file", onChange: handleFileSelect, ref: (input) => setFileInput(input) }), _jsx("label", { htmlFor: "file-upload", children: _jsx(Button, { variant: "outlined", component: "span", disabled: importing, sx: { mr: 2 }, children: "\u9009\u62E9JSON\u6587\u4EF6" }) })] }), _jsx(MuiTextField, { fullWidth: true, multiline: true, rows: 12, label: "JSON\u6570\u636E", value: importData, onChange: (e) => setImportData(e.target.value), disabled: importing, sx: { mb: 2 }, placeholder: `{
  "providers": [
    {
      "providerCode": "openai",
      "displayName": "OpenAI",
      "baseUrl": "https://api.openai.com/v1",
      "defaultModel": "gpt-4o-mini",
      "sortOrder": 1,
      "isHahachat": false,
      "modelList": [
        {
          "modelId": "gpt-4o",
          "displayName": "GPT-4o"
        }
      ]
    }
  ]
}` }), _jsx(Button, { variant: "contained", startIcon: importing ? _jsx(CircularProgress, { size: 20 }) : _jsx(UploadIcon, {}), onClick: handleImport, disabled: importing || !importData.trim(), children: importing ? '导入中...' : '导入提供商配置' }), importResult && (_jsxs(Box, { sx: { mt: 3 }, children: [_jsxs(Alert, { severity: importResult.failedCount === 0 ? 'success' : 'warning', sx: { mb: 2 }, children: [_jsxs(Typography, { variant: "body2", children: ["\u603B\u8BA1: ", importResult.totalCount, " | \u6210\u529F: ", importResult.successCount, " | \u5931\u8D25:", ' ', importResult.failedCount] }), importResult.importedAt && (_jsxs(Typography, { variant: "caption", display: "block", sx: { mt: 1 }, children: ["\u5BFC\u5165\u65F6\u95F4: ", new Date(importResult.importedAt).toLocaleString('zh-CN')] }))] }), importResult.results && importResult.results.length > 0 && (_jsxs(Box, { children: [_jsx(Typography, { variant: "subtitle2", gutterBottom: true, children: "\u5BFC\u5165\u8BE6\u60C5:" }), importResult.results.map((result, index) => (_jsx(Alert, { severity: result.success ? 'success' : 'error', sx: { mb: 1 }, children: _jsxs(Typography, { variant: "body2", children: [_jsx("strong", { children: result.displayName }), " (", result.providerCode, "):", ' ', result.success ? '✓ 导入成功' : `✗ 导入失败: ${result.message}`, result.providerId && (_jsxs("span", { style: { marginLeft: 8, fontSize: '0.875rem', color: '#666' }, children: ["ID: ", result.providerId] }))] }) }, index)))] }))] }))] }) })] })] }));
};
