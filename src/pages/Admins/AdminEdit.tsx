import { Edit, SimpleForm, TextInput, SelectInput, CheckboxGroupInput, useNotify, useRedirect, usePermissions, useRecordContext } from 'react-admin';
import { Alert } from '@mui/material';
import apiClient from '../../services/api';

// 权限分组定义（与后端保持一致）
const PERMISSION_GROUPS = [
  {
    group: '仪表盘',
    permissions: [
      { id: 'dashboard:read', name: '查看仪表盘' },
    ],
  },
  {
    group: '用户管理',
    permissions: [
      { id: 'users:read', name: '查看用户' },
      { id: 'users:write', name: '编辑用户' },
    ],
  },
  {
    group: '订单管理',
    permissions: [
      { id: 'orders:read', name: '查看订单' },
      { id: 'orders:write', name: '更新订单状态' },
      { id: 'orders:refund', name: '处理退款' },
    ],
  },
  {
    group: '订阅套餐管理',
    permissions: [
      { id: 'subscriptions:read', name: '查看套餐' },
      { id: 'subscriptions:write', name: '编辑套餐' },
    ],
  },
  {
    group: 'AI 模型管理',
    permissions: [
      { id: 'ai_models:read', name: '查看模型' },
      { id: 'ai_models:write', name: '编辑模型' },
      { id: 'ai_models:import_export', name: '导入/导出模型' },
    ],
  },
  {
    group: 'AI 使用统计',
    permissions: [
      { id: 'ai_usage:read', name: '查看使用统计' },
    ],
  },
  {
    group: '反馈管理',
    permissions: [
      { id: 'feedback:read', name: '查看反馈' },
      { id: 'feedback:write', name: '处理反馈' },
    ],
  },
  {
    group: '操作日志',
    permissions: [
      { id: 'audit_logs:read', name: '查看操作日志' },
    ],
  },
  {
    group: '数据统计',
    permissions: [
      { id: 'statistics:read', name: '查看统计数据' },
    ],
  },
];

// 所有权限选项（扁平化）
const ALL_PERMISSIONS = PERMISSION_GROUPS.flatMap(group => group.permissions);

const AdminEdit = () => {
  const notify = useNotify();
  const redirect = useRedirect();
  const { permissions } = usePermissions();
  const record = useRecordContext();

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      // 如果没有选择权限，使用空数组
      if (!data.permissions) {
        data.permissions = [];
      }

      await apiClient.put(`/admin/admins/${data.id}`, data);
      notify('管理员更新成功', { type: 'success' });
      redirect('list', 'admins');
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '更新失败';
      notify(errorMessage, { type: 'error' });
    }
  };

  const hasWritePermission = permissions?.includes('admins:write');

  if (!hasWritePermission) {
    return <div>无权限编辑管理员</div>;
  }

  // 检查是否是超级管理员
  const isSuperAdmin = record?.role === 'super_admin';

  if (isSuperAdmin) {
    return (
      <Edit>
        <SimpleForm>
          <Alert severity="warning" sx={{ mb: 2 }}>
            超级管理员不可被编辑
          </Alert>
          <TextInput source="id" disabled label="管理员ID" />
          <TextInput source="email" disabled label="邮箱" />
          <TextInput source="name" disabled label="姓名" />
          <SelectInput
            source="role"
            label="角色"
            choices={[
              { id: 'super_admin', name: '超级管理员' },
              { id: 'admin', name: '普通管理员' },
            ]}
            disabled
          />
          <SelectInput
            source="status"
            label="状态"
            choices={[
              { id: 'active', name: '活跃' },
              { id: 'inactive', name: '未激活' },
              { id: 'suspended', name: '已暂停' },
            ]}
            disabled
          />
        </SimpleForm>
      </Edit>
    );
  }

  return (
    <Edit>
      <SimpleForm onSubmit={handleSave}>
        <TextInput source="id" disabled label="管理员ID" />
        <TextInput source="email" disabled label="邮箱" />
        <TextInput source="name" label="姓名" />
        <SelectInput
          source="role"
          label="角色"
          choices={[
            { id: 'super_admin', name: '超级管理员' },
            { id: 'admin', name: '普通管理员' },
          ]}
          disabled
          helperText="角色不能修改"
        />
        <SelectInput
          source="status"
          label="状态"
          choices={[
            { id: 'active', name: '活跃' },
            { id: 'inactive', name: '未激活' },
            { id: 'suspended', name: '已暂停' },
          ]}
        />
        <CheckboxGroupInput
          source="permissions"
          label="权限配置"
          choices={ALL_PERMISSIONS}
          optionText="name"
          optionValue="id"
        />
      </SimpleForm>
    </Edit>
  );
};

export default AdminEdit;

