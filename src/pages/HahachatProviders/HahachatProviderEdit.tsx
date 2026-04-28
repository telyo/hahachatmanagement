import { Edit, SimpleForm, TextInput, SelectInput, NumberInput, ArrayInput, SimpleFormIterator, PasswordInput, BooleanInput, useNotify, useRedirect, useRecordContext, useGetOne, useDataProvider, TabbedForm, Tab, Button, useGetList } from 'react-admin';
import { useParams } from 'react-router-dom';
import { Box, Card, CardContent, Typography, CircularProgress, Alert } from '@mui/material';
import { PlayArrow as PlayIcon } from '@mui/icons-material';
import apiClient from '../../services/api';
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';


const HahachatProviderEdit = () => {
  const notify = useNotify();
  const redirect = useRedirect();
  const record = useRecordContext();
  const { id } = useParams();
  const dataProvider = useDataProvider();
  
  // 使用 ref 来跟踪组件渲染次数和挂载
  const renderCountRef = useRef(0);
  const mountIdRef = useRef(Math.random().toString(36).substring(7));
  renderCountRef.current += 1;
  
  const providerId = useMemo(() => {
    return (record?.id || record?.providerId || id) as string;
  }, [record?.id, record?.providerId, id]);
  
  // 在组件挂载时记录
  useEffect(() => {
    const mountId = mountIdRef.current;
    console.log('[HahachatProviderEdit] 组件挂载, mountId:', mountId, 'providerId:', providerId);
    return () => {
      console.log('[HahachatProviderEdit] 组件卸载, mountId:', mountId, 'providerId:', providerId);
    };
  }, [providerId]);
  
  // 如果 useRecordContext 没有数据（例如直接访问编辑页面），使用 useGetOne 获取
  // 使用 enabled 条件确保只在 record 不存在时才调用，避免重复渲染
  const { data: fetchedRecord, isLoading } = useGetOne(
    'hahachat-providers',
    { id: providerId },
    { enabled: !!providerId && !record }
  );

  // 使用 fetchedRecord 或 record（优先使用 record，因为 Edit 组件会自动提供）
  // 使用 useMemo 确保 displayRecord 的稳定性，避免不必要的重新渲染
  const displayRecord = useMemo(() => {
    return record || fetchedRecord;
  }, [record, fetchedRecord]);

  const [hasOtherHahachat, setHasOtherHahachat] = useState(false);

  // 检查是否有其他 Hahachat 提供商 - 使用 useMemo 缓存查询参数
  const listQueryParams = useMemo(() => ({
    pagination: { page: 1, perPage: 1000 },
    sort: { field: 'sortOrder' as const, order: 'ASC' as const },
  }), []);
  
  const { data: providersData } = useGetList('hahachat-providers', listQueryParams);

  // 检查是否有其他 Hahachat 提供商
  useEffect(() => {
    if (!providersData || !providerId) return;
    // useGetList 返回的 data 可能是一个对象，需要检查
    const providers = Array.isArray(providersData) 
      ? providersData 
      : (providersData as { data?: { items?: unknown[] }; items?: unknown[] })?.data?.items || 
        (providersData as { items?: unknown[] })?.items || 
        [];
    const otherHahachat = providers.some(
      (p: { isHahachat?: boolean; providerId?: string; id?: string }) => 
        p.isHahachat === true && (p.providerId || p.id) !== providerId
    );
    setHasOtherHahachat(otherHahachat);
  }, [providersData, providerId]);

  // 判断是否显示 isHahachat 开关
  const canShowIsHahachatSwitch = !hasOtherHahachat;
  
  // 移除重复的 MuiCardContent-root（在 TabbedForm 中重复显示的内容）
  useEffect(() => {
    if (!displayRecord) return;
    
    const timeoutId = setTimeout(() => {
      try {
        // 查找所有的 TabbedForm 容器
        const tabbedForms = document.querySelectorAll('[class*="tabbed-form"], [class*="RaTabbedForm"]');
        
        if (tabbedForms.length > 0) {
          // 对于每个 TabbedForm，查找其中的 MuiCardContent
          tabbedForms.forEach((tabbedForm) => {
            const cardContents = tabbedForm.querySelectorAll('[class*="MuiCardContent-root"]');
            const tabsRoot = tabbedForm.querySelector('[class*="MuiTabs-root"]');
            const divider = tabbedForm.querySelector('[class*="MuiDivider-root"]');
            const toolbar = tabbedForm.querySelector('[class*="RaToolbar"]');
            
            console.log('[HahachatProviderEdit] TabbedForm 结构:', {
              cardContentsCount: cardContents.length,
              hasTabsRoot: !!tabsRoot,
              hasDivider: !!divider,
              hasToolbar: !!toolbar,
            });
            
            // 如果 MuiTabs-root 存在，说明内容已经在标签页中
            // 移除在 MuiDivider 之后的重复 MuiCardContent（这些是重复的内容）
            if (tabsRoot && divider) {
              // 找到 divider 之后的所有 MuiCardContent
              let nextSibling = divider.nextElementSibling;
              while (nextSibling) {
                const isCardContent = nextSibling.classList.contains('MuiCardContent-root') || 
                                     Array.from(nextSibling.classList).some(cls => cls.includes('MuiCardContent'));
                
                // 如果下一个是 Toolbar，停止
                const isToolbar = nextSibling.classList.contains('RaToolbar') ||
                                 Array.from(nextSibling.classList).some(cls => cls.includes('RaToolbar') || cls.includes('MuiToolbar'));
                
                if (isToolbar) {
                  break;
                }
                
                if (isCardContent && nextSibling !== tabsRoot) {
                  console.warn('[HahachatProviderEdit] 移除重复的 MuiCardContent');
                  nextSibling.remove();
                  break; // 只移除第一个重复的
                }
                
                nextSibling = nextSibling.nextElementSibling;
              }
            }
          });
        }
      } catch (error) {
        console.error('[HahachatProviderEdit] 移除重复内容时出错:', error);
      }
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [providerId, displayRecord]);

  const handleSave = useCallback(async (data: Record<string, unknown>) => {
    console.log('[HahachatProviderEdit] ===== handleSave 被调用 =====', data);
    
    try {
      const updateId = (data.providerId || providerId) as string;
      if (!updateId) {
        notify('提供商ID不存在', { type: 'error' });
        return;
      }

      // 清理数据
      const cleanData: any = { ...data };
      
      // 处理 supportedModels：ArrayInput 返回的是对象数组，需要转换为字符串数组
      if (cleanData.supportedModels && Array.isArray(cleanData.supportedModels)) {
        cleanData.supportedModels = cleanData.supportedModels
          .map((item: any) => {
            // 如果是对象，取第一个非空值；如果是字符串，直接使用
            if (typeof item === 'string') {
              return item;
            }
            if (typeof item === 'object' && item !== null) {
              // 取对象的第一个非空值
              const values = Object.values(item).filter((v: any) => v && v.trim && v.trim() !== '');
              return values.length > 0 ? String(values[0]) : null;
            }
            return null;
          })
          .filter((item: any) => item !== null && item !== '');
      } else {
        cleanData.supportedModels = [];
      }

      // 如果 secretKey 为空字符串，设置为 null 以便后端知道要清空
      if (cleanData.secretKey === '') {
        cleanData.secretKey = null;
      }

      // 如果 apiKey 为空字符串，不发送该字段（表示不更新）
      if (cleanData.apiKey === '') {
        delete cleanData.apiKey;
      } else if (cleanData.apiKey && typeof cleanData.apiKey === 'string') {
        // 如果 apiKey 看起来像加密后的值（很长且包含特殊字符），可能是用户没有修改
        // 这种情况下，如果值等于原始值，则不发送该字段
        const originalApiKey = displayRecord?.apiKey;
        if (originalApiKey && cleanData.apiKey === originalApiKey) {
          // 值没有变化，不发送该字段（表示不更新）
          delete cleanData.apiKey;
        }
      }

      // 如果 secretKey 为空字符串或 null，不发送该字段（表示不更新）
      if (cleanData.secretKey === '' || cleanData.secretKey === null) {
        delete cleanData.secretKey;
      } else if (cleanData.secretKey && typeof cleanData.secretKey === 'string') {
        // 如果 secretKey 看起来像加密后的值，可能是用户没有修改
        const originalSecretKey = displayRecord?.secretKey;
        if (originalSecretKey && cleanData.secretKey === originalSecretKey) {
          // 值没有变化，不发送该字段（表示不更新）
          delete cleanData.secretKey;
        }
      }

      // 验证：如果要设置为 isHahachat=true，检查是否已有其他 Hahachat 提供商
      if (cleanData.isHahachat === true && hasOtherHahachat) {
        notify('已存在 Hahachat 提供商，只能有一个 Hahachat 提供商', { type: 'error' });
        throw new Error('已存在 Hahachat 提供商');
      }

      // 如果设置为 Hahachat，验证必须提供 loginUrl 和 subscriptionUrl
      if (cleanData.isHahachat === true) {
        if (!cleanData.loginUrl || !cleanData.subscriptionUrl) {
          notify('Hahachat 提供商必须提供登录链接和订阅链接', { type: 'error' });
          throw new Error('Hahachat 提供商必须提供登录链接和订阅链接');
        }
        // Hahachat 提供商不需要设置支持的模型
        cleanData.supportedModels = [];
      } else {
        // 非 Hahachat 提供商，如果 API 相关字段为空，验证必填
        if (!cleanData.apiEndpoint || !cleanData.apiKey) {
          // 如果字段没有变化（可能是编辑时没有修改），不验证
          if (cleanData.apiEndpoint === displayRecord?.apiEndpoint && cleanData.apiKey === displayRecord?.apiKey) {
            // 字段没有变化，跳过验证
          } else {
            notify('非 Hahachat 提供商必须提供 API 端点和 API Key', { type: 'error' });
            throw new Error('非 Hahachat 提供商必须提供 API 端点和 API Key');
          }
        }
      }

      // 删除不应该发送的字段（这些是后端返回的元数据）
      delete cleanData.createdAt;
      delete cleanData.updatedAt;
      delete cleanData.sk;
      delete cleanData.entityType;
      delete cleanData.id; // 使用 providerId 而不是 id
      delete cleanData.providerId; // providerId 在 URL 中，不需要在 body 中

      console.log('[HahachatProviderEdit] 清理后的数据:', cleanData);
      
      // 使用 dataProvider.update 来更新资源
      const result = await dataProvider.update('hahachat-providers', {
        id: updateId,
        data: cleanData,
        previousData: displayRecord || {},
      });
      
      console.log('[HahachatProviderEdit] 更新成功:', result);
      notify('提供商更新成功', { type: 'success' });
      redirect('list', 'hahachat-providers');
      
      return result.data;
    } catch (error: unknown) {
      console.error('[HahachatProviderEdit] 更新失败:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || 
                          (error as { body?: { message?: string } })?.body?.message ||
                          (error as { message?: string })?.message ||
                          '更新失败';
      notify(errorMessage, { type: 'error' });
      throw error;
    }
  }, [providerId, displayRecord, hasOtherHahachat, notify, redirect, dataProvider]);

  // 测试功能状态
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    error?: string;
    response?: string;
    latencyMs?: number;
  } | null>(null);

  const handleTest = useCallback(async () => {
    if (!providerId) {
      notify('提供商ID不存在', { type: 'error' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await apiClient.post(
        `/admin/hahachat-providers/${providerId}/test`
      );

      const result = response.data.data?.result || response.data.data;
      
      setTestResult({
        success: result.success || false,
        error: result.error,
        response: result.response,
        latencyMs: result.latencyMs,
      });

      if (result.success) {
        notify('提供商测试成功', { type: 'success' });
      } else {
        notify(result.error || '提供商测试失败', { type: 'error' });
      }
    } catch (error: unknown) {
      const errorMessage = 
        (error as any)?.response?.data?.error?.message || 
        (error as any)?.response?.data?.message ||
        (error as any)?.message || 
        '测试失败';
      
      setTestResult({
        success: false,
        error: errorMessage,
      });
      
      notify(errorMessage, { type: 'error' });
    } finally {
      setTesting(false);
    }
  }, [providerId, notify]);

  // 根据 displayRecord 的 isHahachat 值判断使用哪种表单
  // 处理可能的字符串 "true" 或布尔值 true
  const isHahachatValue = displayRecord?.isHahachat;
  const isHahachatProvider = isHahachatValue === true || isHahachatValue === 'true' || isHahachatValue === 1;
  
  console.log('[HahachatProviderEdit] 渲染判断:', {
    providerId,
    isHahachat: displayRecord?.isHahachat,
    isHahachatType: typeof displayRecord?.isHahachat,
    isHahachatProvider,
    hasRecord: !!record,
    hasFetchedRecord: !!fetchedRecord,
  });

  // 如果数据还在加载，等待（Edit 组件会自动显示加载状态）
  if (!displayRecord && isLoading) {
    return null;
  }

  // 如果数据加载完成但没有记录，返回错误提示
  if (!displayRecord && !isLoading) {
    return (
      <Edit>
        <SimpleForm>
          <Alert severity="error">提供商不存在</Alert>
        </SimpleForm>
      </Edit>
    );
  }

  console.log('[HahachatProviderEdit] 返回 Edit 组件, providerId:', providerId, '渲染次数:', renderCountRef.current, 'mountId:', mountIdRef.current);
  
  // 直接在 return 中条件渲染，不使用 useMemo
  // 不使用 key，让 React Admin 完全控制
  return (
    <Edit>
      {isHahachatProvider ? (
        // Hahachat 提供商：使用 SimpleForm（不包含测试连接）
        <SimpleForm onSubmit={handleSave}>
          <TextInput source="providerId" disabled label="提供商ID" />
          <TextInput source="name" label="名称" required helperText="提供商的内部名称" />
          <TextInput source="displayName" label="显示名称" required helperText="在前端显示的名称" />
          <TextInput source="description" label="描述" multiline helperText="提供商的描述信息" />
          
          {/* isHahachat 开关 */}
          {canShowIsHahachatSwitch && (
            <BooleanInput
              source="isHahachat"
              label="是否为 Hahachat 提供商"
              helperText="开启后，将使用 Hahachat 专用配置（登录页面、订阅套餐页面），并隐藏 API 相关字段"
            />
          )}

          {/* Hahachat 专用配置 */}
          <TextInput
            source="loginUrl"
            label="登录页面 URL"
            required
            helperText="Hahachat 登录页面的完整 URL"
          />
          <TextInput
            source="subscriptionUrl"
            label="订阅套餐页面 URL"
            required
            helperText="Hahachat 订阅套餐页面的完整 URL"
          />

          <NumberInput source="sortOrder" label="排序" helperText="排序值，数字越小越靠前" />
          <SelectInput
            source="status"
            label="状态"
            choices={[
              { id: 'active', name: '活跃' },
              { id: 'inactive', name: '未激活' },
            ]}
          />
        </SimpleForm>
      ) : (
      <TabbedForm onSubmit={handleSave}>
        <Tab label="基本信息">
          <TextInput source="providerId" disabled label="提供商ID" />
          <TextInput source="name" label="名称" required helperText="提供商的内部名称" />
          <TextInput source="displayName" label="显示名称" required helperText="在前端显示的名称" />
          <TextInput source="description" label="描述" multiline helperText="提供商的描述信息" />
          
          {/* isHahachat 开关 */}
          {canShowIsHahachatSwitch && (
            <BooleanInput
              source="isHahachat"
              label="是否为 Hahachat 提供商"
              helperText="开启后，将使用 Hahachat 专用配置（登录页面、订阅套餐页面），并隐藏 API 相关字段"
            />
          )}

          {/* API 相关字段 */}
          <TextInput 
            source="apiEndpoint" 
            label="API 端点" 
            required
            validate={(value: string, allValues: Record<string, unknown>) => {
              if (allValues.isHahachat === true || allValues.isHahachat === 'true') {
                return undefined; // Hahachat 提供商不需要验证
              }
              if (!value || value.trim() === '') {
                return 'API 端点是必填项';
              }
              return undefined;
            }}
            helperText="API 请求的完整 URL" 
          />
          <PasswordInput 
            source="apiKey" 
            label="API Key" 
            validate={(_value: string, allValues: Record<string, unknown>) => {
              if (allValues.isHahachat === true || allValues.isHahachat === 'true') {
                return undefined; // Hahachat 提供商不需要验证
              }
              return undefined;
            }}
            helperText="留空则不更新，填写新值则更新（将加密存储）"
            autoComplete="new-password"
          />
          <PasswordInput 
            source="secretKey" 
            label="Secret Key" 
            helperText="留空则不更新，填写新值则更新（可选，将加密存储）"
            autoComplete="new-password"
          />
          <ArrayInput source="supportedModels" label="支持的模型">
            <SimpleFormIterator>
              <TextInput source="" label="模型ID" helperText="该提供商支持的 AI 模型ID（用于内部判断，不用于显示）" fullWidth />
            </SimpleFormIterator>
          </ArrayInput>

          <TextInput
            source="imageGenerationRoute"
            label="图片生成 API 路径"
            helperText="相对 API 端点。留空=自动；仅 chat 填 chat/completions；标准 OpenAI 填 images/generations"
          />
          <TextInput
            source="imageEditRoute"
            label="图片编辑 API 路径（带参考图）"
            helperText="留空=自动；仅 chat 填 chat/completions；标准 OpenAI 填 images/edits"
          />

          <NumberInput source="sortOrder" label="排序" helperText="排序值，数字越小越靠前" />
          <SelectInput
            source="status"
            label="状态"
            choices={[
              { id: 'active', name: '活跃' },
              { id: 'inactive', name: '未激活' },
            ]}
          />
        </Tab>
        <Tab label="测试连接">
          <Box sx={{ p: 2 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  测试提供商连接
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  验证 API Key 是否正确，将发送一个简单的测试请求到提供商
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Button
                    label="开始测试"
                    onClick={handleTest}
                    disabled={testing}
                    variant="contained"
                    startIcon={testing ? <CircularProgress size={20} /> : <PlayIcon />}
                  />
                </Box>

                {testResult && (
                  <Box sx={{ mt: 2 }}>
                    {testResult.success ? (
                      <Alert severity="success" sx={{ mb: 2 }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                          连接成功！
                        </Typography>
                        {testResult.latencyMs && (
                          <Typography variant="body2">
                            响应时间: {testResult.latencyMs}ms
                          </Typography>
                        )}
                      </Alert>
                    ) : (
                      <Alert severity="error" sx={{ mb: 2 }}>
                        <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                          连接失败
                        </Typography>
                        <Typography variant="body2">
                          {testResult.error || '未知错误'}
                        </Typography>
                      </Alert>
                    )}

                    {testResult.response && (
                      <Card variant="outlined" sx={{ mt: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle2" gutterBottom>
                            测试响应:
                          </Typography>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {testResult.response}
                          </Typography>
                        </CardContent>
                      </Card>
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>
        </Tab>
      </TabbedForm>
      )}
    </Edit>
  );
};

// 不使用 memo，让 React Admin 完全控制渲染
export default HahachatProviderEdit;
