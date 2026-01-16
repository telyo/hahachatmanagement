import { Edit, SimpleForm, TextInput, SelectInput, NumberInput, ArrayInput, SimpleFormIterator, BooleanInput, useNotify, useRedirect, useRefresh, useRecordContext, useGetOne, useGetList } from 'react-admin';
import { useParams } from 'react-router-dom';
import apiClient from '../../services/api';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';
import { useFormContext } from 'react-hook-form';

const ClientProviderEdit = () => {
  const notify = useNotify();
  const redirect = useRedirect();
  const refresh = useRefresh();
  const record = useRecordContext();
  const { id } = useParams();
  const [uploading, setUploading] = useState(false);
  const [currentIconUrl, setCurrentIconUrl] = useState<string | null>(null);
  const [isHahachat, setIsHahachat] = useState(false);
  const [hasOtherHahachat, setHasOtherHahachat] = useState(false);
  const setFormValueRef = useRef<((field: string, value: any, options?: any) => void) | null>(null);

  const providerId = (record?.id || record?.providerId || id) as string;

  // 如果 useRecordContext 没有数据，使用 useGetOne 获取
  const { data: fetchedRecord } = useGetOne(
    'client-providers',
    { id: providerId },
    { enabled: !!providerId && !record }
  );

  // 使用 fetchedRecord 或 record
  const displayRecord = record || fetchedRecord;

  // 检查是否有其他 Hahachat 提供商
  const { data: providers } = useGetList('client-providers', {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: 'id', order: 'ASC' },
  });

  // 当 record 更新时，更新当前图标 URL 和 isHahachat 状态
  useEffect(() => {
    if (displayRecord?.iconUrl) {
      setCurrentIconUrl(displayRecord.iconUrl);
    } else if (displayRecord && !displayRecord.iconUrl) {
      setCurrentIconUrl(null);
    }
    
    // 更新 isHahachat 状态
    if (displayRecord?.isHahachat !== undefined) {
      setIsHahachat(displayRecord.isHahachat === true);
    }
  }, [record, fetchedRecord, displayRecord]);

  // 检查是否有其他 Hahachat 提供商
  useEffect(() => {
    if (providers && providerId) {
      const otherHahachat = providers.some(
        (p: any) => p.isHahachat === true && (p.providerId || p.id) !== providerId
      );
      setHasOtherHahachat(otherHahachat);
    }
  }, [providers, providerId]);

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      const updateId = (data.id || data.providerId || providerId) as string;
      if (!updateId) {
        notify('提供商ID不存在', { type: 'error' });
        return;
      }

      // 如果设置为 Hahachat，检查是否已有其他 Hahachat 提供商
      if (data.isHahachat === true && hasOtherHahachat) {
        notify('已存在其他 Hahachat 提供商，只能有一个 Hahachat 提供商', { type: 'error' });
        return;
      }

      // 如果设置为 Hahachat，清空 modelList
      if (data.isHahachat === true) {
        data.modelList = [];
      } else if (!data.isHahachat && (!data.modelList || (Array.isArray(data.modelList) && data.modelList.length === 0))) {
        // 如果取消 Hahachat 标记，需要确保有 modelList
        if (!displayRecord?.modelList || (Array.isArray(displayRecord.modelList) && displayRecord.modelList.length === 0)) {
          notify('非 Hahachat 提供商必须提供模型列表', { type: 'error' });
          return;
        }
      }

      await apiClient.put(`/admin/client-providers/${updateId}`, data);
      notify('提供商更新成功', { type: 'success' });
      redirect('list', 'client-providers');
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '更新失败';
      notify(errorMessage, { type: 'error' });
    }
  };

  // 文件上传处理函数
  const handleIconUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('[IconUpload] onChange triggered', event.target.files);
    const file = event.target.files?.[0];
    if (!file) {
      console.log('[IconUpload] No file selected');
      return;
    }

    console.log('[IconUpload] File selected:', file.name, file.type, file.size);

    // 验证文件类型
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      notify('不支持的图片格式，仅支持 PNG、JPG、SVG', { type: 'error' });
      return;
    }

    // 验证文件大小（最大 2MB）
    if (file.size > 2 * 1024 * 1024) {
      notify('文件大小不能超过 2MB', { type: 'error' });
      return;
    }

    if (!providerId) {
      notify('提供商ID不存在', { type: 'error' });
      return;
    }

    console.log('[IconUpload] Starting upload for provider:', providerId);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('icon', file);

      console.log('[IconUpload] Sending request to:', `/admin/client-providers/${providerId}/icon`);
      const response = await apiClient.post(`/admin/client-providers/${providerId}/icon`, formData);
      console.log('[IconUpload] Upload response:', response);
      
      const newIconUrl = response.data?.data?.iconUrl;
      if (newIconUrl) {
        const iconUrlWithTimestamp = `${newIconUrl}?t=${Date.now()}`;
        setCurrentIconUrl(iconUrlWithTimestamp);
        
        // 使用 ref 更新表单中的 iconUrl 字段，使表单变为"脏"状态
        if (setFormValueRef.current) {
          console.log('[IconUpload] Updating form field iconUrl');
          setFormValueRef.current('iconUrl', newIconUrl, { shouldDirty: true, shouldTouch: true });
        }
      }

      notify('图标上传成功', { type: 'success' });
      refresh();
    } catch (error: unknown) {
      console.error('[IconUpload] Upload error:', error);
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '上传失败';
      notify(errorMessage, { type: 'error' });
    } finally {
      setUploading(false);
      const fileInput = document.getElementById('icon-upload-button') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  }, [notify, providerId, refresh]);

  // 内部组件：用于在 SimpleForm 内部获取 setValue 并保存到 ref
  const IconUploadHandler = () => {
    const { setValue } = useFormContext();
    
    useEffect(() => {
      setFormValueRef.current = setValue;
      return () => {
        setFormValueRef.current = null;
      };
    }, [setValue]);

    return null; // 这个组件不渲染任何内容，只用于获取 setValue
  };

  // 判断是否显示 isHahachat 开关
  const canShowIsHahachatSwitch = !hasOtherHahachat;

  return (
    <Edit>
      <SimpleForm onSubmit={handleSave}>
        {hasOtherHahachat && (
          <Alert severity="info" sx={{ mb: 2 }}>
            已存在其他 Hahachat 提供商，无法将此提供商设置为 Hahachat
          </Alert>
        )}
        <IconUploadHandler />
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box>
            <input
              accept="image/png,image/jpeg,image/jpg,image/svg+xml"
              style={{ display: 'none' }}
              id="icon-upload-button"
              type="file"
              onChange={handleIconUpload}
              disabled={uploading}
            />
            <label htmlFor="icon-upload-button">
              <Button variant="outlined" component="span" disabled={uploading}>
                {uploading ? '上传中...' : '上传图标'}
              </Button>
            </label>
          </Box>
          <Box
            sx={{
              minWidth: 100,
              minHeight: 100,
              maxWidth: 100,
              maxHeight: 100,
              border: '1px solid #e0e0e0',
              borderRadius: 1,
              padding: 1,
              backgroundColor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {(currentIconUrl || displayRecord?.iconUrl) ? (
              <Box
                component="img"
                src={currentIconUrl || displayRecord?.iconUrl}
                alt="提供商图标"
                onError={(e) => {
                  console.error('图标加载失败:', currentIconUrl || displayRecord?.iconUrl);
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
                sx={{
                  maxWidth: '100%',
                  maxHeight: '100%',
                  objectFit: 'contain',
                }}
              />
            ) : (
              <Typography variant="caption" color="text.secondary">
                暂无图标
              </Typography>
            )}
          </Box>
        </Box>
        {/* 隐藏的 iconUrl 字段，用于在上传图标后触发表单的脏状态 */}
        <TextInput source="iconUrl" style={{ display: 'none' }} />
        <TextInput source="providerId" disabled label="提供商ID" />
        <TextInput source="providerCode" disabled label="提供商代码" helperText="提供商代码创建后不可修改" />
        <TextInput source="displayName" label="显示名称" required />
        <TextInput source="baseUrl" label="API 基础 URL" required helperText="提供商的 API 基础地址" />
        <TextInput source="defaultModel" label="默认模型" required helperText="默认使用的模型ID" />
        
        {/* isHahachat 开关 */}
        {canShowIsHahachatSwitch && (
          <BooleanInput
            source="isHahachat"
            label="是否为 Hahachat 提供商"
            helperText="开启后，将使用 Hahachat 专用配置（登录页面、订阅套餐页面），并隐藏模型列表"
            onChange={(e: any) => setIsHahachat(e.target.checked)}
          />
        )}

        {/* Hahachat 专用配置 */}
        {isHahachat && (
          <>
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
          </>
        )}

        {/* 非 Hahachat 提供商显示模型列表 */}
        {!isHahachat && (
          <ArrayInput source="modelList" label="模型列表" required>
            <SimpleFormIterator>
              <TextInput source="modelId" label="模型ID" required helperText="模型的唯一标识符" />
              <TextInput source="displayName" label="显示名称" required helperText="模型在前端显示的名称" />
            </SimpleFormIterator>
          </ArrayInput>
        )}

        <SelectInput
          source="status"
          label="状态"
          choices={[
            { id: 'active', name: '活跃' },
            { id: 'inactive', name: '未激活' },
          ]}
        />
        <NumberInput source="sortOrder" label="排序" />
      </SimpleForm>
    </Edit>
  );
};

export default ClientProviderEdit;
