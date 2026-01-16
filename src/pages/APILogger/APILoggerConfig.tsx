import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Chip,
  Stack,
  Alert,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Save as SaveIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useNotify, List } from 'react-admin';
import apiClient from '../../services/api';

interface APILoggerConfig {
  enabled: boolean;
  logAll: boolean;
  whitelist: string[];
  logResponseOnSuccess: boolean;
  logRequestHeaders: boolean;
  logRequestBody: boolean;
}

// 作为 List 组件使用（用于 Resource）
export const APILoggerConfigList = () => {
  return (
    <List>
      <APILoggerConfigContent />
    </List>
  );
};

// 作为独立页面使用（用于 CustomRoutes）
export const APILoggerConfig = () => {
  return <APILoggerConfigContent />;
};

// 实际的内容组件
const APILoggerConfigContent = () => {
  const [config, setConfig] = useState<APILoggerConfig | null>(null);
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
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      notify(err.response?.data?.message || '加载配置失败', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  // 加载配置
  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    if (!config) return;

    try {
      setSaving(true);
      await apiClient.put('/admin/api-logger/config', config);
      notify('配置保存成功', { type: 'success' });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      notify(err.response?.data?.message || '保存配置失败', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      await apiClient.post('/admin/api-logger/config/reset');
      notify('配置已重置为初始值', { type: 'success' });
      await loadConfig();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      notify(err.response?.data?.message || '重置配置失败', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddPath = () => {
    if (!newPath.trim() || !config) return;

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

  const handleRemovePath = (path: string) => {
    if (!config) return;
    setConfig({
      ...config,
      whitelist: config.whitelist.filter((p) => p !== path),
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!config) {
    return <Alert severity="error">无法加载配置</Alert>;
  }

  return (
    <Box sx={{ mt: 2, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        API 日志配置
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        配置 API 日志的输出规则。可以启用/禁用日志，设置是否记录所有接口，或配置白名单。
      </Typography>

      <Card>
        <CardContent>
          <Stack spacing={3}>
            {/* 启用日志 */}
            <FormControlLabel
              control={
                <Switch
                  checked={config.enabled}
                  onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                />
              }
              label="启用 API 日志"
            />
            <Typography variant="body2" color="text.secondary">
              启用后，系统将根据下方配置记录 API 请求和响应日志
            </Typography>

            <Divider />

            {/* 记录所有接口 */}
            <FormControlLabel
              control={
                <Switch
                  checked={config.logAll}
                  onChange={(e) => setConfig({ ...config, logAll: e.target.checked })}
                  disabled={!config.enabled}
                />
              }
              label="记录所有接口"
            />
            <Typography variant="body2" color="text.secondary">
              启用后，将记录所有 API 接口的日志。禁用后，只记录白名单中的接口
            </Typography>

            <Divider />

            {/* 白名单管理 */}
            {!config.logAll && (
              <>
                <Box>
                  <Typography variant="h6" gutterBottom>
                    接口白名单
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    只记录白名单中的接口。支持通配符 *，例如：/api/v1/admin/*
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                    <TextField
                      label="接口路径"
                      value={newPath}
                      onChange={(e) => setNewPath(e.target.value)}
                      placeholder="/api/v1/admin/*"
                      size="small"
                      fullWidth
                      disabled={!config.enabled}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleAddPath();
                        }
                      }}
                    />
                    <Button
                      variant="outlined"
                      onClick={handleAddPath}
                      disabled={!config.enabled || !newPath.trim()}
                    >
                      添加
                    </Button>
                  </Stack>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {config.whitelist && Array.isArray(config.whitelist) && config.whitelist.length > 0 ? (
                      config.whitelist.map((path) => (
                        <Chip
                          key={path}
                          label={path}
                          onDelete={() => handleRemovePath(path)}
                          color="primary"
                          variant="outlined"
                        />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        暂无白名单路径
                      </Typography>
                    )}
                  </Stack>
                </Box>
                <Divider />
              </>
            )}

            {/* 记录成功响应 */}
            <FormControlLabel
              control={
                <Switch
                  checked={config.logResponseOnSuccess}
                  onChange={(e) =>
                    setConfig({ ...config, logResponseOnSuccess: e.target.checked })
                  }
                  disabled={!config.enabled}
                />
              }
              label="记录成功响应的响应体"
            />
            <Typography variant="body2" color="text.secondary">
              启用后，成功响应（2xx）的响应体也会被记录。默认只记录错误响应（4xx、5xx）的响应体
            </Typography>

            <Divider />

            {/* 记录请求头 */}
            <FormControlLabel
              control={
                <Switch
                  checked={config.logRequestHeaders}
                  onChange={(e) =>
                    setConfig({ ...config, logRequestHeaders: e.target.checked })
                  }
                  disabled={!config.enabled}
                />
              }
              label="记录请求头"
            />
            <Typography variant="body2" color="text.secondary">
              启用后，API 日志将包含请求头信息（敏感信息如 Authorization 和 Cookie 会被隐藏）
            </Typography>

            <Divider />

            {/* 记录请求体 */}
            <FormControlLabel
              control={
                <Switch
                  checked={config.logRequestBody}
                  onChange={(e) =>
                    setConfig({ ...config, logRequestBody: e.target.checked })
                  }
                  disabled={!config.enabled}
                />
              }
              label="记录请求体"
            />
            <Typography variant="body2" color="text.secondary">
              启用后，API 日志将包含请求体内容。禁用时，即使请求体有内容也不会记录（但会显示请求体大小）
            </Typography>

            <Divider />

            {/* 操作按钮 */}
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? '保存中...' : '保存配置'}
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={handleReset}
                disabled={saving}
              >
                重置为初始值
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

