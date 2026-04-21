import {
  Show,
  SimpleShowLayout,
  TextField,
  NumberField,
  DateField,
} from 'react-admin';

export const MessageShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="messageId" label="消息ID" />
      <TextField source="title" label="标题" />
      <TextField source="content" label="内容" />
      <TextField source="messageType" label="类型" />
      <TextField source="targetType" label="发送范围" />
      <NumberField source="targetCount" label="命中人数" />
      <TextField source="status" label="状态" />
      <TextField source="imageUrl" label="图片链接" />
      <DateField source="sendAt" label="发送时间" showTime />
      <DateField source="createdAt" label="创建时间" showTime />
      <DateField source="updatedAt" label="更新时间" showTime />
    </SimpleShowLayout>
  </Show>
);
