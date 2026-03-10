import { List, Datagrid, TextField, NumberField, BooleanField, DateField, FunctionField, EditButton, ShowButton, CreateButton, Filter, SelectInput, TopToolbar, usePermissions } from 'react-admin';
import { formatUtils } from '../../utils/format';
import { useNotify, useRedirect } from 'react-admin';
import { useNavigate } from 'react-router-dom';
import { hasPermission } from '../../utils/permissions';
import { authUtils } from '../../utils/auth';
import apiClient from '../../services/api';
import { ContentCopy as CopyIcon, Upload as UploadIcon, Download as DownloadIcon } from '@mui/icons-material';
import { Button, Box, Typography } from '@mui/material';

const SubscriptionPlanFilter = (props: any) => (
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

const DuplicateButton = ({ record }: any) => {
  const notify = useNotify();
  const redirect = useRedirect();

  const handleDuplicate = async () => {
    if (!record?.id) {
      notify('套餐ID不存在', { type: 'error' });
      return;
    }

    if (!window.confirm(`确定要复制套餐 "${record.name}" 吗？`)) {
      return;
    }

    try {
      const response = await apiClient.post(`/admin/subscriptions/plans/${record.id}/duplicate`);
      notify('复制成功', { type: 'success' });
      redirect('show', 'subscription-plans', response.data.data.id);
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message || '复制失败';
      notify(errorMessage, { type: 'error' });
    }
  };

  return (
    <Button
      onClick={handleDuplicate}
      startIcon={<CopyIcon />}
    >
      复制
    </Button>
  );
};

const ListActions = () => {
  const navigate = useNavigate();
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const userRole = adminInfo?.role;
  const canWrite = hasPermission(permissions, 'subscriptions:write', userRole);
  const canRead = hasPermission(permissions, 'subscriptions:read', userRole);

  // 强制输出调试日志（即使不在 DEV 模式）
  console.log('[SubscriptionPlanList] ListActions 组件被渲染', {
    canWrite,
    canRead,
    userRole,
    permissions: Array.isArray(permissions) ? permissions : 'not array',
    adminInfo,
    timestamp: new Date().toISOString(),
  });

  return (
    <TopToolbar>
      {canWrite && <CreateButton />}
      {(canWrite || canRead) && (
        <Button
          variant="contained"
          color="primary"
          startIcon={<UploadIcon />}
          onClick={() => {
            console.log('[SubscriptionPlanList] 点击导入/导出按钮');
            navigate('/subscription-plans-import-export');
          }}
          sx={{ ml: 1 }}
        >
          导入/导出
        </Button>
      )}
    </TopToolbar>
  );
};

// 空状态组件
const EmptyState = () => {
  const navigate = useNavigate();
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const userRole = adminInfo?.role;
  const canWrite = hasPermission(permissions, 'subscriptions:write', userRole);
  const canRead = hasPermission(permissions, 'subscriptions:read', userRole);

  // 强制输出调试日志
  console.log('[SubscriptionPlanList] EmptyState 组件被渲染', {
    canWrite,
    canRead,
    userRole,
    permissions: Array.isArray(permissions) ? permissions : 'not array',
    adminInfo,
    timestamp: new Date().toISOString(),
  });

  if (!canWrite && !canRead) {
    console.log('[SubscriptionPlanList] EmptyState: 没有权限，返回 null');
    return null; // 如果没有权限，使用默认空状态
  }

  console.log('[SubscriptionPlanList] EmptyState: 渲染空状态 UI');

  return (
    <Box sx={{ textAlign: 'center', py: 5 }}>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        还没有订阅套餐
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        您可以创建新的套餐或批量导入套餐配置
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center' }}>
        {canWrite && <CreateButton />}
        {(canWrite || canRead) && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<UploadIcon />}
            onClick={() => {
              console.log('[SubscriptionPlanList] EmptyState 点击导入/导出按钮');
              navigate('/subscription-plans-import-export');
            }}
          >
            导入/导出
          </Button>
        )}
      </Box>
    </Box>
  );
};

export const SubscriptionPlanList = () => {
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const canWrite = hasPermission(permissions, 'subscriptions:write', adminInfo?.role);

  // 强制输出调试日志
  console.log('[SubscriptionPlanList] 主组件被渲染', {
    canWrite,
    userRole: adminInfo?.role,
    permissions: Array.isArray(permissions) ? permissions : 'not array',
    adminInfo,
    timestamp: new Date().toISOString(),
  });

  return (
    <List filters={<SubscriptionPlanFilter />} actions={<ListActions />} empty={<EmptyState />}>
      <Datagrid rowClick="show">
        <TextField source="name" label="套餐名称" />
        <NumberField source="duration" label="有效期（天）" />
        <FunctionField
          label="计费周期"
          render={(record: any) => {
            const cycleMap: Record<string, string> = {
              monthly: '连续包月',
              annual: '连续包年',
              onetime: '单次购买',
            };
            return cycleMap[record.billingCycle] || record.billingCycle;
          }}
        />
        <FunctionField
          label="价格配置"
          render={(record: any) => {
            if (!record.pricing || !Array.isArray(record.pricing)) return '-';
            return `${record.pricing.length} 个价格项`;
          }}
        />
        <BooleanField source="isPopular" label="最受欢迎" />
        <TextField source="status" label="状态" format={(status) => formatUtils.status(status)} />
        <NumberField source="sortOrder" label="排序" />
        <DateField source="createdAt" label="创建时间" showTime />
        <ShowButton />
        {canWrite && <EditButton />}
        {canWrite && <DuplicateButton />}
      </Datagrid>
    </List>
  );
};
