import { List, Datagrid, TextField, DateField, EditButton, ShowButton, Filter, SelectInput, usePermissions, TopToolbar, CreateButton, ExportButton } from 'react-admin';
import { formatUtils } from '../../utils/format';
import { hasPermission } from '../../utils/permissions';
import { authUtils } from '../../utils/auth';
import { Upload as UploadIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Button, Box, Typography } from '@mui/material';

const HahachatProviderFilter = (props: Record<string, unknown>) => (
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
  
  // 检查是否有 hahachat_providers:write 权限（超级管理员自动有所有权限）
  const canWrite = hasPermission(permissions, 'hahachat_providers:write', userRole);
  
  // 调试日志
  if (import.meta.env.DEV) {
    console.log('[HahachatProviderList] ListActions', {
      canWrite,
      userRole,
      permissions: Array.isArray(permissions) ? permissions : 'not array',
      adminInfo,
    });
  }
  
  return (
    <TopToolbar>
      {canWrite && (
        <>
          <CreateButton />
          <Button
            variant="contained"
            color="primary"
            startIcon={<UploadIcon />}
            onClick={() => {
              console.log('[HahachatProviderList] 点击导入按钮');
              navigate('/hahachat-providers/import');
            }}
            sx={{ ml: 1 }}
          >
            导入提供商
          </Button>
        </>
      )}
      <ExportButton />
    </TopToolbar>
  );
};

// 空状态组件
const EmptyState = () => {
  const navigate = useNavigate();
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const userRole = adminInfo?.role;
  const canWrite = hasPermission(permissions, 'hahachat_providers:write', userRole);

  if (!canWrite) {
    return null; // 如果没有写权限，使用默认空状态
  }

  return (
    <Box sx={{ textAlign: 'center', py: 5 }}>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        还没有 Hahachat 提供商
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        您可以创建新的提供商或批量导入提供商配置
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
        <CreateButton />
        <Button
          variant="contained"
          color="primary"
          startIcon={<UploadIcon />}
          onClick={() => {
            navigate('/hahachat-providers/import');
          }}
        >
          导入提供商
        </Button>
      </Box>
    </Box>
  );
};

export const HahachatProviderList = () => {
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const userRole = adminInfo?.role;
  
  // 检查是否有 hahachat_providers:read 权限（超级管理员自动有所有权限）
  const canRead = hasPermission(permissions, 'hahachat_providers:read', userRole);
  
  if (!canRead) {
    return <div>无权限访问此页面</div>;
  }

  return (
    <List 
      filters={<HahachatProviderFilter />} 
      actions={<ListActions />}
      empty={<EmptyState />}
    >
      <Datagrid rowClick="show">
        <TextField source="name" label="名称" />
        <TextField source="displayName" label="显示名称" />
        <TextField source="apiEndpoint" label="API 端点" />
        <TextField source="status" label="状态" format={(status: string) => formatUtils.status(status)} />
        <TextField source="sortOrder" label="排序" />
        <DateField source="createdAt" label="创建时间" showTime />
        <ShowButton />
        <EditButton />
      </Datagrid>
    </List>
  );
};
