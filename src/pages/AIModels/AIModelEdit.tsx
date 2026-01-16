import { Edit, useNotify, useRefresh, useDataProvider, useRecordContext, usePermissions, useRedirect, DeleteButton } from 'react-admin';
import { Alert } from '@mui/material';
import { useParams } from 'react-router-dom';
import { authUtils } from '../../utils/auth';
import { hasPermission } from '../../utils/permissions';
import { AIModelEditForm } from './AIModelEditForm';

export const AIModelEdit = () => {
  const notify = useNotify();
  const refresh = useRefresh();
  const dataProvider = useDataProvider();
  const record = useRecordContext();
  const { id } = useParams();
  const { permissions } = usePermissions();

  // 获取当前管理员信息
  const adminInfo = authUtils.getAdminInfo();
  // 检查是否有编辑权限
  const canWrite = hasPermission(permissions, 'ai_models:write', adminInfo?.role);

  const modelId = (record?.id || id) as string;

  if (!canWrite) {
    return (
      <Edit>
        <AIModelEditForm
          onSubmit={async () => {
            notify('您没有编辑 AI 模型的权限。如需使用，请联系超级管理员。', { type: 'error' });
          }}
        />
        <Alert severity="warning" sx={{ m: 2 }}>
          您没有编辑 AI 模型的权限。如需使用，请联系超级管理员。
        </Alert>
      </Edit>
    );
  }

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      // 优先使用 record.id，然后是 data.id，最后是 URL 参数中的 id
      const modelId = (record?.id || data.id || id) as string;
      
      if (!modelId) {
        notify('模型ID不存在', { type: 'error' });
        return;
      }

      // 清理数据，确保 providers 格式正确
      const modelData: any = { ...data };
      
      // 确保 modelId 字段存在（这是提供商模型ID，需要映射到后端的 providerModelId）
      // 如果用户没有修改 modelId 字段，React Admin 可能不会包含它，需要从 record 中获取
      if (modelData.modelId === undefined && record?.modelId) {
        modelData.modelId = record.modelId;
      }
      
      // 处理 providers：确保格式为 [{ providerId, sortOrder }]
      if (modelData.providers && Array.isArray(modelData.providers)) {
        modelData.providers = modelData.providers.map((item: any, index: number) => {
          if (typeof item === 'string') {
            return { providerId: item, sortOrder: index };
          }
          if (typeof item === 'object' && item !== null) {
            return {
              providerId: item.providerId || item.id,
              sortOrder: item.sortOrder !== undefined ? item.sortOrder : index,
            };
          }
          return null;
        }).filter((item: any) => item !== null && item.providerId);
      } else {
        modelData.providers = [];
      }

      console.log('[AIModelEdit] handleSave - 准备更新的数据:', {
        modelId,
        modelData,
        recordModelId: record?.modelId,
      });

      // 更新模型数据
      await dataProvider.update('ai-models', {
        id: modelId,
        data: modelData,
        previousData: record || {},
      });

      notify('模型更新成功', { type: 'success' });
      refresh(); // 刷新数据，确保显示最新内容
    } catch (error: unknown) {
      const errorMessage = (error as { message?: string })?.message || '更新失败';
      notify(errorMessage, { type: 'error' });
    }
  };

  const redirect = useRedirect();

  return (
    <Edit>
      <AIModelEditForm 
        onSubmit={handleSave}
        currentModelId={modelId}
      />
    </Edit>
  );
};

