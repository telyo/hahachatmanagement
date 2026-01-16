import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Button, useNotify, useRecordContext, } from 'react-admin';
import { Box, Card, CardContent, Typography, TextField as MuiTextField, CircularProgress, Alert, } from '@mui/material';
import { PlayArrow as PlayIcon } from '@mui/icons-material';
import apiClient from '../../services/api';
export const AIModelTest = () => {
    const record = useRecordContext();
    const notify = useNotify();
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState(null);
    const [testMessage, setTestMessage] = useState('Hello, this is a test');
    const handleTest = async () => {
        if (!record?.id) {
            notify('模型ID不存在', { type: 'error' });
            return;
        }
        setTesting(true);
        setTestResult(null);
        try {
            const response = await apiClient.post(`/admin/ai/models/${record.id}/test`, {
                testMessage: testMessage || 'Hello, this is a test',
            });
            const result = response.data.data;
            setTestResult({
                connected: result.connected || result.success || false,
                responseTime: result.responseTime || result.latencyMs,
                error: result.error,
                testResponse: result.testResponse || result.response,
            });
            if (result.connected || result.success) {
                notify('模型测试成功', { type: 'success' });
            }
            else {
                notify('模型测试失败', { type: 'error' });
            }
        }
        catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message || '测试失败';
            setTestResult({
                connected: false,
                error: errorMessage,
            });
            notify(errorMessage, { type: 'error' });
        }
        finally {
            setTesting(false);
        }
    };
    return (_jsx(Box, { sx: { p: 2 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "\u6D4B\u8BD5\u6A21\u578B\u8FDE\u63A5" }), _jsxs(Box, { sx: { mb: 2 }, children: [_jsx(MuiTextField, { fullWidth: true, label: "\u6D4B\u8BD5\u6D88\u606F", value: testMessage, onChange: (e) => setTestMessage(e.target.value), multiline: true, rows: 3, disabled: testing, sx: { mb: 2 } }), _jsx(Button, { label: "\u5F00\u59CB\u6D4B\u8BD5", onClick: handleTest, disabled: testing, variant: "contained", startIcon: testing ? _jsx(CircularProgress, { size: 20 }) : _jsx(PlayIcon, {}) })] }), testResult && (_jsxs(Box, { sx: { mt: 2 }, children: [testResult.connected ? (_jsxs(Alert, { severity: "success", sx: { mb: 2 }, children: ["\u8FDE\u63A5\u6210\u529F\uFF01", testResult.responseTime && (_jsxs(Typography, { variant: "body2", sx: { mt: 1 }, children: ["\u54CD\u5E94\u65F6\u95F4: ", testResult.responseTime, "ms"] }))] })) : (_jsxs(Alert, { severity: "error", sx: { mb: 2 }, children: ["\u8FDE\u63A5\u5931\u8D25: ", testResult.error || '未知错误'] })), testResult.testResponse && (_jsx(Card, { variant: "outlined", sx: { mt: 2 }, children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "subtitle2", gutterBottom: true, children: "\u6D4B\u8BD5\u54CD\u5E94:" }), _jsx(Typography, { variant: "body2", sx: { whiteSpace: 'pre-wrap' }, children: testResult.testResponse })] }) }))] }))] }) }) }));
};
