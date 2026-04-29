import { List, Datagrid, TextField, EmailField, DateField, EditButton, ShowButton, Filter, TextInput, SelectInput, usePermissions, FunctionField } from 'react-admin';
import { formatUtils } from '../../utils/format';
import { hasPermission } from '../../utils/permissions';
import { authUtils } from '../../utils/auth';

const UserFilter = (props: any) => (
  <Filter {...props}>
    <TextInput source="search" label="搜索" alwaysOn />
    <SelectInput
      source="status"
      label="状态"
      choices={[
        { id: 'active', name: '活跃' },
        { id: 'inactive', name: '未激活' },
        { id: 'suspended', name: '已暂停' },
      ]}
    />
  </Filter>
);

// 格式化续订状态
const formatRenewalStatus = (status?: string) => {
  if (!status) return '未设置';
  const statusMap: Record<string, string> = {
    'auto_renew': '正常续订',
    'onetime': '单次购买',
    'cancelled': '取消订阅',
  };
  return statusMap[status] || status;
};

export const UserList = () => {
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const canWrite = hasPermission(permissions, 'users:write', adminInfo?.role);

  return (
    <List filters={<UserFilter />}>
        <Datagrid rowClick="show" bulkActionButtons={false}>
        <TextField source="id" label="用户ID" />
        <EmailField source="email" label="邮箱" />
        <TextField source="phone" label="手机号" />
        <TextField source="status" label="状态" format={(status: string) => formatUtils.status(status)} />
        <FunctionField
          label="积分"
          render={(record: any) => {
            return record.virtualCurrency?.totalBalance ?? 0;
          }}
        />
        <FunctionField
          label="会员到期时间"
          render={(record: any) => {
            const endDate = record?.subscription?.endDate || record?.subscription?.expiresAt;
            if (!endDate) {
              return '未订阅';
            }
            try {
              return new Date(endDate).toLocaleString('zh-CN');
            } catch (e) {
              return String(endDate);
            }
          }}
        />
        <FunctionField
          label="续订状态"
          render={(record: any) => {
            return formatRenewalStatus(record?.subscription?.renewalStatus);
          }}
        />
        <FunctionField
          label="首次登录平台"
          render={(record: any) => formatUtils.firstLoginPlatform(record?.firstLoginPlatform)}
        />
        <DateField source="createdAt" label="注册时间" showTime />
        <ShowButton />
        {canWrite && <EditButton />}
      </Datagrid>
    </List>
  );
};

