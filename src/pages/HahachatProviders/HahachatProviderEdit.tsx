import { Edit, SimpleForm, TextInput, SelectInput, NumberInput, ArrayInput, SimpleFormIterator, PasswordInput, useNotify, useRedirect, useRecordContext, useGetOne, useDataProvider, TabbedForm, Tab, Button } from 'react-admin';
import { useParams } from 'react-router-dom';
import { Box, Card, CardContent, Typography, CircularProgress, Alert } from '@mui/material';
import { PlayArrow as PlayIcon } from '@mui/icons-material';
import apiClient from '../../services/api';
import { useState } from 'react';

const HahachatProviderEdit = () => {
  const notify = useNotify();
  const redirect = useRedirect();
  const record = useRecordContext();
  const { id } = useParams();
  const dataProvider = useDataProvider();

  const providerId = (record?.id || record?.providerId || id) as string;

  // 如果 useRecordContext 没有数据，使用 useGetOne 获取
  const { data: fetchedRecord } = useGetOne(
    'hahachat-providers',
    { id: providerId },
    { enabled: !!providerId && !record }
  );

  // 使用 fetchedRecord 或 record
  const displayRecord = record || fetchedRecord;

  const handleSave = async (data: Record<string, unknown>) => {
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
  };

  // 测试功能状态
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    error?: string;
    response?: string;
    latencyMs?: number;
  } | null>(null);

  const handleTest = async () => {
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
  };

  return (
    <Edit>
      <TabbedForm onSubmit={handleSave}>
        <Tab label="基本信息">
          <TextInput source="providerId" disabled label="提供商ID" />
          <TextInput source="name" label="名称" required helperText="提供商的内部名称" />
          <TextInput source="displayName" label="显示名称" required helperText="在前端显示的名称" />
          <TextInput source="description" label="描述" multiline helperText="提供商的描述信息" />
          <TextInput source="apiEndpoint" label="API 端点" required helperText="API 请求的完整 URL" />
          <PasswordInput 
            source="apiKey" 
            label="API Key" 
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
    </Edit>
  );
};

export default HahachatProviderEdit;
