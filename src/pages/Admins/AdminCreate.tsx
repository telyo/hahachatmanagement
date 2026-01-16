import { Create, SimpleForm, TextInput, PasswordInput, SelectInput, CheckboxGroupInput, useNotify, useRedirect } from 'react-admin';
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

const AdminCreate = () => {
  const notify = useNotify();
  const redirect = useRedirect();

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      // 确保 role 默认为 admin（普通管理员）
      if (!data.role) {
        data.role = 'admin';
      }
      
      // 如果没有选择权限，使用空数组
      if (!data.permissions) {
        data.permissions = [];
      }

      await apiClient.post('/admin/admins', data);
      notify('管理员创建成功', { type: 'success' });
      redirect('list', 'admins');
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '创建失败';
      notify(errorMessage, { type: 'error' });
    }
  };

  return (
    <Create>
      <SimpleForm onSubmit={handleSave}>
        <TextInput source="email" label="邮箱" required />
        <PasswordInput source="password" label="密码" required helperText="至少8位字符" />
        <TextInput source="name" label="姓名" required />
        <SelectInput
          source="role"
          label="角色"
          choices={[
            { id: 'admin', name: '普通管理员' },
          ]}
          defaultValue="admin"
          disabled
          helperText="只能创建普通管理员"
        />
        <CheckboxGroupInput
          source="permissions"
          label="权限配置"
          choices={ALL_PERMISSIONS}
          optionText="name"
          optionValue="id"
        />
      </SimpleForm>
    </Create>
  );
};

export default AdminCreate;

