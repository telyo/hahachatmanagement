import {
  List,
  Datagrid,
  TextField,
  EmailField,
  DateField,
  Filter,
  TextInput,
  FunctionField,
  EditButton,
  ShowButton,
  usePermissions,
} from 'react-admin';
import { hasPermission } from '../../utils/permissions';
import { authUtils } from '../../utils/auth';

const TestAccountFilter = (props: any) => (
  <Filter {...props}>
    <TextInput source="search" label="搜索" alwaysOn />
  </Filter>
);

export const TestAccountList = () => {
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const canWrite = hasPermission(permissions, 'users:write', adminInfo?.role);

  return (
    <List filters={<TestAccountFilter />} perPage={20}>
      <Datagrid rowClick="show">
        <TextField source="id" label="用户ID" />
        <EmailField source="email" label="邮箱" />
        <TextField source="status" label="状态" />
        <FunctionField
          label="积分"
          render={(record: any) => record?.virtualCurrency?.totalBalance ?? 0}
        />
        <DateField source="createdAt" label="创建时间" showTime />
        <ShowButton />
        {canWrite && <EditButton />}
      </Datagrid>
    </List>
  );
};

