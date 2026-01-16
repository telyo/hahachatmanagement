import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { useNotify, useRedirect } from 'react-admin';
import { Card, CardContent, Typography, TextField, Button, Box, Alert, } from '@mui/material';
import apiClient from '../../services/api';
export const ChangePassword = () => {
    const notify = useNotify();
    const redirect = useRedirect();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        // 验证
        if (!oldPassword || !newPassword || !confirmPassword) {
            setError('请填写所有字段');
            return;
        }
        if (newPassword.length < 8) {
            setError('新密码至少需要8位字符');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('两次输入的新密码不一致');
            return;
        }
        if (oldPassword === newPassword) {
            setError('新密码不能与旧密码相同');
            return;
        }
        setLoading(true);
        try {
            await apiClient.post('/admin/auth/change-password', {
                oldPassword,
                newPassword,
            });
            notify('密码修改成功', { type: 'success' });
            // 清空表单
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
            // 可选：重定向到首页
            // redirect('/');
        }
        catch (error) {
            const errorMessage = error?.response?.data?.message || '修改密码失败';
            setError(errorMessage);
            notify(errorMessage, { type: 'error' });
        }
        finally {
            setLoading(false);
        }
    };
    return (_jsx(Box, { sx: { maxWidth: 600, margin: '0 auto', padding: 3 }, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h5", component: "h1", gutterBottom: true, children: "\u4FEE\u6539\u5BC6\u7801" }), error && (_jsx(Alert, { severity: "error", sx: { mb: 2 }, children: error })), _jsxs("form", { onSubmit: handleSubmit, children: [_jsx(TextField, { fullWidth: true, label: "\u65E7\u5BC6\u7801", type: "password", value: oldPassword, onChange: (e) => setOldPassword(e.target.value), margin: "normal", required: true, autoComplete: "current-password" }), _jsx(TextField, { fullWidth: true, label: "\u65B0\u5BC6\u7801", type: "password", value: newPassword, onChange: (e) => setNewPassword(e.target.value), margin: "normal", required: true, helperText: "\u81F3\u5C118\u4F4D\u5B57\u7B26", autoComplete: "new-password" }), _jsx(TextField, { fullWidth: true, label: "\u786E\u8BA4\u65B0\u5BC6\u7801", type: "password", value: confirmPassword, onChange: (e) => setConfirmPassword(e.target.value), margin: "normal", required: true, autoComplete: "new-password" }), _jsxs(Box, { sx: { mt: 3, display: 'flex', gap: 2 }, children: [_jsx(Button, { type: "submit", variant: "contained", disabled: loading, fullWidth: true, children: loading ? '修改中...' : '修改密码' }), _jsx(Button, { variant: "outlined", onClick: () => redirect('/'), fullWidth: true, children: "\u53D6\u6D88" })] })] })] }) }) }));
};
