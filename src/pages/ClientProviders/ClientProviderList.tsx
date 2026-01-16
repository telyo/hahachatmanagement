import { List, Datagrid, TextField, ImageField, DateField, EditButton, ShowButton, Filter, SelectInput, usePermissions, TopToolbar, CreateButton, ExportButton } from 'react-admin';
import { formatUtils } from '../../utils/format';
import { hasPermission } from '../../utils/permissions';
import { authUtils } from '../../utils/auth';
import { Upload as UploadIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';

const ClientProviderFilter = (props: Record<string, unknown>) => (
  <Filter {...props}>
    <SelectInput
      source="status"
      label="状态"
      choices={[
        { id: 'active', name: '活跃' },
        { id: 'inactive', name: '未激活' },
      ]}
    />
  </Filter>
);

const ListActions = () => {
  const navigate = useNavigate();
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const userRole = adminInfo?.role;
  
  // 检查是否有 client_providers:write 权限（超级管理员自动有所有权限）
  const canWrite = hasPermission(permissions, 'client_providers:write', userRole);
  
  // 调试日志
  if (import.meta.env.DEV) {
    console.log('[ClientProviderList] ListActions', {
      canWrite,
      userRole,
      permissions: Array.isArray(permissions) ? permissions : 'not array',
      adminInfo,
    });
  }
  
  return (
    <TopToolbar>
      {canWrite && <CreateButton />}
      <Button
        variant="contained"
        color="primary"
        startIcon={<UploadIcon />}
        onClick={() => {
          console.log('[ClientProviderList] 点击导入按钮');
          navigate('/client-providers-import');
        }}
        sx={{ ml: 1 }}
      >
        导入提供商
      </Button>
      <ExportButton />
    </TopToolbar>
  );
};

export const ClientProviderList = () => {
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const userRole = adminInfo?.role;
  
  // 检查是否有 client_providers:read 权限（超级管理员自动有所有权限）
  const canRead = hasPermission(permissions, 'client_providers:read', userRole);
  
  if (!canRead) {
    return <div>无权限访问此页面</div>;
  }

  return (
    <List filters={<ClientProviderFilter />} actions={<ListActions />}>
      <Datagrid rowClick="show">
        <ImageField source="iconUrl" label="图标" sx={{ '& img': { maxWidth: 40, maxHeight: 40 } }} />
        <TextField source="providerCode" label="提供商代码" />
        <TextField source="displayName" label="显示名称" />
        <TextField source="baseUrl" label="API URL" />
        <TextField source="defaultModel" label="默认模型" />
        <TextField source="status" label="状态" format={(status: string) => formatUtils.status(status)} />
        <TextField source="sortOrder" label="排序" />
        <DateField source="createdAt" label="创建时间" showTime />
        <ShowButton />
        <EditButton />
      </Datagrid>
    </List>
  );
};

