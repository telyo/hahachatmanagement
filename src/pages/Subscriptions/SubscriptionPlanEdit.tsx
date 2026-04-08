import { 
  Edit, 
  SimpleForm, 
  TextInput, 
  NumberInput, 
  SelectInput, 
  BooleanInput,
  ArrayInput,
  SimpleFormIterator,
  useNotify,
  useRefresh,
  useDataProvider,
  useRecordContext,
  usePermissions,
  FormDataConsumer,
  useGetList,
  useRedirect,
  useGetOne,
} from 'react-admin';
import { useFormContext, useWatch, useFieldArray } from 'react-hook-form';
import { 
  Typography, 
  Box, 
  Grid, 
  Paper, 
  Alert, 
  Button, 
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Chip,
  Link,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { hasPermission } from '../../utils/permissions';
import { authUtils } from '../../utils/auth';
import { useState, useCallback, useEffect } from 'react';
import apiClient from '../../services/api';
import { SortableModelChips } from '../../components/SortableModelChips';

export const SubscriptionPlanEdit = () => {
  const notify = useNotify();
  const refresh = useRefresh();
  const dataProvider = useDataProvider();
  const record = useRecordContext();
  const { id } = useParams();
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const canWrite = hasPermission(permissions, 'subscriptions:write', adminInfo?.role);
  
  // 如果 useRecordContext 没有数据，使用 useGetOne 获取
  const planId = (record?.id || record?.planId || id) as string;
  const { data: fetchedRecord, isLoading } = useGetOne(
    'subscription-plans',
    { id: planId },
    { enabled: !!planId && !record }
  );
  
  // 使用 fetchedRecord 或 record
  const displayRecord = record || fetchedRecord;

  if (!canWrite) {
    return (
      <Edit>
        <SimpleForm>
          <Alert severity="warning" sx={{ m: 2 }}>
            您没有编辑套餐的权限。如需使用，请联系超级管理员。
          </Alert>
        </SimpleForm>
      </Edit>
    );
  }

  // 生成唯一ID的辅助函数

  // 清理数字字段，将 undefined 或空字符串转换为 null 或 0
  const cleanNumericField = (value: any): number | null => {
    if (value === undefined || value === '' || value === null) {
      return null;
    }
    const num = Number(value);
    return isNaN(num) ? null : num;
  };

  // 清理数组字段，确保是有效数组或空数组
  const cleanArrayField = (value: any): any[] => {
    if (value === undefined || value === null) {
      return [];
    }
    if (Array.isArray(value)) {
      // 过滤掉无效项，并清理每个项
      return value
        .filter(item => item !== undefined && item !== null)
        .map(item => {
          // 如果是对象，清理对象内的字段
          if (typeof item === 'object' && !Array.isArray(item)) {
            const cleaned: any = {};
            Object.keys(item).forEach(key => {
              if (item[key] !== undefined) {
                cleaned[key] = item[key] === '' ? null : item[key];
              }
            });
            return cleaned;
          }
          // 如果是字符串，过滤空字符串
          return item === '' ? null : item;
        })
        .filter(item => {
          // 对于对象，至少有一个非空字段才保留
          if (typeof item === 'object' && item !== null && !Array.isArray(item)) {
            return Object.values(item).some(val => val !== null && val !== '');
          }
          return item !== null;
        });
    }
    return [];
  };

  // 清理 pricing 项中的数字字段
  const cleanPricingItem = (item: any): any => {
    if (!item || typeof item !== 'object') {
      return item;
    }
    
    const cleaned: any = { ...item };
    
    // 清理数字字段
    if ('price' in cleaned) cleaned.price = cleanNumericField(cleaned.price);
    if ('originalPrice' in cleaned) cleaned.originalPrice = cleanNumericField(cleaned.originalPrice);
    if ('savedAmount' in cleaned) cleaned.savedAmount = cleanNumericField(cleaned.savedAmount);
    
    // 清理嵌套的 benefits 对象
    if (cleaned.benefits !== undefined && cleaned.benefits !== null) {
      if (typeof cleaned.benefits === 'object' && !Array.isArray(cleaned.benefits)) {
        cleaned.benefits = {
          ...cleaned.benefits,
          monthlyCredits: cleanNumericField(cleaned.benefits.monthlyCredits),
          creditsLabel: cleaned.benefits.creditsLabel || null,
          creditsDescription: cleaned.benefits.creditsDescription || null,
        };
      } else {
        // 如果 benefits 不是对象，初始化为空对象
        cleaned.benefits = {
          monthlyCredits: null,
          creditsLabel: null,
          creditsDescription: null,
        };
      }
    }
    
    // 清理数组字段
    if ('advantages' in cleaned) {
      cleaned.advantages = cleanArrayField(cleaned.advantages);
    }
    if ('supportedModels' in cleaned) {
      cleaned.supportedModels = cleanArrayField(cleaned.supportedModels);
    }
    if ('exclusiveModels' in cleaned) {
      cleaned.exclusiveModels = cleanArrayField(cleaned.exclusiveModels);
    }
    
    // 清理字符串字段，将 undefined 转为 null
    const stringFields = ['type', 'currency', 'displayPrice', 'savedLabel', 'renewLabel', 'icon', 'iosProductId'];
    stringFields.forEach(field => {
      if (field in cleaned && cleaned[field] === undefined) {
        cleaned[field] = null;
      }
    });
    
    // 清理布尔字段
    if ('autoRenew' in cleaned && cleaned.autoRenew === undefined) {
      cleaned.autoRenew = true; // 默认值
    }
    
    return cleaned;
  };

  const handleSave = async (data: Record<string, unknown>) => {
    console.log('[SubscriptionPlanEdit] handleSave 被调用，原始数据:', JSON.stringify(data, null, 2));
    
    // 修复数据结构：如果顶层有 pricing 相关字段，将它们移动到 pricing 数组中
    // React Admin 的 ArrayInput 有时会将数据扁平化
    const pricingFields = ['type', 'price', 'currency', 'displayPrice', 'originalPrice', 'savedAmount', 
                          'savedLabel', 'autoRenew', 'renewLabel', 'icon', 'benefits', 'advantages', 
                          'supportedModels', 'exclusiveModels', 'iosProductId'];
    
    // 检查顶层是否有 pricing 相关字段
    const hasTopLevelPricingFields = pricingFields.some(field => data[field] !== undefined);
    
    if (hasTopLevelPricingFields) {
      console.log('[SubscriptionPlanEdit] 检测到顶层 pricing 字段，正在修复数据结构...');
      
      // 创建一个 pricing 项对象
      const pricingItem: Record<string, unknown> = {};
      pricingFields.forEach(field => {
        if (data[field] !== undefined) {
          pricingItem[field] = data[field];
          delete data[field]; // 从顶层删除
        }
      });
      
      // 确保 pricing 是数组
      if (!data.pricing || !Array.isArray(data.pricing)) {
        data.pricing = [];
      }
      
      const pricingArray = data.pricing as unknown[];
      
      // 如果 pricing 数组为空或第一个元素无效，替换它
      if (pricingArray.length === 0 || 
          (pricingArray.length === 1 && (pricingArray[0] === '' || pricingArray[0] === null))) {
        data.pricing = [pricingItem];
      } else {
        // 否则合并到第一个元素
        const firstItem = pricingArray[0] as Record<string, unknown>;
        data.pricing = [{ ...firstItem, ...pricingItem }, ...pricingArray.slice(1)];
      }
      
      console.log('[SubscriptionPlanEdit] 修复后的数据结构:', JSON.stringify(data, null, 2));
    }
    
    // 清理 pricing 数组：移除空字符串、null 或无效项
    if (Array.isArray(data.pricing)) {
      const pricingArray = data.pricing as unknown[];
      data.pricing = pricingArray.filter((item: unknown) => {
        // 移除空字符串、null、undefined
        if (item === '' || item === null || item === undefined) {
          return false;
        }
        // 如果是对象，检查是否有有效字段
        if (typeof item === 'object' && !Array.isArray(item)) {
          const itemObj = item as Record<string, unknown>;
          return itemObj.type || itemObj.price !== undefined;
        }
        return false;
      });
    }
    
    try {
      // 使用 record.id 或 URL 参数中的 id，不使用 data.id（前端不应生成ID）
      const planId = (displayRecord?.id || record?.id || id) as string;
      
      if (!planId) {
        notify('套餐ID不存在', { type: 'error' });
        return;
      }

      // 验证 pricing 数组不为空
      if (!data.pricing || !Array.isArray(data.pricing) || data.pricing.length === 0) {
        notify('请至少添加一个价格配置项', { type: 'error' });
        return;
      }

      // 清理顶层数字字段
      if ('duration' in data) data.duration = cleanNumericField(data.duration);
      if ('sortOrder' in data) data.sortOrder = cleanNumericField(data.sortOrder) ?? 0;

      // 为每个 pricing 项自动生成 id 并清理数字字段
      if (Array.isArray(data.pricing)) {
        data.pricing = data.pricing
          .filter((item: any) => item !== null && item !== undefined)
          .map((item: any) => {
            const cleaned = cleanPricingItem(item);
            // 移除前端生成的 id，让后端自动生成
            if (cleaned && typeof cleaned === 'object' && 'id' in cleaned) {
              delete cleaned.id;
            }
            return cleaned;
          })
          .filter((item: any) => item !== null && item !== undefined);
      }

      // 清理顶层字符串字段
      const topLevelStringFields = ['name', 'billingCycle', 'status'];
      topLevelStringFields.forEach(field => {
        if (field in data && data[field] === undefined) {
          data[field] = null;
        }
      });

      await dataProvider.update('subscription-plans', {
        id: planId,
        data: data,
        previousData: displayRecord || record || {},
      });
      notify('套餐更新成功', { type: 'success' });
      refresh();
    } catch (error: unknown) {
      const errorMessage = (error as { message?: string })?.message || '更新失败';
      notify(errorMessage, { type: 'error' });
    }
  };

  // 自定义模型选择器组件（使用前缀路径）
  const CustomModelSelector = ({ prefix, fieldName, label, helperText }: { 
    prefix: string;
    fieldName: string;
    label: string;
    helperText?: string;
  }) => {
    const { watch, setValue } = useFormContext();
    const source = `${prefix}.${fieldName}`;
    const selectedModels = watch(source) || [];
    const [open, setOpen] = useState(false);
    
    // 获取AI模型列表
    const { data: modelsData, isLoading, error } = useGetList('ai-models', {
      pagination: { page: 1, perPage: 1000 },
      sort: { field: 'name', order: 'ASC' },
    });

    // useGetList 返回的 data 本身就是数组，不是 { data: [...] }
    const models = Array.isArray(modelsData) ? modelsData : (modelsData?.data || []);

    const handleOpen = () => {
      if (models.length === 0) {
        notify('没有可用的AI模型，请先配置模型', { type: 'warning' });
        return;
      }
      setOpen(true);
    };

    const handleClose = () => {
      setOpen(false);
    };

    const handleToggleModel = (modelId: string) => {
      const current = Array.isArray(selectedModels) ? [...selectedModels] : [];
      const index = current.indexOf(modelId);
      if (index > -1) {
        current.splice(index, 1);
      } else {
        current.push(modelId);
      }
      setValue(source, current, { shouldDirty: true });
    };

    const handleSelectAll = () => {
      const allModelIds = models.map((model: any) => model.id).filter(Boolean);
      setValue(source, allModelIds, { shouldDirty: true });
    };

    const handleClearAll = () => {
      setValue(source, [], { shouldDirty: true });
    };

    if (error) {
      return (
        <Box>
          <Typography variant="body2" color="error">
            加载模型列表失败
          </Typography>
        </Box>
      );
    }

    if (!isLoading && models.length === 0) {
      return (
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>{label}</Typography>
          <Alert severity="info" sx={{ mb: 1 }}>
            还没有配置AI模型。请先{' '}
            <Link
              component="button"
              variant="body2"
              onClick={() => redirect('/ai-models/create')}
              sx={{ textDecoration: 'underline', cursor: 'pointer' }}
            >
              创建AI模型
            </Link>
            {' '}或{' '}
            <Link
              component="button"
              variant="body2"
              onClick={() => redirect('/ai-models')}
              sx={{ textDecoration: 'underline', cursor: 'pointer' }}
            >
              查看模型列表
            </Link>
          </Alert>
        </Box>
      );
    }

    return (
      <Box>
        <Typography variant="body2" sx={{ mb: 1 }}>{label}</Typography>
        {helperText && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            {helperText}
          </Typography>
        )}
        {fieldName === 'supportedModels' && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            可拖拽排序，顺序将影响 Web 端套餐页的模型展示顺序
          </Typography>
        )}
        <Button
          variant="outlined"
          onClick={handleOpen}
          disabled={isLoading || models.length === 0}
          fullWidth
          sx={{ mb: 1 }}
        >
          {isLoading ? '加载中...' : `选择模型 (已选 ${selectedModels.length} 个)`}
        </Button>
        {selectedModels.length > 0 && (
          <SortableModelChips
            selectedModels={selectedModels}
            models={models}
            onReorder={(newOrder) => setValue(source, newOrder, { shouldDirty: true })}
            onDelete={handleToggleModel}
            sortable={fieldName === 'supportedModels'}
          />
        )}

        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>
            {label}
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button size="small" onClick={handleSelectAll}>
                全选
              </Button>
              <Button size="small" onClick={handleClearAll}>
                清空
              </Button>
            </Box>
          </DialogTitle>
          <DialogContent>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {models.map((model: any) => {
                  const modelId = model.id;
                  if (!modelId) {
                    console.warn('[CustomModelSelector] 模型缺少 id 字段:', model);
                    return null;
                  }
                  const isSelected = Array.isArray(selectedModels) && selectedModels.includes(modelId);
                  return (
                    <ListItem key={modelId} disablePadding>
                      <ListItemButton onClick={() => handleToggleModel(modelId)}>
                        <ListItemIcon>
                          <Checkbox checked={isSelected} />
                        </ListItemIcon>
                        <ListItemText
                          primary={model.displayName || model.name}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                模型ID: {modelId}
                              </Typography>
                              {model.provider && (
                                <Typography variant="caption" display="block">
                                  提供商: {model.provider}
                                </Typography>
                              )}
                              {model.status && (
                                <Typography variant="caption" display="block" color={model.status === 'active' ? 'success.main' : 'text.secondary'}>
                                  状态: {model.status === 'active' ? '活跃' : '未激活'}
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

  // 模型选择器组件（保留用于兼容）
  const ModelSelector = ({ getSource, fieldName, label, helperText }: { 
    getSource?: (source: string) => string;
    fieldName: string;
    label: string;
    helperText?: string;
  }) => {
    const { watch, setValue } = useFormContext();
    const notify = useNotify();
    const redirect = useRedirect();
    const source = getSource?.(fieldName) || fieldName;
    const selectedModels = watch(source) || [];
    const [open, setOpen] = useState(false);
    
    // 获取AI模型列表
    const { data: modelsData, isLoading, error } = useGetList('ai-models', {
      pagination: { page: 1, perPage: 1000 },
      sort: { field: 'name', order: 'ASC' },
      // 暂时不过滤状态，显示所有模型，让用户可以选择
    });

    // useGetList 返回的 data 本身就是数组，不是 { data: [...] }
    const models = Array.isArray(modelsData) ? modelsData : (modelsData?.data || []);
    
    // 调试日志
    useEffect(() => {
      console.log('[ModelSelector] 模型数据调试:', {
        modelsData,
        isArray: Array.isArray(modelsData),
        models,
        count: models.length,
        isLoading,
        error,
        firstModel: models[0],
      });
    }, [modelsData, models, isLoading, error]);

    const handleOpen = () => {
      if (models.length === 0) {
        notify('没有可用的AI模型，请先配置模型', { type: 'warning' });
        return;
      }
      setOpen(true);
    };

    const handleClose = () => {
      setOpen(false);
    };

    const handleToggleModel = (modelId: string) => {
      const current = Array.isArray(selectedModels) ? [...selectedModels] : [];
      const index = current.indexOf(modelId);
      if (index > -1) {
        current.splice(index, 1);
      } else {
        current.push(modelId);
      }
      setValue(source, current, { shouldDirty: true });
    };

    const handleSelectAll = () => {
      const allModelIds = models.map((model: any) => model.id).filter(Boolean);
      setValue(source, allModelIds, { shouldDirty: true });
    };

    const handleClearAll = () => {
      setValue(source, [], { shouldDirty: true });
    };

    if (error) {
      return (
        <Box>
          <Typography variant="body2" color="error">
            加载模型列表失败
          </Typography>
        </Box>
      );
    }

    if (!isLoading && models.length === 0) {
      return (
        <Box>
          <Typography variant="body2" sx={{ mb: 1 }}>{label}</Typography>
          <Alert severity="info" sx={{ mb: 1 }}>
            还没有配置AI模型。请先{' '}
            <Link
              component="button"
              variant="body2"
              onClick={() => redirect('/ai-models/create')}
              sx={{ textDecoration: 'underline', cursor: 'pointer' }}
            >
              创建AI模型
            </Link>
            {' '}或{' '}
            <Link
              component="button"
              variant="body2"
              onClick={() => redirect('/ai-models')}
              sx={{ textDecoration: 'underline', cursor: 'pointer' }}
            >
              查看模型列表
            </Link>
          </Alert>
        </Box>
      );
    }

    return (
      <Box>
        <Typography variant="body2" sx={{ mb: 1 }}>{label}</Typography>
        {helperText && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
            {helperText}
          </Typography>
        )}
        {fieldName === 'supportedModels' && (
          <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
            可拖拽排序，顺序将影响 Web 端套餐页的模型展示顺序
          </Typography>
        )}
        <Button
          variant="outlined"
          onClick={handleOpen}
          disabled={isLoading || models.length === 0}
          fullWidth
          sx={{ mb: 1 }}
        >
          {isLoading ? '加载中...' : `选择模型 (已选 ${selectedModels.length} 个)`}
        </Button>
        {selectedModels.length > 0 && (
          <SortableModelChips
            selectedModels={selectedModels}
            models={models}
            onReorder={(newOrder) => setValue(source, newOrder, { shouldDirty: true })}
            onDelete={handleToggleModel}
            sortable={fieldName === 'supportedModels'}
          />
        )}

        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>
            {label}
            <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
              <Button size="small" onClick={handleSelectAll}>
                全选
              </Button>
              <Button size="small" onClick={handleClearAll}>
                清空
              </Button>
            </Box>
          </DialogTitle>
          <DialogContent>
            {isLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : (
              <List>
                {models.map((model: any) => {
                  const modelId = model.id;
                  if (!modelId) {
                    console.warn('[ModelSelector] 模型缺少 id 字段:', model);
                    return null;
                  }
                  const isSelected = Array.isArray(selectedModels) && selectedModels.includes(modelId);
                  return (
                    <ListItem key={modelId} disablePadding>
                      <ListItemButton onClick={() => handleToggleModel(modelId)}>
                        <ListItemIcon>
                          <Checkbox checked={isSelected} />
                        </ListItemIcon>
                        <ListItemText
                          primary={model.displayName || model.name}
                          secondary={
                            <Box>
                              <Typography variant="caption" display="block">
                                模型ID: {modelId}
                              </Typography>
                              {model.provider && (
                                <Typography variant="caption" display="block">
                                  提供商: {model.provider}
                                </Typography>
                              )}
                              {model.status && (
                                <Typography variant="caption" display="block" color={model.status === 'active' ? 'success.main' : 'text.secondary'}>
                                  状态: {model.status === 'active' ? '活跃' : '未激活'}
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

  // 内部组件：价格项字段（使用直接路径）
  const PricingItemFields = ({ index }: { index: number }) => {
    const prefix = `pricing.${index}`;
    
    return (
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={6}>
          <TextInput source={`${prefix}.type`} label="套餐类型" required fullWidth helperText="如：Pro, Max, Ultra" />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextInput
            source={`${prefix}.iosProductId`}
            label="iOS 商品ID"
            fullWidth
            helperText="如：hahachat.ai.app.monthly_pro / hahachat.ai.app.monthly_max / hahachat.ai.app.monthly_ultra"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <NumberInput source={`${prefix}.price`} label="价格" required fullWidth />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextInput source={`${prefix}.currency`} label="货币" fullWidth />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextInput source={`${prefix}.displayPrice`} label="显示价格" fullWidth helperText="如：$2.9/月" />
        </Grid>
        <Grid item xs={12} md={6}>
          <NumberInput source={`${prefix}.originalPrice`} label="原价" fullWidth helperText="用于计算折扣" />
        </Grid>
        <Grid item xs={12} md={6}>
          <NumberInput 
            source={`${prefix}.savedAmount`} 
            label="节省金额" 
            fullWidth 
            helperText="手动填写节省的金额"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextInput source={`${prefix}.savedLabel`} label="节省标签" fullWidth helperText="如：已省$0.9" />
        </Grid>
        <Grid item xs={12} md={6}>
          <BooleanInput source={`${prefix}.autoRenew`} label="自动续费" />
        </Grid>
        <Grid item xs={12}>
          <TextInput source={`${prefix}.renewLabel`} label="续费说明" multiline fullWidth helperText="如：每月自动续费, 可以随时取消" />
        </Grid>
        <Grid item xs={12}>
          <CustomPricingIconUpload prefix={prefix} />
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>权益配置</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <NumberInput source={`${prefix}.benefits.monthlyCredits`} label="每月积分" fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextInput source={`${prefix}.benefits.creditsLabel`} label="积分标签" fullWidth helperText="如：每月10,000个通用积分" />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextInput source={`${prefix}.benefits.creditsDescription`} label="积分说明" multiline fullWidth />
            </Grid>
          </Grid>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>优势列表</Typography>
          <ArrayInput source={`${prefix}.advantages`} label="优势项">
            <SimpleFormIterator>
              <TextInput source="title" label="标题" fullWidth />
              <TextInput source="description" label="描述" multiline fullWidth />
              <TextInput source="icon" label="图标类型" fullWidth helperText="如：credit_card, star" />
            </SimpleFormIterator>
          </ArrayInput>
        </Grid>
        <Grid item xs={12} md={6}>
          <CustomModelSelector
            prefix={prefix}
            fieldName="supportedModels"
            label="支持的模型"
            helperText="选择此价格配置支持的AI模型"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <CustomModelSelector
            prefix={prefix}
            fieldName="exclusiveModels"
            label="独享模型"
            helperText="选择此价格配置独享的AI模型"
          />
        </Grid>
      </Grid>
    );
  };



  // 自定义价格配置数组管理组件
  const CustomPricingArray = () => {
    const { control, watch } = useFormContext();
    const { fields, append, remove, replace } = useFieldArray({
      control,
      name: 'pricing',
    });
    const [hasInitialized, setHasInitialized] = useState(false);
    
    // 在数据加载后初始化数组
    useEffect(() => {
      if (displayRecord && displayRecord.pricing && Array.isArray(displayRecord.pricing) && displayRecord.pricing.length > 0 && !hasInitialized) {
        const currentPricing = watch('pricing');
        // 如果当前数组为空或长度不匹配，使用 replace 替换整个数组
        if (!currentPricing || !Array.isArray(currentPricing) || currentPricing.length === 0 || currentPricing.length !== displayRecord.pricing.length) {
          console.log('[CustomPricingArray] 使用 replace 设置 pricing 数组');
          replace(displayRecord.pricing);
          setHasInitialized(true);
        } else {
          // 检查每个项是否有数据
          const needsUpdate = displayRecord.pricing.some((item: any, index: number) => {
            const formItem = currentPricing[index];
            return !formItem || !formItem.type || !formItem.price;
          });
          if (needsUpdate) {
            console.log('[CustomPricingArray] pricing 项数据不完整，使用 replace 重新设置');
            replace(displayRecord.pricing);
            setHasInitialized(true);
          } else {
            setHasInitialized(true);
          }
        }
      }
    }, [displayRecord, fields.length, replace, watch, hasInitialized]);
    
    const handleAdd = () => {
      append({
        type: '',
        price: null,
        currency: 'USD',
        displayPrice: '',
        originalPrice: null,
        savedAmount: null,
        savedLabel: '',
        autoRenew: true,
        renewLabel: '',
        icon: null,
        benefits: {
          monthlyCredits: null,
          creditsLabel: '',
          creditsDescription: '',
        },
        advantages: [],
        supportedModels: [],
        exclusiveModels: [],
      });
    };
    
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">价格配置</Typography>
          <Button
            variant="outlined"
            onClick={handleAdd}
            startIcon={<span>+</span>}
          >
            添加价格配置
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          可以添加多个价格配置项，每个项代表一个套餐类型（如 Pro, Max, Ultra）
        </Typography>
        
        {fields.map((field, index) => (
          <Paper key={field.id} sx={{ p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1">价格配置项 {index + 1}</Typography>
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => remove(index)}
              >
                删除
              </Button>
            </Box>
            <PricingItemFields index={index} />
          </Paper>
        ))}
        
        {fields.length === 0 && (
          <Alert severity="info" sx={{ mb: 2 }}>
            暂无价格配置，请点击"添加价格配置"按钮添加
          </Alert>
        )}
      </Box>
    );
  };

  return (
    <Edit>
      <SimpleForm 
        onSubmit={handleSave}
        record={displayRecord}
      >
        {/* 基础信息 */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>基础信息</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextInput source="planId" disabled label="套餐ID" fullWidth />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextInput source="name" label="套餐名称" required fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <NumberInput source="duration" label="有效期（天）" required fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <SelectInput
                source="billingCycle"
                label="计费周期"
                required
                choices={[
                  { id: 'monthly', name: '连续包月' },
                  { id: 'annual', name: '连续包年' },
                  { id: 'onetime', name: '单次购买' },
                ]}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <NumberInput source="sortOrder" label="排序" fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <BooleanInput source="isPopular" label="最受欢迎" />
            </Grid>
            <Grid item xs={12} md={4}>
              <SelectInput
                source="status"
                label="状态"
                choices={[
                  { id: 'active', name: '活跃' },
                  { id: 'inactive', name: '未激活' },
                ]}
                fullWidth
              />
            </Grid>
          </Grid>
        </Paper>
        
        {/* 价格配置数组 */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <CustomPricingArray />
        </Paper>
      </SimpleForm>
    </Edit>
  );
};

// 自定义价格项图标上传组件（使用前缀路径）
const CustomPricingIconUpload = ({ prefix }: { prefix: string }) => {
  const notify = useNotify();
  const { setValue, watch } = useFormContext();
  const [uploading, setUploading] = useState(false);
  const iconSource = `${prefix}.icon`;
  const iconUrl = watch(iconSource) || '';

  const handleIconUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      notify('不支持的图片格式，仅支持 PNG、JPG、SVG', { type: 'error' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      notify('文件大小不能超过 2MB', { type: 'error' });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post('/upload', formData);
      const uploadedUrl = response.data?.data?.url;
      
      if (uploadedUrl && iconSource) {
        setValue(iconSource, uploadedUrl, { shouldDirty: true });
        notify('图标上传成功', { type: 'success' });
      }
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '上传失败';
      notify(errorMessage, { type: 'error' });
    } finally {
      setUploading(false);
      const fileInput = document.getElementById(`pricing-icon-upload-${iconSource}`) as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  }, [notify, iconSource, setValue]);

  return (
    <Box>
      <input
        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
        style={{ display: 'none' }}
        id={`pricing-icon-upload-${iconSource}`}
        type="file"
        onChange={handleIconUpload}
        disabled={uploading}
      />
      <label htmlFor={`pricing-icon-upload-${iconSource}`}>
        <Button variant="outlined" component="span" disabled={uploading} fullWidth>
          {uploading ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              上传中...
            </>
          ) : (
            '上传图标'
          )}
        </Button>
      </label>
      {iconUrl && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">已上传: {iconUrl}</Typography>
          <Box sx={{ mt: 1 }}>
            <img src={iconUrl} alt="图标预览" style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'contain' }} />
          </Box>
        </Box>
      )}
    </Box>
  );
};
