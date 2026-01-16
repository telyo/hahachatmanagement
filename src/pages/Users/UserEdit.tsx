import { Edit, SimpleForm, TextInput, SelectInput, NumberInput, DateInput, useNotify, useRedirect, usePermissions, useRecordContext } from 'react-admin';
import { useParams } from 'react-router-dom';
import { Alert, Typography, Divider } from '@mui/material';
import { hasPermission } from '../../utils/permissions';
import { authUtils } from '../../utils/auth';
import apiClient from '../../services/api';

const UserEdit = () => {
  const notify = useNotify();
  const redirect = useRedirect();
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const canWrite = hasPermission(permissions, 'users:write', adminInfo?.role);
  const record = useRecordContext();
  const { id } = useParams();
  
  // 获取用户ID - 从多个来源获取
  const userId = (record?.id || record?.userId || id) as string;
  
  // 检查是否是超级管理员
  const role = adminInfo?.role;
  const isSuperAdmin = role === 'super_admin' || String(role || '').toLowerCase() === 'super_admin';

  const handleSave = async (data: any) => {
    try {
      // 使用从 record 或 URL 参数获取的 userId，而不是 data.id
      const finalUserId = userId || data.id || data.userId;
      
      if (!finalUserId) {
        notify('用户ID不存在，无法更新', { type: 'error' });
        return;
      }
      
      const promises: Promise<any>[] = [];

      // 更新用户状态
      if (data.status !== undefined) {
        promises.push(apiClient.put(`/admin/users/${finalUserId}/status`, { status: data.status }));
      }

      // 超级管理员可以更新积分、到期日期和续订状态
      if (isSuperAdmin) {
        // 更新积分（如果有变化）
        const currentBalance = record?.virtualCurrency?.balance ?? record?.credits ?? 0;
        const newBalance = data.virtualCurrency?.balance;
        if (newBalance !== undefined && newBalance !== currentBalance) {
          const amount = newBalance - currentBalance;
          if (amount !== 0) {
            promises.push(
              apiClient.post(`/admin/users/${finalUserId}/virtual-currency/adjust`, {
                amount: amount,
                reason: '管理员手动调整',
              })
            );
          }
        }

        // 更新订阅信息（到期日期和续订状态）
        const subscriptionUpdates: any = {};
        if (data.subscription?.endDate) {
          // 如果已经是 ISO 字符串，直接使用；否则转换为 ISO 字符串
          const endDate = typeof data.subscription.endDate === 'string' 
            ? data.subscription.endDate 
            : new Date(data.subscription.endDate).toISOString();
          subscriptionUpdates.endDate = endDate;
        }
        if (data.subscription?.renewalStatus) {
          subscriptionUpdates.renewalStatus = data.subscription.renewalStatus;
        }

        if (Object.keys(subscriptionUpdates).length > 0) {
          promises.push(
            apiClient.put(`/admin/users/${finalUserId}/subscription`, subscriptionUpdates)
          );
        }
      }

      await Promise.all(promises);
      notify('用户信息更新成功', { type: 'success' });
      redirect('list', 'users');
    } catch (error: any) {
      notify(error.response?.data?.message || error.message || '更新失败', { type: 'error' });
    }
  };

  if (!canWrite) {
    return (
      <Edit>
        <SimpleForm>
          <Alert severity="warning" sx={{ m: 2 }}>
            您没有编辑用户的权限。如需使用，请联系超级管理员。
          </Alert>
        </SimpleForm>
      </Edit>
    );
  }

  return (
    <Edit>
      <SimpleForm onSubmit={handleSave}>
        <TextInput source="id" disabled label="用户ID" />
        <TextInput source="email" disabled label="邮箱" />
        <SelectInput
          source="status"
          label="状态"
          choices={[
            { id: 'active', name: '活跃' },
            { id: 'inactive', name: '未激活' },
            { id: 'suspended', name: '已暂停' },
          ]}
        />

        {isSuperAdmin ? (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" sx={{ mb: 2 }}>
              超级管理员专属设置
            </Typography>
            <NumberInput
              source="virtualCurrency.balance"
              label="积分余额"
              helperText="当前余额将显示在列表中，修改后点击保存即可更新"
            />
            <DateInput
              source="subscription.endDate"
              label="会员到期日期"
              helperText="设置会员到期日期和时间"
            />
            <SelectInput
              source="subscription.renewalStatus"
              label="续订状态"
              choices={[
                { id: 'auto_renew', name: '正常续订' },
                { id: 'onetime', name: '单次购买' },
                { id: 'cancelled', name: '取消订阅' },
              ]}
              helperText="设置用户的续订状态"
            />
          </>
        ) : (
          <Alert severity="warning" sx={{ m: 2 }}>
            您不是超级管理员，无法编辑积分、到期日期和续订状态。当前角色：{adminInfo?.role || 'unknown'}
          </Alert>
        )}
      </SimpleForm>
    </Edit>
  );
};

export default UserEdit;

