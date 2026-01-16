import {
  Show,
  SimpleShowLayout,
  TextField,
  DateField,
  Edit,
  SimpleForm,
  SelectInput,
  TextInput,
  useNotify,
  useRefresh,
} from 'react-admin';
import { formatUtils } from '../../utils/format';
import apiClient from '../../services/api';

const FeedbackShow = () => {
  const notify = useNotify();
  const refresh = useRefresh();

  const handleUpdate = async (data: any) => {
    try {
      await apiClient.put(`/admin/feedback/${data.id}`, {
        status: data.status,
        adminReply: data.adminReply,
      });
      notify('反馈更新成功', { type: 'success' });
      refresh();
    } catch (error: any) {
      notify(error.response?.data?.message || '更新失败', { type: 'error' });
    }
  };

  return (
    <Show>
      <SimpleShowLayout>
        <TextField source="id" label="反馈ID" />
        <TextField source="userId" label="用户ID" />
        <TextField source="type" label="类型" />
        <TextField source="category" label="分类" />
        <TextField source="title" label="标题" />
        <TextField source="content" label="内容" />
        <TextField source="status" label="状态" format={(status) => formatUtils.status(status)} />
        <TextField source="adminReply" label="管理员回复" />
        <DateField source="createdAt" label="创建时间" showTime />
        <DateField source="updatedAt" label="更新时间" showTime />
        <DateField source="repliedAt" label="回复时间" showTime />
      </SimpleShowLayout>
    </Show>
  );
};

export default FeedbackShow;

