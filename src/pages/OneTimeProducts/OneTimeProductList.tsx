import { List, Datagrid, TextField, NumberField, BooleanField, DateField, EditButton, ShowButton, CreateButton, Filter, SelectInput, Button, usePermissions } from 'react-admin';
import { formatUtils } from '../../utils/format';
import { useNotify, useRedirect } from 'react-admin';
import { hasPermission } from '../../utils/permissions';
import { authUtils } from '../../utils/auth';
import apiClient from '../../services/api';
import { ContentCopy as CopyIcon } from '@mui/icons-material';

const OneTimeProductFilter = (props: any) => (
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

export const OneTimeProductList = () => {
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const canWrite = hasPermission(permissions, 'subscriptions:write', adminInfo?.role);

  return (
    <List filters={<OneTimeProductFilter />} actions={canWrite ? <CreateButton /> : undefined}>
      <Datagrid rowClick="show">
        <TextField source="productId" label="产品ID" />
        <TextField source="displayName" label="产品名称" />
        <TextField source="description" label="描述" />
        <NumberField source="price" label="价格" options={{ style: 'currency', currency: 'USD' }} />
        <TextField source="currency" label="货币" />
        <NumberField source="credits" label="积分" />
        <BooleanField source="isPopular" label="推荐" />
        <TextField source="status" label="状态" format={(status) => formatUtils.status(status)} />
        <NumberField source="sortOrder" label="排序" />
        <DateField source="createdAt" label="创建时间" showTime />
        <ShowButton />
        {canWrite && <EditButton />}
      </Datagrid>
    </List>
  );
};
