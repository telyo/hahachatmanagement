import { List, Datagrid, TextField, ImageField, DateField, EditButton, ShowButton, Filter, SelectInput, usePermissions, TopToolbar, CreateButton, ExportButton } from 'react-admin';
import { formatUtils } from '../../utils/format';
import { hasPermission } from '../../utils/permissions';
import { authUtils } from '../../utils/auth';
import { Upload as UploadIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { Button, Box, Typography } from '@mui/material';

// 导出为 JSON 格式，与导入接口格式一致 { providers: [...] }
const clientProviderJsonExporter = (records: any[]) => {
  const providers = records.map((record) => ({
    providerCode: record.providerCode ?? '',
    displayName: record.displayName ?? '',
    baseUrl: record.baseUrl ?? '',
    defaultModel: record.defaultModel ?? '',
    modelList: record.modelList ?? [],
    sortOrder: record.sortOrder ?? 0,
    isHahachat: record.isHahachat ?? false,
    loginUrl: record.loginUrl ?? '',
    subscriptionUrl: record.subscriptionUrl ?? '',
    ...(record.statusConfig && Object.keys(record.statusConfig).length > 0 ? { statusConfig: record.statusConfig } : {}),
  }));
  const exportData = { providers };
  const jsonString = JSON.stringify(exportData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `client-providers-export-${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

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
  
  // 强制输出调试日志（即使不在 DEV 模式）
  console.log('[ClientProviderList] ListActions 组件被渲染', {
    canWrite,
    userRole,
    permissions: Array.isArray(permissions) ? permissions : 'not array',
    adminInfo,
    timestamp: new Date().toISOString(),
  });
  
  return (
    <TopToolbar>
      {canWrite && <CreateButton />}
      {canWrite && (
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
  const canWrite = hasPermission(permissions, 'client_providers:write', userRole);

  // 强制输出调试日志（即使不在 DEV 模式）
  console.log('[ClientProviderList] EmptyState 组件被渲染', {
    canWrite,
    userRole,
    permissions: Array.isArray(permissions) ? permissions : 'not array',
    adminInfo,
    timestamp: new Date().toISOString(),
  });

  if (!canWrite) {
    console.log('[ClientProviderList] EmptyState: 没有写权限，返回 null');
    return null; // 如果没有写权限，使用默认空状态
  }

  console.log('[ClientProviderList] EmptyState: 渲染空状态 UI');

  return (
    <Box sx={{ textAlign: 'center', py: 5 }}>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        还没有客户提供商
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
            console.log('[ClientProviderList] EmptyState 点击导入按钮');
            navigate('/client-providers-import');
          }}
        >
          导入提供商
        </Button>
      </Box>
    </Box>
  );
};

export const ClientProviderList = () => {
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const userRole = adminInfo?.role;
  
  // 检查是否有 client_providers:read 权限（超级管理员自动有所有权限）
  const canRead = hasPermission(permissions, 'client_providers:read', userRole);
  
  // 强制输出调试日志
  console.log('[ClientProviderList] 主组件被渲染', {
    canRead,
    userRole,
    permissions: Array.isArray(permissions) ? permissions : 'not array',
    adminInfo,
    timestamp: new Date().toISOString(),
  });
  
  if (!canRead) {
    return <div>无权限访问此页面</div>;
  }

  console.log('[ClientProviderList] 渲染 List 组件，empty prop:', typeof EmptyState);

  return (
    <List filters={<ClientProviderFilter />} actions={<ListActions />} empty={<EmptyState />} exporter={clientProviderJsonExporter}>
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

