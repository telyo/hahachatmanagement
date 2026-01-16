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
  Alert,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import { Save as SaveIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useNotify, usePermissions } from 'react-admin';
import apiClient from '../../services/api';
import { hasPermission } from '../../utils/permissions';
import { authUtils } from '../../utils/auth';

interface WebSearchConfigData {
  tavilyApiKey: string;
  tavilyEnabled: boolean;
  googleApiKey: string;
  googleEnabled: boolean;
  googleSearchEngineId: string;
  bingApiKey: string;
  bingEnabled: boolean;
  baiduApiKey: string;
  baiduEnabled: boolean;
  baiduSecretKey: string;
}

export const WebSearchConfig = () => {
  const notify = useNotify();
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const userRole = adminInfo?.role;

  const canRead = hasPermission(permissions, 'web_search:read', userRole);
  const canWrite = hasPermission(permissions, 'web_search:write', userRole);

  const [config, setConfig] = useState<WebSearchConfigData | null>(null);
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
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      notify(err.response?.data?.message || '加载配置失败', { type: 'error' });
    } finally {
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
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      notify(err.response?.data?.message || '保存失败', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof WebSearchConfigData, value: any) => {
    if (!config) return;
    setConfig((prev) => ({
      ...prev!,
      [field]: value,
    }));
  };

  if (!canRead) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">无权限访问此页面</Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!config) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">无法加载配置</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        联网搜索配置
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        配置各搜索引擎的 API Key 和优先级。系统会按优先级顺序尝试使用搜索引擎，当前搜索引擎不可用时自动切换到下一个。
      </Typography>

      <Card>
        <CardContent>
          <Stack spacing={4}>
            {/* Tavily */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Tavily
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.tavilyEnabled}
                    onChange={(e) => handleChange('tavilyEnabled', e.target.checked)}
                    disabled={!canWrite}
                  />
                }
                label="优先使用"
              />
              <TextField
                label="Tavily API Key"
                type="password"
                value={config.tavilyApiKey}
                onChange={(e) => handleChange('tavilyApiKey', e.target.value)}
                disabled={!canWrite}
                fullWidth
                sx={{ mt: 2 }}
                helperText="Tavily 搜索引擎的 API Key（留空表示不更新）"
              />
            </Box>

            <Divider />

            {/* Google */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Google
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.googleEnabled}
                    onChange={(e) => handleChange('googleEnabled', e.target.checked)}
                    disabled={!canWrite}
                  />
                }
                label="优先使用"
              />
              <TextField
                label="Google API Key"
                type="password"
                value={config.googleApiKey}
                onChange={(e) => handleChange('googleApiKey', e.target.value)}
                disabled={!canWrite}
                fullWidth
                sx={{ mt: 2 }}
                helperText="Google Custom Search API 的 API Key（留空表示不更新）"
              />
              <TextField
                label="Google Search Engine ID"
                value={config.googleSearchEngineId}
                onChange={(e) => handleChange('googleSearchEngineId', e.target.value)}
                disabled={!canWrite}
                fullWidth
                sx={{ mt: 2 }}
                helperText="Google Custom Search Engine ID"
              />
            </Box>

            <Divider />

            {/* Bing */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Bing
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.bingEnabled}
                    onChange={(e) => handleChange('bingEnabled', e.target.checked)}
                    disabled={!canWrite}
                  />
                }
                label="优先使用"
              />
              <TextField
                label="Bing API Key"
                type="password"
                value={config.bingApiKey}
                onChange={(e) => handleChange('bingApiKey', e.target.value)}
                disabled={!canWrite}
                fullWidth
                sx={{ mt: 2 }}
                helperText="Bing Search API 的 API Key（留空表示不更新）"
              />
            </Box>

            <Divider />

            {/* Baidu */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Baidu（百度）
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={config.baiduEnabled}
                    onChange={(e) => handleChange('baiduEnabled', e.target.checked)}
                    disabled={!canWrite}
                  />
                }
                label="优先使用"
              />
              <TextField
                label="Baidu API Key"
                type="password"
                value={config.baiduApiKey}
                onChange={(e) => handleChange('baiduApiKey', e.target.value)}
                disabled={!canWrite}
                fullWidth
                sx={{ mt: 2 }}
                helperText="百度搜索 API 的 API Key（留空表示不更新）"
              />
              <TextField
                label="Baidu Secret Key"
                type="password"
                value={config.baiduSecretKey}
                onChange={(e) => handleChange('baiduSecretKey', e.target.value)}
                disabled={!canWrite}
                fullWidth
                sx={{ mt: 2 }}
                helperText="百度搜索 API 的 Secret Key（留空表示不更新）"
              />
            </Box>

            {canWrite && (
              <Stack direction="row" spacing={2} sx={{ mt: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  startIcon={<RefreshIcon />}
                  onClick={loadConfig}
                  disabled={saving || loading}
                >
                  重置
                </Button>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  onClick={handleSave}
                  disabled={saving || loading}
                >
                  {saving ? '保存中...' : '保存配置'}
                </Button>
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};
