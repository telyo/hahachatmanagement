import { List, Datagrid, TextField, EmailField, DateField, EditButton, ShowButton, Filter, SelectInput, usePermissions, FunctionField } from 'react-admin';
import { formatUtils } from '../../utils/format';
import AdminIcon from '@mui/icons-material/AdminPanelSettings';

const AdminFilter = (props: any) => (
  <Filter {...props}>
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

export const AdminList = () => {
  const { permissions } = usePermissions();
  
  // 检查是否有 admins:read 权限
  const hasPermission = permissions?.includes('admins:read') || permissions?.includes('admins:write');
  
  if (!hasPermission) {
    return <div>无权限访问此页面</div>;
  }

  return (
    <List filters={<AdminFilter />}>
      <Datagrid rowClick="show">
        <TextField source="id" label="管理员ID" />
        <EmailField source="email" label="邮箱" />
        <TextField source="name" label="姓名" />
        <TextField source="role" label="角色" format={(role) => role === 'super_admin' ? '超级管理员' : '普通管理员'} />
        <TextField source="status" label="状态" format={(status) => formatUtils.status(status)} />
        <DateField source="createdAt" label="创建时间" showTime />
        <DateField source="lastLoginAt" label="最后登录" showTime />
        <ShowButton />
        <FunctionField
          label="操作"
          render={(record: any) => {
            // 超级管理员不可编辑
            if (record?.role === 'super_admin') {
              return null;
            }
            return <EditButton record={record} />;
          }}
        />
      </Datagrid>
    </List>
  );
};

