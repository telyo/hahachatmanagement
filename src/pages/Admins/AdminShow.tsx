import {
  Show,
  SimpleShowLayout,
  TextField,
  EmailField,
  DateField,
  TabbedShowLayout,
  Tab,
} from 'react-admin';
import { formatUtils } from '../../utils/format';

export const AdminShow = () => (
  <Show>
    <TabbedShowLayout>
      <Tab label="基本信息">
        <SimpleShowLayout>
          <TextField source="id" label="管理员ID" />
          <EmailField source="email" label="邮箱" />
          <TextField source="name" label="姓名" />
          <TextField source="role" label="角色" format={(role) => role === 'super_admin' ? '超级管理员' : '普通管理员'} />
          <TextField source="status" label="状态" format={(status) => formatUtils.status(status)} />
          <DateField source="createdAt" label="创建时间" showTime />
          <DateField source="updatedAt" label="更新时间" showTime />
          <DateField source="lastLoginAt" label="最后登录时间" showTime />
          <TextField source="lastLoginIP" label="最后登录IP" />
          <TextField source="createdBy" label="创建者" />
        </SimpleShowLayout>
      </Tab>
      <Tab label="权限信息">
        <SimpleShowLayout>
          {({ record }: any) => (
            <div>
              <h3>权限列表</h3>
              {record?.permissions && record.permissions.length > 0 ? (
                <ul>
                  {record.permissions.map((permission: string) => (
                    <li key={permission}>{permission}</li>
                  ))}
                </ul>
              ) : (
                <p>无权限</p>
              )}
            </div>
          )}
        </SimpleShowLayout>
      </Tab>
    </TabbedShowLayout>
  </Show>
);

