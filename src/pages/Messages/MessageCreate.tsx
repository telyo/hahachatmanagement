import {
  Create,
  SimpleForm,
  TextInput,
  SelectInput,
  NumberInput,
} from 'react-admin';

const transformPayload = (data: any) => {
  const userIds = (data.userIds || '')
    .split(',')
    .map((v: string) => v.trim())
    .filter(Boolean);
  const emails = (data.emails || '')
    .split(',')
    .map((v: string) => v.trim())
    .filter(Boolean);

  const payload: any = {
    title: data.title,
    content: data.content,
    imageUrl: data.imageUrl || '',
    messageType: data.messageType,
    targetType: data.targetType,
    sendNow: true,
  };

  if (data.targetType === 'specific') {
    payload.target = {
      userIds,
      emails,
    };
  }

  if (data.messageType === 'gift') {
    payload.giftPayload = {
      giftId: data.giftId,
      giftType: data.giftType || 'welfare',
      credits: Number(data.giftCredits || 0),
      description: data.giftDescription || '',
    };
  }

  return payload;
};

export const MessageCreate = () => (
  <Create transform={transformPayload}>
    <SimpleForm>
      <TextInput source="title" label="标题" required fullWidth />
      <TextInput source="content" label="内容" required multiline fullWidth />
      <TextInput source="imageUrl" label="图片链接（可选）" fullWidth />
      <SelectInput
        source="messageType"
        label="消息类型"
        defaultValue="text"
        choices={[
          { id: 'text', name: '文案' },
          { id: 'image', name: '图片' },
          { id: 'gift', name: '礼包' },
        ]}
        required
      />
      <SelectInput
        source="targetType"
        label="发送范围"
        defaultValue="all"
        choices={[
          { id: 'all', name: '全量用户' },
          { id: 'filter', name: '筛选用户（当前版本先由后端默认逻辑处理）' },
          { id: 'specific', name: '指定用户' },
        ]}
        required
      />
      <TextInput source="userIds" label="指定用户ID（逗号分隔）" fullWidth />
      <TextInput source="emails" label="指定邮箱（逗号分隔）" fullWidth />
      <TextInput source="giftId" label="礼包ID（礼包消息必填）" fullWidth />
      <SelectInput
        source="giftType"
        label="礼包类型"
        defaultValue="welfare"
        choices={[
          { id: 'welfare', name: '福利' },
          { id: 'compensation', name: '补偿' },
        ]}
      />
      <NumberInput source="giftCredits" label="礼包积分（礼包消息必填）" />
      <TextInput source="giftDescription" label="礼包说明" fullWidth />
    </SimpleForm>
  </Create>
);
