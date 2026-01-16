import { useState, useEffect } from 'react';
import { useLogin, useNotify, useRedirect } from 'react-admin';
import {
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
  Container,
  Alert,
} from '@mui/material';
import { LockOutlined } from '@mui/icons-material';
import { authUtils } from '../../utils/auth';
import { authService } from '../../services/auth';

export const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const login = useLogin();
  const notify = useNotify();
  const redirect = useRedirect();
  const [error, setError] = useState<string | null>(null);
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
      } catch (err: unknown) {
        // Token 无效或网络错误
        const error = err as { response?: { status?: number }; code?: string };
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ username, password });
      notify('登录成功', { type: 'success' });
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || '登录失败，请检查用户名和密码');
      notify(error.message || '登录失败', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 如果正在检查认证状态，显示加载中
  if (checkingAuth) {
    return (
      <Container maxWidth="sm">
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
          }}
        >
          <Card sx={{ width: '100%', maxWidth: 400 }}>
            <CardContent sx={{ p: 4, textAlign: 'center' }}>
              <Typography>检查登录状态...</Typography>
            </CardContent>
          </Card>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <Card sx={{ width: '100%', maxWidth: 400 }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
              <LockOutlined sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography component="h1" variant="h4" gutterBottom>
                HahaChat 后台管理
              </Typography>
              <Typography variant="body2" color="text.secondary">
                请登录您的管理员账户
              </Typography>
            </Box>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="用户名"
                name="username"
                autoComplete="username"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="密码"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? '登录中...' : '登录'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

