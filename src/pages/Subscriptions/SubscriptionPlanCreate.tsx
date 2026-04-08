import { 
  Create, 
  SimpleForm, 
  TextInput, 
  NumberInput, 
  SelectInput, 
  BooleanInput,
  ArrayInput,
  SimpleFormIterator,
  FormDataConsumer,
  useGetList,
  useRedirect,
  useDataProvider,
} from 'react-admin';
import { 
  Typography, 
  Box, 
  Grid, 
  Paper, 
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
  Alert,
  Link,
} from '@mui/material';
import { useState, useCallback, useEffect } from 'react';
import { useNotify } from 'react-admin';
import { useFormContext } from 'react-hook-form';
import apiClient from '../../services/api';
import { SortableModelChips } from '../../components/SortableModelChips';

export const SubscriptionPlanCreate = () => {
  const notify = useNotify();
  const dataProvider = useDataProvider();
  const redirect = useRedirect();


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
          if (item && typeof item === 'object' && !Array.isArray(item) && item !== null) {
            try {
              const cleaned: any = {};
              Object.keys(item).forEach(key => {
                if (item[key] !== undefined) {
                  cleaned[key] = item[key] === '' ? null : item[key];
                }
              });
              return cleaned;
            } catch (e) {
              console.error('[SubscriptionPlanCreate] cleanArrayField 清理项时出错:', e, item);
              return item; // 如果出错，返回原始项
            }
          }
          // 如果是字符串，过滤空字符串
          return item === '' ? null : item;
        })
        .filter(item => {
          // 对于对象，至少有一个非空字段才保留
          if (item && typeof item === 'object' && !Array.isArray(item) && item !== null) {
            try {
              return Object.values(item).some(val => val !== null && val !== '');
            } catch (e) {
              console.error('[SubscriptionPlanCreate] cleanArrayField 过滤项时出错:', e, item);
              return false; // 如果出错，过滤掉该项
            }
          }
          return item !== null;
        });
    }
    return [];
  };

  // 清理 pricing 项中的数字字段
  const cleanPricingItem = (item: any): any => {
    if (!item || typeof item !== 'object' || item === null || Array.isArray(item)) {
      return item;
    }
    
    // 确保 item 是对象，避免展开 null 或 undefined
    // 再次检查 item 是否为有效对象（防止在检查后 item 变成 null）
    let cleaned: any;
    try {
      cleaned = { ...item };
    } catch (e) {
      console.error('[SubscriptionPlanCreate] cleanPricingItem 展开对象时出错:', e, item);
      // 如果展开失败，返回一个空对象而不是原始对象
      return {};
    }
    
    // 清理数字字段
    if ('price' in cleaned) cleaned.price = cleanNumericField(cleaned.price);
    if ('originalPrice' in cleaned) cleaned.originalPrice = cleanNumericField(cleaned.originalPrice);
    if ('savedAmount' in cleaned) cleaned.savedAmount = cleanNumericField(cleaned.savedAmount);
    
    // 清理嵌套的 benefits 对象
    if (cleaned.benefits !== undefined && cleaned.benefits !== null) {
      if (typeof cleaned.benefits === 'object' && !Array.isArray(cleaned.benefits) && cleaned.benefits !== null) {
        try {
          cleaned.benefits = {
            ...cleaned.benefits,
            monthlyCredits: cleanNumericField(cleaned.benefits.monthlyCredits),
            creditsLabel: cleaned.benefits.creditsLabel || null,
            creditsDescription: cleaned.benefits.creditsDescription || null,
          };
        } catch (e) {
          console.error('[SubscriptionPlanCreate] 清理 benefits 时出错:', e, cleaned.benefits);
          cleaned.benefits = {
            monthlyCredits: null,
            creditsLabel: null,
            creditsDescription: null,
          };
        }
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
      // 清理 advantages 数组中的每个项，确保 icon 字段如果为空字符串则转为 null
      if (Array.isArray(cleaned.advantages)) {
        cleaned.advantages = cleaned.advantages.map((adv: any) => {
          if (adv && typeof adv === 'object' && !Array.isArray(adv) && adv !== null) {
            try {
              return {
                ...adv,
                icon: adv.icon === '' ? null : (adv.icon || null),
              };
            } catch (e) {
              console.error('[SubscriptionPlanCreate] 清理 advantage 项时出错:', e, adv);
              return adv; // 如果出错，返回原始项
            }
          }
          return adv;
        });
      }
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

  // 表单提交前的验证和ID生成
  const handleSubmit = async (data: Record<string, unknown>) => {
    console.log('[SubscriptionPlanCreate] handleSubmit 被调用，原始数据:', JSON.stringify(data, null, 2));
    
    try {
    
    // 修复数据结构：如果顶层有 pricing 相关字段，将它们移动到 pricing 数组中
    // React Admin 的 ArrayInput 有时会将数据扁平化
    const pricingFields = ['type', 'price', 'currency', 'displayPrice', 'originalPrice', 'savedAmount', 
                          'savedLabel', 'autoRenew', 'renewLabel', 'icon', 'benefits', 'advantages', 
                          'supportedModels', 'exclusiveModels', 'iosProductId'];
    
    // 检查顶层是否有 pricing 相关字段
    const hasTopLevelPricingFields = pricingFields.some(field => data[field] !== undefined);
    
    if (hasTopLevelPricingFields) {
      console.log('[SubscriptionPlanCreate] 检测到顶层 pricing 字段，正在修复数据结构...');
      
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
        // 确保 firstItem 和 pricingItem 都是有效对象
        if (firstItem && typeof firstItem === 'object' && firstItem !== null && !Array.isArray(firstItem)) {
          try {
            data.pricing = [{ ...firstItem, ...pricingItem }, ...pricingArray.slice(1)];
          } catch (e) {
            console.error('[SubscriptionPlanCreate] 合并 pricing 项时出错:', e, { firstItem, pricingItem });
            // 如果合并失败，直接替换第一个元素
            data.pricing = [pricingItem, ...pricingArray.slice(1)];
          }
        } else {
          // 如果第一个元素无效，直接替换
          data.pricing = [pricingItem, ...pricingArray.slice(1)];
        }
      }
      
      console.log('[SubscriptionPlanCreate] 修复后的数据结构:', JSON.stringify(data, null, 2));
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
    
    // 验证必填字段
    if (!data.name || (typeof data.name === 'string' && data.name.trim() === '')) {
      notify('请填写套餐名称', { type: 'error' });
      throw new Error('套餐名称是必填项');
    }

    if (data.duration === undefined || data.duration === null || data.duration === '' || 
        (typeof data.duration === 'number' && data.duration <= 0)) {
      notify('请填写有效期（天数）', { type: 'error' });
      throw new Error('有效期是必填项');
    }

    if (!data.billingCycle || (typeof data.billingCycle === 'string' && data.billingCycle.trim() === '')) {
      notify('请选择计费周期', { type: 'error' });
      throw new Error('计费周期是必填项');
    }

    // 验证 pricing 数组不为空
    if (!data.pricing || !Array.isArray(data.pricing) || data.pricing.length === 0) {
      notify('请至少添加一个价格配置项', { type: 'error' });
      throw new Error('至少需要一个价格配置项');
    }

    // 验证每个 pricing 项的必填字段
    if (Array.isArray(data.pricing)) {
      console.log('[SubscriptionPlanCreate] 验证 pricing 数组:', {
        pricing: data.pricing,
        length: data.pricing.length,
      });
      
      for (let i = 0; i < data.pricing.length; i++) {
        const item = data.pricing[i];
        console.log(`[SubscriptionPlanCreate] 验证价格配置项 ${i + 1}:`, {
          item,
          isObject: typeof item === 'object',
          hasType: !!item?.type,
          typeValue: item?.type,
          hasPrice: item?.price !== undefined && item?.price !== null,
          priceValue: item?.price,
        });
        
        // 检查 item 是否为有效对象（排除 null，因为 typeof null === 'object'）
        if (!item || typeof item !== 'object' || item === null || Array.isArray(item)) {
          console.error(`[SubscriptionPlanCreate] 价格配置项 ${i + 1} 不是有效对象:`, item);
          notify(`价格配置项 ${i + 1} 无效`, { type: 'error' });
          throw new Error(`价格配置项 ${i + 1} 无效`);
        }
        
        // 检查 type 字段
        const typeValue = item.type;
        if (!typeValue || (typeof typeValue === 'string' && typeValue.trim() === '')) {
          console.error(`[SubscriptionPlanCreate] 价格配置项 ${i + 1} 缺少套餐类型:`, item);
          notify(`价格配置项 ${i + 1} 的套餐类型是必填项`, { type: 'error' });
          throw new Error(`价格配置项 ${i + 1} 的套餐类型是必填项`);
        }
        
        // 检查 price 字段
        const priceValue = item.price;
        if (priceValue === undefined || priceValue === null || priceValue === '') {
          console.error(`[SubscriptionPlanCreate] 价格配置项 ${i + 1} 缺少价格:`, item);
          notify(`价格配置项 ${i + 1} 的价格是必填项`, { type: 'error' });
          throw new Error(`价格配置项 ${i + 1} 的价格是必填项`);
        }
        
        // 检查 price 是否为有效数字
        const priceNum = Number(priceValue);
        if (isNaN(priceNum) || priceNum <= 0) {
          console.error(`[SubscriptionPlanCreate] 价格配置项 ${i + 1} 的价格无效:`, priceValue);
          notify(`价格配置项 ${i + 1} 的价格必须是大于0的数字`, { type: 'error' });
          throw new Error(`价格配置项 ${i + 1} 的价格必须是大于0的数字`);
        }
      }
    }

    // 不生成 id 或 planId，由后端自动生成
    // 移除前端生成的 id 和 planId 字段，让后端自动生成
    if ('id' in data) {
      delete data.id;
    }
    if ('planId' in data) {
      delete data.planId;
    }

    // 清理顶层数字字段
    if ('duration' in data) data.duration = cleanNumericField(data.duration);
    if ('sortOrder' in data) data.sortOrder = cleanNumericField(data.sortOrder) ?? 0;

    // 为每个 pricing 项清理数字字段，但不生成 id（由后端自动生成）
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

    // 最终清理：确保所有嵌套对象都是有效的
    // 递归清理所有对象，确保没有 null 或 undefined 的对象被展开
    const deepClean = (obj: any): any => {
      // 处理 null 和 undefined
      if (obj === null || obj === undefined) {
        return null;
      }
      
      // 处理数组
      if (Array.isArray(obj)) {
        return obj
          .map(item => deepClean(item))
          .filter(item => item !== null && item !== undefined);
      }
      
      // 处理对象（确保不是 null，因为 typeof null === 'object'）
      if (typeof obj === 'object' && obj !== null && !Array.isArray(obj)) {
        try {
          // 再次检查 obj 是否为有效对象
          if (obj === null || obj === undefined) {
            return null;
          }
          
          const cleaned: any = {};
          // 使用 Object.keys 前确保 obj 不是 null
          const keys = Object.keys(obj);
          keys.forEach(key => {
            try {
              const value = deepClean(obj[key]);
              // 只添加非 undefined 的值
              if (value !== undefined) {
                cleaned[key] = value;
              }
            } catch (e) {
              console.error(`[SubscriptionPlanCreate] deepClean 处理字段 ${key} 时出错:`, e, obj[key]);
              // 如果处理某个字段出错，跳过该字段
            }
          });
          return cleaned;
        } catch (e) {
          console.error('[SubscriptionPlanCreate] deepClean 清理对象时出错:', e, obj);
          // 如果出错，返回空对象而不是原始对象，避免后续错误
          return {};
        }
      }
      
      // 其他类型（字符串、数字、布尔值等）直接返回
      return obj;
    };
    
    const finalData = deepClean(data);
    
    // 最终检查：确保返回的数据中没有会导致 Object.entries 失败的 null/undefined 对象
    // React Admin 的 setErrorFromObject 会使用 Object.entries，如果遇到 null 会报错
    const sanitizeForReactAdmin = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return null;
      }
      if (Array.isArray(obj)) {
        return obj.map(item => sanitizeForReactAdmin(item));
      }
      if (typeof obj === 'object') {
        const sanitized: any = {};
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            const value = obj[key];
            // 如果值是 null 或 undefined，跳过或设置为 null
            if (value === undefined) {
              continue; // 跳过 undefined 字段
            }
            sanitized[key] = sanitizeForReactAdmin(value);
          }
        }
        return sanitized;
      }
      return obj;
    };
    
    const sanitizedData = sanitizeForReactAdmin(finalData);
    
    console.log('[SubscriptionPlanCreate] handleSubmit 清理后的数据:', JSON.stringify(sanitizedData, null, 2));
    
    // 调用 dataProvider.create 来创建资源，而不是直接返回数据
    // React Admin 的 SimpleForm 期望 onSubmit 要么返回数据（会被传递给 dataProvider），要么调用 dataProvider 并处理结果
    // 但直接返回数据可能会导致 React Admin 错误地将数据当作错误
    try {
      const result = await dataProvider.create('subscription-plans', {
        data: sanitizedData,
      });
      console.log('[SubscriptionPlanCreate] 创建成功:', result);
      notify('套餐创建成功', { type: 'success' });
      redirect('list', 'subscription-plans');
      return result.data;
    } catch (error: any) {
      console.error('[SubscriptionPlanCreate] 创建失败:', error);
      const errorMessage = error?.body?.message || error?.message || '创建失败';
      notify(errorMessage, { type: 'error' });
      // 重新抛出错误，让 React Admin 知道创建失败
      throw error;
    }
    } catch (error: unknown) {
      // 如果已经有 notify，就不需要再次显示
      // 但确保错误被正确抛出，让 React Admin 知道验证失败
      const errorMessage = error instanceof Error ? error.message : '表单验证失败';
      console.error('[SubscriptionPlanCreate] 验证错误:', errorMessage, error);
      // 重新抛出错误，让 React Admin 知道验证失败
      throw error;
    }
  };

  // 模型选择器组件
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

  // 内部组件：价格项字段（在 SimpleFormIterator 内部使用）
  const PricingItemFields = () => {
    return (
      <FormDataConsumer>
        {({ getSource, scopedFormData }) => {

          return (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <TextInput 
                  source={getSource?.('type') || ''} 
                  label="套餐类型" 
                  required 
                  fullWidth 
                  helperText="如：Pro, Max, Ultra"
                  defaultValue="Pro"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextInput
                  source={getSource?.('iosProductId') || ''}
                  label="iOS 商品ID"
                  fullWidth
                  helperText="如：hahachat.ai.app.monthly_pro / hahachat.ai.app.monthly_max / hahachat.ai.app.monthly_ultra"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <NumberInput 
                  source={getSource?.('price') || ''} 
                  label="价格" 
                  required 
                  fullWidth 
                  defaultValue={9.9}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextInput source={getSource?.('currency') || ''} label="货币" defaultValue="USD" fullWidth />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextInput source={getSource?.('displayPrice') || ''} label="显示价格" fullWidth helperText="如：$2.9/月" defaultValue="$9.9/月" />
              </Grid>
              <Grid item xs={12} md={6}>
                <NumberInput source={getSource?.('originalPrice') || ''} label="原价" fullWidth helperText="用于计算折扣" defaultValue={19.9} />
              </Grid>
              <Grid item xs={12} md={6}>
                <NumberInput 
                  source={getSource?.('savedAmount') || ''} 
                  label="节省金额" 
                  fullWidth 
                  helperText="手动填写节省的金额"
                  defaultValue={10}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextInput source={getSource?.('savedLabel') || ''} label="节省标签" fullWidth helperText="如：已省$0.9" defaultValue="已省$10" />
              </Grid>
              <Grid item xs={12} md={6}>
                <BooleanInput source={getSource?.('autoRenew') || ''} label="自动续费" defaultValue={true} />
              </Grid>
              <Grid item xs={12}>
                <TextInput source={getSource?.('renewLabel') || ''} label="续费说明" multiline fullWidth helperText="如：每月自动续费, 可以随时取消" defaultValue="每月自动续费, 可以随时取消" />
              </Grid>
              <Grid item xs={12}>
                <PricingIconUpload getSource={getSource} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>权益配置</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <NumberInput source={getSource?.('benefits.monthlyCredits') || ''} label="每月积分" fullWidth defaultValue={10000} />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextInput source={getSource?.('benefits.creditsLabel') || ''} label="积分标签" fullWidth helperText="如：每月10,000个通用积分" defaultValue="每月10,000个通用积分" />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextInput source={getSource?.('benefits.creditsDescription') || ''} label="积分说明" multiline fullWidth defaultValue="积分适用于全部模型(高速稳定通道模型除外)" />
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>优势列表（可选）</Typography>
                <ArrayInput source={getSource?.('advantages') || ''} label="优势项">
                  <SimpleFormIterator>
                    <TextInput source="title" label="标题" fullWidth />
                    <TextInput source="description" label="描述" multiline fullWidth />
                    <TextInput source="icon" label="图标类型" fullWidth helperText="如：credit_card, star" />
                  </SimpleFormIterator>
                </ArrayInput>
              </Grid>
              <Grid item xs={12} md={6}>
                <ModelSelector
                  getSource={getSource}
                  fieldName="supportedModels"
                  label="支持的模型"
                  helperText="选择此价格配置支持的AI模型"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <ModelSelector
                  getSource={getSource}
                  fieldName="exclusiveModels"
                  label="独享模型"
                  helperText="选择此价格配置独享的AI模型"
                />
              </Grid>
            </Grid>
          );
        }}
      </FormDataConsumer>
    );
  };


  // 表单验证状态监听（用于调试）
  const FormDebugger = () => {
    const { formState } = useFormContext();
    
    useEffect(() => {
      if (formState.isSubmitted && !formState.isValid) {
        // 只检查是否有真正的错误对象（有 message 属性）
        const hasRealErrors = (errors: any): boolean => {
          if (!errors || typeof errors !== 'object') return false;
          for (const key in errors) {
            if (Object.prototype.hasOwnProperty.call(errors, key)) {
              const error = errors[key];
              // 检查是否是错误对象（有 message 属性）
              if (error && typeof error === 'object' && !Array.isArray(error) && error !== null && error.message) {
                return true;
              }
              // 递归检查嵌套对象
              if (error && typeof error === 'object' && !Array.isArray(error) && error !== null) {
                if (hasRealErrors(error)) {
                  return true;
                }
              }
            }
          }
          return false;
        };
        
        const hasErrors = hasRealErrors(formState.errors);
        
        if (!hasErrors) {
          console.warn('[SubscriptionPlanCreate] 表单显示无效但没有发现真正的验证错误');
          console.log('[SubscriptionPlanCreate] errors 对象内容:', JSON.stringify(formState.errors, null, 2));
          console.log('[SubscriptionPlanCreate] 这可能是 React Admin 的误报，如果所有字段都已正确填写，可以尝试保存');
        } else {
          console.log('[SubscriptionPlanCreate] 发现真正的验证错误:', formState.errors);
          // 详细输出每个错误对象的内容
          const errorDetails: string[] = [];
          const extractErrorMessages = (errors: any, prefix = '') => {
            if (!errors || typeof errors !== 'object') return;
            Object.keys(errors).forEach(key => {
              const error = errors[key];
              const fieldPath = prefix ? `${prefix}.${key}` : key;
              if (error && typeof error === 'object' && !Array.isArray(error) && error !== null) {
                if (error.message) {
                  errorDetails.push(`${fieldPath}: ${error.message} (type: ${error.type || 'unknown'})`);
                } else {
                  extractErrorMessages(error, fieldPath);
                }
              }
            });
          };
          extractErrorMessages(formState.errors);
          if (errorDetails.length > 0) {
            console.error('[SubscriptionPlanCreate] 验证错误详情:', errorDetails);
            // 即使有错误详情，也输出完整的错误对象结构以便调试
            console.log('[SubscriptionPlanCreate] 完整错误对象结构:', formState.errors);
            // 输出每个字段的错误对象完整内容
            Object.keys(formState.errors).forEach(key => {
              const error = formState.errors[key];
              console.log(`[SubscriptionPlanCreate] ${key} 错误对象:`, error);
              console.log(`[SubscriptionPlanCreate] ${key} 错误对象类型:`, typeof error);
              console.log(`[SubscriptionPlanCreate] ${key} 错误对象内容:`, JSON.stringify(error, null, 2));
              if (error && typeof error === 'object' && !Array.isArray(error) && error !== null) {
                console.log(`[SubscriptionPlanCreate] ${key} 错误对象属性:`, Object.keys(error));
                console.log(`[SubscriptionPlanCreate] ${key} 错误对象 message:`, error.message);
                console.log(`[SubscriptionPlanCreate] ${key} 错误对象 type:`, error.type);
                console.log(`[SubscriptionPlanCreate] ${key} 错误对象所有属性值:`, Object.entries(error));
              }
            });
          } else {
            console.log('[SubscriptionPlanCreate] 错误对象结构:', formState.errors);
            // 输出每个字段的错误对象完整内容
            Object.keys(formState.errors).forEach(key => {
              const error = formState.errors[key];
              console.log(`[SubscriptionPlanCreate] ${key} 错误对象:`, error);
              console.log(`[SubscriptionPlanCreate] ${key} 错误对象类型:`, typeof error);
              console.log(`[SubscriptionPlanCreate] ${key} 错误对象内容:`, JSON.stringify(error, null, 2));
              if (error && typeof error === 'object' && !Array.isArray(error) && error !== null) {
                console.log(`[SubscriptionPlanCreate] ${key} 错误对象属性:`, Object.keys(error));
                console.log(`[SubscriptionPlanCreate] ${key} 错误对象 message:`, error.message);
                console.log(`[SubscriptionPlanCreate] ${key} 错误对象 type:`, error.type);
              }
            });
          }
        }
      }
    }, [formState.isSubmitted, formState.isValid, formState.errors]);
    
    return null;
  };

  return (
    <Create>
      <SimpleForm 
        onSubmit={handleSubmit}
        mode="onSubmit"
        noValidate
      >
        <FormDebugger />
        {/* 基础信息 */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>基础信息</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextInput source="name" label="套餐名称" required fullWidth helperText="如：连续包年" defaultValue="测试套餐" />
            </Grid>
            <Grid item xs={12} md={4}>
              <NumberInput 
                source="duration" 
                label="有效期（天）" 
                required 
                fullWidth 
                helperText="如：365"
                defaultValue={30}
              />
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
                defaultValue="monthly"
                fullWidth
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <NumberInput source="sortOrder" label="排序" defaultValue={0} fullWidth />
            </Grid>
            <Grid item xs={12} md={4}>
              <BooleanInput source="isPopular" label="最受欢迎" defaultValue={false} />
            </Grid>
            <Grid item xs={12} md={4}>
              <SelectInput
                source="status"
                label="状态"
                choices={[
                  { id: 'active', name: '活跃' },
                  { id: 'inactive', name: '未激活' },
                ]}
                defaultValue="active"
                fullWidth
              />
            </Grid>
          </Grid>
        </Paper>
        
        {/* 价格配置数组 */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>价格配置</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            可以添加多个价格配置项，每个项代表一个套餐类型（如 Pro, Max, Ultra）
          </Typography>
          <ArrayInput source="pricing" label="价格项">
            <SimpleFormIterator>
              <PricingItemFields />
            </SimpleFormIterator>
          </ArrayInput>
        </Paper>
      </SimpleForm>
    </Create>
  );
};

// 价格项图标上传组件
const PricingIconUpload = ({ getSource }: { getSource?: (source: string) => string }) => {
  const notify = useNotify();
  const { setValue, watch } = useFormContext();
  const [uploading, setUploading] = useState(false);
  const iconSource = getSource?.('icon') || '';
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
