import { Create, SimpleForm, TextInput, SelectInput, NumberInput, ArrayInput, SimpleFormIterator, BooleanInput, useNotify, useRedirect, useGetList } from 'react-admin';
import apiClient from '../../services/api';
import { useState, useEffect } from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';

export const ClientProviderCreate = () => {
  const notify = useNotify();
  const redirect = useRedirect();
  const [uploading, setUploading] = useState(false);
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [isHahachat, setIsHahachat] = useState(false);
  const [hasExistingHahachat, setHasExistingHahachat] = useState(false);

  // 检查是否已有 Hahachat 提供商
  const { data: providers } = useGetList('client-providers', {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: 'id', order: 'ASC' },
  });

  useEffect(() => {
    if (providers) {
      const existingHahachat = providers.some((p: any) => p.isHahachat === true);
      setHasExistingHahachat(existingHahachat);
      if (existingHahachat) {
        setIsHahachat(false); // 如果已有 Hahachat，不允许再创建
      }
    }
  }, [providers]);

  const handleIconFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setIconFile(null);
      return;
    }

    // 验证文件类型
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      notify('不支持的图片格式，仅支持 PNG、JPG、SVG', { type: 'error' });
      setIconFile(null);
      return;
    }

    // 验证文件大小（最大 2MB）
    if (file.size > 2 * 1024 * 1024) {
      notify('文件大小不能超过 2MB', { type: 'error' });
      setIconFile(null);
      return;
    }

    setIconFile(file);
    notify('图标已选择，将在创建提供商后自动上传', { type: 'info' });
  };

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      // 如果设置为 Hahachat，检查是否已有其他 Hahachat 提供商
      if (data.isHahachat === true && hasExistingHahachat) {
        notify('已存在 Hahachat 提供商，只能有一个 Hahachat 提供商', { type: 'error' });
        return;
      }

      // 如果设置为 Hahachat，清空 modelList
      if (data.isHahachat === true) {
        data.modelList = [];
      } else if (!data.modelList || (Array.isArray(data.modelList) && data.modelList.length === 0)) {
        notify('非 Hahachat 提供商必须提供模型列表', { type: 'error' });
        return;
      }

      // 先创建提供商
      const response = await apiClient.post('/admin/client-providers', data);
      const createdProvider = response.data?.data;
      const createdProviderId = createdProvider?.providerId || createdProvider?.id;
      
      if (!createdProviderId) {
        notify('创建成功，但无法获取提供商ID', { type: 'warning' });
        redirect('list', 'client-providers');
        return;
      }

      // 如果有图标文件，立即上传
      if (iconFile) {
        setUploading(true);
        try {
          const formData = new FormData();
          formData.append('icon', iconFile);

          await apiClient.post(`/admin/client-providers/${createdProviderId}/icon`, formData);
          notify('提供商创建成功，图标已上传', { type: 'success' });
        } catch (uploadError: unknown) {
          const errorMessage = (uploadError as { response?: { data?: { message?: string } } })?.response?.data?.message || '图标上传失败';
          notify(`提供商已创建，但图标上传失败: ${errorMessage}`, { type: 'warning' });
        } finally {
          setUploading(false);
        }
      } else {
        notify('提供商创建成功', { type: 'success' });
      }
      
      redirect('list', 'client-providers');
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '创建失败';
      notify(errorMessage, { type: 'error' });
    }
  };

  return (
    <Create>
      <SimpleForm onSubmit={handleSave}>
        {hasExistingHahachat && (
          <Alert severity="info" sx={{ mb: 2 }}>
            已存在 Hahachat 提供商，无法再创建新的 Hahachat 提供商
          </Alert>
        )}
        <Box sx={{ mb: 2 }}>
          <input
            accept="image/png,image/jpeg,image/jpg,image/svg+xml"
            style={{ display: 'none' }}
            id="icon-upload-button-create"
            type="file"
            onChange={handleIconFileSelect}
            disabled={uploading}
          />
          <label htmlFor="icon-upload-button-create">
            <Button variant="outlined" component="span" disabled={uploading}>
              {iconFile ? `已选择: ${iconFile.name}` : '选择图标'}
            </Button>
          </label>
          {iconFile && (
            <Button
              variant="text"
              size="small"
              onClick={() => setIconFile(null)}
              sx={{ ml: 1 }}
            >
              清除
            </Button>
          )}
        </Box>
        <TextInput source="providerCode" label="提供商代码" required helperText="唯一标识符，如 openai, anthropic, hahachat" />
        <TextInput source="displayName" label="显示名称" required />
        <TextInput source="baseUrl" label="API 基础 URL" required helperText="提供商的 API 基础地址" />
        <TextInput source="defaultModel" label="默认模型" required helperText="默认使用的模型ID" />
        
        {/* isHahachat 开关 */}
        <BooleanInput
          source="isHahachat"
          label="是否为 Hahachat 提供商"
          defaultValue={false}
          disabled={hasExistingHahachat}
          helperText={hasExistingHahachat ? "已存在 Hahachat 提供商，无法再创建" : "开启后，将使用 Hahachat 专用配置（登录页面、订阅套餐页面）"}
          onChange={(e: any) => setIsHahachat(e.target.checked)}
        />

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
          defaultValue="active"
        />
        <NumberInput source="sortOrder" label="排序" defaultValue={0} />
      </SimpleForm>
    </Create>
  );
};
