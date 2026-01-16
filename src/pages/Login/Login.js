import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useLogin, useNotify, useRedirect } from 'react-admin';
import { Box, Button, Card, CardContent, TextField, Typography, Container, Alert, } from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { authUtils } from '../../utils/auth';
import { authService } from '../../services/auth';
export const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const login = useLogin();
    const notify = useNotify();
    const redirect = useRedirect();
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);
    // 如果已经登录且 token 有效，重定向到主页
    useEffect(() => {
        const checkAuthAndRedirect = async () => {
            const token = authUtils.getToken();
            const adminInfo = authUtils.getAdminInfo();
            // 如果没有 token 或 adminInfo，直接显示登录页
            if (!token || !adminInfo?.id) {
                setCheckingAuth(false);
                return;
            }
            // 验证 token 是否有效
            try {
                await authService.getMe();
                // Token 有效，重定向到主页
                redirect('/');
            }
            catch (err) {
                // Token 无效或网络错误
                const error = err;
                if (error.response?.status === 401) {
                    // Token 无效，清除本地存储
                    authUtils.removeToken();
                }
                // 网络错误或其他错误，也清除（避免使用过期 token）
                // 这样用户需要重新登录
                setCheckingAuth(false);
            }
        };
        checkAuthAndRedirect();
    }, [redirect]);
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            await login({ username, password });
            notify('登录成功', { type: 'success' });
        }
        catch (err) {
            const error = err;
            setError(error.message || '登录失败，请检查用户名和密码');
            notify(error.message || '登录失败', { type: 'error' });
        }
        finally {
            setLoading(false);
        }
    };
    // 如果正在检查认证状态，显示加载中
    if (checkingAuth) {
        return (_jsx(Container, { maxWidth: "sm", children: _jsx(Box, { sx: {
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                }, children: _jsx(Card, { sx: { width: '100%', maxWidth: 400 }, children: _jsx(CardContent, { sx: { p: 4, textAlign: 'center' }, children: _jsx(Typography, { children: "\u68C0\u67E5\u767B\u5F55\u72B6\u6001..." }) }) }) }) }));
    }
    return (_jsx(Container, { maxWidth: "sm", children: _jsx(Box, { sx: {
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '100vh',
            }, children: _jsx(Card, { sx: { width: '100%', maxWidth: 400 }, children: _jsxs(CardContent, { sx: { p: 4 }, children: [_jsxs(Box, { sx: { display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }, children: [_jsx(LockOutlined, { sx: { fontSize: 48, color: 'primary.main', mb: 2 } }), _jsx(Typography, { component: "h1", variant: "h4", gutterBottom: true, children: "HahaChat \u540E\u53F0\u7BA1\u7406" }), _jsx(Typography, { variant: "body2", color: "text.secondary", children: "\u8BF7\u767B\u5F55\u60A8\u7684\u7BA1\u7406\u5458\u8D26\u6237" })] }), error && (_jsx(Alert, { severity: "error", sx: { mb: 2 }, children: error })), _jsxs(Box, { component: "form", onSubmit: handleSubmit, children: [_jsx(TextField, { margin: "normal", required: true, fullWidth: true, id: "username", label: "\u7528\u6237\u540D", name: "username", autoComplete: "username", autoFocus: true, value: username, onChange: (e) => setUsername(e.target.value), disabled: loading }), _jsx(TextField, { margin: "normal", required: true, fullWidth: true, name: "password", label: "\u5BC6\u7801", type: "password", id: "password", autoComplete: "current-password", value: password, onChange: (e) => setPassword(e.target.value), disabled: loading }), _jsx(Button, { type: "submit", fullWidth: true, variant: "contained", sx: { mt: 3, mb: 2 }, disabled: loading, children: loading ? '登录中...' : '登录' })] })] }) }) }) }));
};
