import {
  Show,
  SimpleShowLayout,
  TextField,
  NumberField,
  DateField,
  FunctionField,
} from 'react-admin';

export const MessageShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="messageId" label="消息ID" />
      <TextField source="title" label="标题" />
      <TextField source="content" label="内容" />
      <TextField source="messageType" label="类型" />
      <FunctionField
        label="礼包"
        render={(record: any) => {
          const g = record?.giftPayload;
          if (!g || typeof g !== 'object') {
            return record?.messageType === 'gift' ? '（无礼包数据，请检查模板）' : '—';
          }
          const credits = g.credits ?? g.Credits;
          const desc = (g.description ?? g.Description ?? '') as string;
          const giftId = (g.giftId ?? g.GiftID ?? '') as string;
          const giftType = (g.giftType ?? g.GiftType ?? '') as string;
          return (
            <span style={{ whiteSpace: 'pre-wrap' }}>
              {giftId ? `礼包ID：${giftId}\n` : ''}
              {giftType ? `类型：${giftType}\n` : ''}
              {`积分：${credits ?? '—'}\n`}
              {`说明：${desc.trim() ? desc : '—'}`}
            </span>
          );
        }}
      />
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
