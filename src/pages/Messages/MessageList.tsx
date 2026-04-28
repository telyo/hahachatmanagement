import {
  List,
  Datagrid,
  TextField,
  DateField,
  FunctionField,
  Filter,
  TextInput,
  SelectInput,
  ShowButton,
  EditButton,
} from 'react-admin';

const MessageFilter = (props: any) => (
  <Filter {...props}>
    <TextInput source="title" label="标题" alwaysOn />
    <SelectInput
      source="messageType"
      label="消息类型"
      choices={[
        { id: 'text', name: '文案' },
        { id: 'image', name: '图片' },
        { id: 'gift', name: '礼包' },
      ]}
    />
    <SelectInput
      source="targetType"
      label="发送范围"
      choices={[
        { id: 'all', name: '全量用户' },
        { id: 'filter', name: '筛选用户' },
        { id: 'specific', name: '指定用户' },
      ]}
    />
  </Filter>
);

export const MessageList = () => (
  <List filters={<MessageFilter />}>
    <Datagrid rowClick="show">
      <TextField source="messageId" label="消息ID" />
      <TextField source="title" label="标题" />
      <TextField source="messageType" label="类型" />
      <TextField source="targetType" label="范围" />
      <FunctionField label="命中人数" render={(record: any) => record?.targetCount ?? 0} />
      <FunctionField label="阅读数" render={(record: any) => record?.readCount ?? 0} />
      <TextField source="status" label="状态" />
      <DateField source="createdAt" label="创建时间" showTime />
      <EditButton />
      <ShowButton />
    </Datagrid>
  </List>
);
