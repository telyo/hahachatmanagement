import { List, Datagrid, TextField, NumberField, DateField, EditButton, ShowButton, CreateButton, Filter, TextInput, SelectInput, TopToolbar, Button, usePermissions } from 'react-admin';
import { formatUtils } from '../../utils/format';
import { useNotify, useRedirect } from 'react-admin';
import { hasPermission } from '../../utils/permissions';
import { authUtils } from '../../utils/auth';
import apiClient from '../../services/api';
import { ContentCopy as CopyIcon, ImportExport as ImportExportIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const AIModelFilter = (props: any) => (
  <Filter {...props}>
    <TextInput source="search" label="搜索模型ID或名称" />
    <SelectInput
      source="status"
      label="状态"
      choices={[
        { id: 'active', name: '活跃' },
        { id: 'inactive', name: '未激活' },
      ]}
    />
    <SelectInput
      source="provider"
      label="提供商"
      choices={[
        { id: 'openai', name: 'OpenAI' },
        { id: 'anthropic', name: 'Anthropic' },
        { id: 'google', name: 'Google' },
      ]}
    />
  </Filter>
);

const DuplicateButton = ({ record }: any) => {
  const notify = useNotify();
  const redirect = useRedirect();

  const handleDuplicate = async () => {
    if (!record?.id) {
      notify('模型ID不存在', { type: 'error' });
      return;
    }

    if (!window.confirm(`确定要复制模型 "${record.displayName || record.name}" 吗？`)) {
      return;
    }

    try {
      const response = await apiClient.post(`/admin/ai/models/${record.id}/duplicate`, {
        newModelId: `${record.id}-copy`,
        name: `${record.displayName || record.name} (副本)`,
      });

      notify('复制成功', { type: 'success' });
      redirect('show', 'ai-models', response.data.data.id);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message || '复制失败';
      notify(errorMessage, { type: 'error' });
    }
  };

  return (
    <Button
      label="复制"
      onClick={handleDuplicate}
      startIcon={<CopyIcon />}
    />
  );
};

const CustomActions = () => {
  const navigate = useNavigate();
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const canWrite = hasPermission(permissions, 'ai_models:write', adminInfo?.role);
  const canImportExport = hasPermission(permissions, 'ai_models:import_export', adminInfo?.role);

  return (
    <TopToolbar>
      {canWrite && <CreateButton />}
      {canImportExport && (
        <Button
          label="导入/导出"
          onClick={() => navigate('/ai-models-import-export')}
          startIcon={<ImportExportIcon />}
        />
      )}
    </TopToolbar>
  );
};

export const AIModelList = () => {
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const canWrite = hasPermission(permissions, 'ai_models:write', adminInfo?.role);

  // 默认只显示 active 状态的模型
  const defaultFilter = { status: 'active' };

  return (
    <List 
      filters={<AIModelFilter />} 
      actions={<CustomActions />} 
      filterDefaultValues={defaultFilter}
    >
      <Datagrid rowClick="show">
        <TextField source="name" label="名称" />
        <TextField source="displayName" label="显示名称" />
        <TextField source="provider" label="提供商" />
        <TextField source="category" label="分类" />
        <TextField source="type" label="类型" />
        <TextField source="status" label="状态" format={(status) => String(formatUtils.status(status || ''))} />
        <NumberField source="pricing.inputPrice" label="输入价格（每1K tokens）" />
        <NumberField source="pricing.outputPrice" label="输出价格（每1K tokens）" />
        <NumberField source="displayConfig.sortOrder" label="排序" />
        <DateField source="createdAt" label="创建时间" showTime />
        <ShowButton />
        {canWrite && <EditButton />}
        {canWrite && <DuplicateButton />}
      </Datagrid>
    </List>
  );
};
