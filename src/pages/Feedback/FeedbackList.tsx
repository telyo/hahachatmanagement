import { List, Datagrid, TextField, DateField, ShowButton, Filter, TextInput, SelectInput } from 'react-admin';
import { formatUtils } from '../../utils/format';

const FeedbackFilter = (props: any) => (
  <Filter {...props}>
    <TextInput source="search" label="搜索标题或内容" alwaysOn />
    <SelectInput
      source="type"
      label="类型"
      choices={[
        { id: 'bug', name: 'Bug' },
        { id: 'feature', name: '功能建议' },
        { id: 'complaint', name: '投诉' },
        { id: 'other', name: '其他' },
      ]}
    />
    <SelectInput
      source="status"
      label="状态"
      choices={[
        { id: 'pending', name: '待处理' },
        { id: 'processing', name: '处理中' },
        { id: 'resolved', name: '已解决' },
        { id: 'closed', name: '已关闭' },
      ]}
    />
  </Filter>
);

export const FeedbackList = () => (
  <List filters={<FeedbackFilter />}>
    <Datagrid rowClick="show">
      <TextField source="id" label="反馈ID" />
      <TextField source="userId" label="用户ID" />
      <TextField source="type" label="类型" />
      <TextField source="title" label="标题" />
      <TextField source="status" label="状态" format={(status) => formatUtils.status(status)} />
      <DateField source="createdAt" label="创建时间" showTime />
      <ShowButton />
    </Datagrid>
  </List>
);

