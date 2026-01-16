import { List, Datagrid, TextField, NumberField, BooleanField, DateField, FunctionField, EditButton, ShowButton, CreateButton, Filter, SelectInput, TopToolbar, Button, usePermissions } from 'react-admin';
import { formatUtils } from '../../utils/format';
import { useNotify, useRedirect } from 'react-admin';
import { hasPermission } from '../../utils/permissions';
import { authUtils } from '../../utils/auth';
import apiClient from '../../services/api';
import { ContentCopy as CopyIcon } from '@mui/icons-material';

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
      label="复制"
      onClick={handleDuplicate}
      startIcon={<CopyIcon />}
    />
  );
};

export const SubscriptionPlanList = () => {
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const canWrite = hasPermission(permissions, 'subscriptions:write', adminInfo?.role);

  return (
    <List filters={<SubscriptionPlanFilter />} actions={canWrite ? <CreateButton /> : undefined}>
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
