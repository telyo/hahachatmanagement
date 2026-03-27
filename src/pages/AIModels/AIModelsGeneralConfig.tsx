import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  Typography,
  MenuItem,
  TextField,
  Divider,
} from '@mui/material';
import { Save as SaveIcon, Refresh as RefreshIcon } from '@mui/icons-material';
import { useNotify, useGetList } from 'react-admin';
import apiClient from '../../services/api';

type AIModelsGeneralConfig = {
  enabledDefaultImageGenerationModel: boolean;
  defaultImageGenerationModelId: string;
};

type AdminAIModelOption = {
  id: string;
  name?: string;
  displayName?: string;
  modelId?: string;
  type?: string;
  category?: string;
  capabilities?: {
    supportsImageGeneration?: boolean;
  };
};

export const AIModelsGeneralConfigTab = () => {
  const notify = useNotify();
  const [config, setConfig] = useState<AIModelsGeneralConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { data: models = [] } = useGetList<AdminAIModelOption>('ai-models', {
    pagination: { page: 1, perPage: 200 },
    sort: { field: 'displayConfig.sortOrder', order: 'ASC' },
    filter: { status: 'active' },
  });

  const imageModelChoices = useMemo(() => {
    return models
      .filter((m) => m && (m.type === 'image' || m.category === 'image-generation' || m.capabilities?.supportsImageGeneration))
      .map((m) => ({
        id: m.id,
        label: `${m.displayName || m.name} (${m.modelId || m.id})`,
      }));
  }, [models]);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const resp = await apiClient.get('/admin/ai/models/config');
      const data = resp.data?.data || {};
      const defaultId = String(data.defaultImageGenerationModelId || '');
      setConfig({
        enabledDefaultImageGenerationModel: Boolean(defaultId),
        defaultImageGenerationModelId: defaultId,
      });
    } catch (e: any) {
      notify(e?.response?.data?.message || e?.message || '加载通用配置失败', { type: 'error' });
      setConfig({
        enabledDefaultImageGenerationModel: false,
        defaultImageGenerationModelId: '',
      });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleSave = async () => {
    if (!config) return;
    try {
      setSaving(true);
      const payload = {
        defaultImageGenerationModelId: config.enabledDefaultImageGenerationModel ? config.defaultImageGenerationModelId : '',
      };
      await apiClient.put('/admin/ai/models/config', payload);
      notify('通用配置保存成功', { type: 'success' });
      await loadConfig();
    } catch (e: any) {
      notify(e?.response?.data?.message || e?.message || '保存通用配置失败', { type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!config) {
    return <Alert severity="error">无法加载通用配置</Alert>;
  }

  return (
    <Box sx={{ mt: 2, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>
        通用配置
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        这里的设置对所有模型生效，用于工具链（如 generate_image）的默认路由与回退策略。
      </Typography>

      <Card>
        <CardContent>
          <Stack spacing={3}>
            <FormControlLabel
              control={
                <Switch
                  checked={config.enabledDefaultImageGenerationModel}
                  onChange={(e) =>
                    setConfig({
                      ...config,
                      enabledDefaultImageGenerationModel: e.target.checked,
                      defaultImageGenerationModelId: e.target.checked ? config.defaultImageGenerationModelId : '',
                    })
                  }
                />
              }
              label="启用默认图片生成模型"
            />

            <Divider />

            <TextField
              select
              label="默认图片生成模型"
              value={config.defaultImageGenerationModelId}
              onChange={(e) => setConfig({ ...config, defaultImageGenerationModelId: e.target.value })}
              disabled={!config.enabledDefaultImageGenerationModel}
              helperText="当对话模型未指定出图模型/或工具未显式指定 model 时，后端使用此模型生成图片"
              fullWidth
            >
              <MenuItem value="">（未选择）</MenuItem>
              {imageModelChoices.map((c) => (
                <MenuItem key={c.id} value={c.id}>
                  {c.label}
                </MenuItem>
              ))}
            </TextField>

            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving || (config.enabledDefaultImageGenerationModel && !config.defaultImageGenerationModelId)}
              >
                保存
              </Button>
              <Button variant="outlined" startIcon={<RefreshIcon />} onClick={loadConfig} disabled={saving}>
                刷新
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

