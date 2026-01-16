import { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { useGetList } from 'react-admin';
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Checkbox,
  Chip,
  CircularProgress,
  Alert,
  Link,
  IconButton,
} from '@mui/material';
import {
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

interface ProviderSelectorProps {
  source: string;
  label: string;
  helperText?: string;
  currentModelId?: string; // 当前模型ID，用于过滤提供商的 supportedModels
}

export const ProviderSelector = ({ source, label, helperText, currentModelId }: ProviderSelectorProps) => {
  const { watch, setValue } = useFormContext();
  const selectedProviders = watch(source) || [];
  const [open, setOpen] = useState(false);

  // 获取所有 Hahachat 提供商
  const { data: providersData, isLoading } = useGetList('hahachat-providers', {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: 'sortOrder', order: 'ASC' },
    filter: { status: 'active' }, // 只显示活跃的提供商
  });

  let providers = Array.isArray(providersData) ? providersData : (providersData?.data || []);

  // 如果提供了 currentModelId，过滤提供商：只显示 supportedModels 为空或包含当前模型ID的提供商
  if (currentModelId) {
    providers = providers.filter((provider: any) => {
      const supportedModels = provider.supportedModels || [];
      // 如果 supportedModels 为空，表示支持所有模型
      if (supportedModels.length === 0) {
        return true;
      }
      // 检查是否包含当前模型ID
      return supportedModels.includes(currentModelId);
    });
  }

  // 将 providers 数组转换为对象，方便查找
  const providersMap = new Map(providers.map((p: any) => [p.providerId || p.id, p]));

  // 获取已选择的提供商信息（按 sortOrder 排序）
  const selectedProvidersInfo = selectedProviders
    .map((item: any) => {
      const providerId = typeof item === 'string' ? item : item.providerId;
      const provider = providersMap.get(providerId);
      if (!provider) return null;
      return {
        providerId,
        sortOrder: typeof item === 'object' ? (item.sortOrder || 0) : 0,
        provider,
      };
    })
    .filter((item: any) => item !== null)
    .sort((a: any, b: any) => a.sortOrder - b.sortOrder);

  const handleToggle = (providerId: string) => {
    const current = selectedProviders || [];
    const existingIndex = current.findIndex(
      (item: any) => (typeof item === 'string' ? item : item.providerId) === providerId
    );

    if (existingIndex >= 0) {
      // 移除
      const newSelection = current.filter(
        (_: any, index: number) => index !== existingIndex
      );
      setValue(source, newSelection, { shouldDirty: true });
    } else {
      // 添加（使用对象格式，包含 providerId 和 sortOrder）
      const maxSortOrder = selectedProvidersInfo.length > 0
        ? Math.max(...selectedProvidersInfo.map((item: any) => item.sortOrder))
        : -1;
      const newItem = {
        providerId,
        sortOrder: maxSortOrder + 1,
      };
      setValue(source, [...current, newItem], { shouldDirty: true });
    }
  };

  const handleRemove = (providerId: string) => {
    const current = selectedProviders || [];
    const newSelection = current.filter(
      (item: any) => (typeof item === 'string' ? item : item.providerId) !== providerId
    );
    setValue(source, newSelection, { shouldDirty: true });
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const items = Array.from(selectedProvidersInfo);
    [items[index - 1], items[index]] = [items[index], items[index - 1]];
    const newSelection = items.map((item: any, idx: number) => ({
      providerId: item.providerId,
      sortOrder: idx,
    }));
    setValue(source, newSelection, { shouldDirty: true });
  };

  const handleMoveDown = (index: number) => {
    if (index >= selectedProvidersInfo.length - 1) return;
    const items = Array.from(selectedProvidersInfo);
    [items[index], items[index + 1]] = [items[index + 1], items[index]];
    const newSelection = items.map((item: any, idx: number) => ({
      providerId: item.providerId,
      sortOrder: idx,
    }));
    setValue(source, newSelection, { shouldDirty: true });
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
  };

  return (
    <Box>
      <Typography variant="body2" sx={{ mb: 1 }}>{label}</Typography>
      {helperText && (
        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
          {helperText}
        </Typography>
      )}
      <Button
        variant="outlined"
        onClick={handleOpen}
        disabled={isLoading}
        fullWidth
        sx={{ mb: 1 }}
      >
        {isLoading ? '加载中...' : `选择提供商 (已选 ${selectedProvidersInfo.length} 个)`}
      </Button>

      {selectedProvidersInfo.length > 0 && (
        <Box sx={{ mt: 1 }}>
          {selectedProvidersInfo.map((item: any, index: number) => {
            const provider = item.provider;
            return (
              <Box
                key={item.providerId}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 0.5,
                  p: 1,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <IconButton
                    size="small"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                  >
                    <ArrowUpwardIcon fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleMoveDown(index)}
                    disabled={index >= selectedProvidersInfo.length - 1}
                  >
                    <ArrowDownwardIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Chip
                  label={`${index + 1}. ${provider.displayName || provider.name}`}
                  size="small"
                  onDelete={() => handleRemove(item.providerId)}
                />
                <Typography variant="caption" color="text.secondary">
                  (优先级 {index + 1})
                </Typography>
              </Box>
            );
          })}
        </Box>
      )}

      {providers.length === 0 && !isLoading && (
        <Alert severity="warning" sx={{ mt: 1 }}>
          还没有配置 Hahachat 提供商，请先{' '}
          <Link href="#/hahachat-providers/create" onClick={(e) => {
            e.preventDefault();
            window.location.href = '#/hahachat-providers/create';
          }}>
            创建 Hahachat 提供商
          </Link>
        </Alert>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
        <DialogTitle>{label}</DialogTitle>
        <DialogContent>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : providers.length === 0 ? (
            <Alert severity="info">
              还没有配置 Hahachat 提供商，请先{' '}
              <Link href="#/hahachat-providers/create" onClick={(e) => {
                e.preventDefault();
                window.location.href = '#/hahachat-providers/create';
              }}>
                创建 Hahachat 提供商
              </Link>
            </Alert>
          ) : (
            <List>
              {providers.map((provider: any) => {
                const providerId = provider.providerId || provider.id;
                const isSelected = selectedProvidersInfo.some(
                  (item: any) => item.providerId === providerId
                );
                return (
                  <ListItem key={providerId} disablePadding>
                    <ListItemButton onClick={() => handleToggle(providerId)}>
                      <ListItemIcon>
                        <Checkbox checked={isSelected} />
                      </ListItemIcon>
                      <ListItemText
                        primary={provider.displayName || provider.name}
                        secondary={
                          <Box>
                            <Typography variant="caption" display="block">
                              提供商ID: {providerId}
                            </Typography>
                            {provider.apiEndpoint && (
                              <Typography variant="caption" display="block">
                                API 端点: {provider.apiEndpoint}
                              </Typography>
                            )}
                            {provider.status && (
                              <Typography variant="caption" display="block" color={provider.status === 'active' ? 'success.main' : 'text.secondary'}>
                                状态: {provider.status === 'active' ? '活跃' : '未激活'}
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                );
              })}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>完成</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
