import { Edit, SimpleForm, TextInput, NumberInput, SelectInput, BooleanInput, useRecordContext, FormDataConsumer } from 'react-admin';
import { Box, Typography, Divider, Alert } from '@mui/material';
import { ImageUploadField } from './MessageCreate';

const transformUpdate = (data: any) => {
  const base: any = {
    title: data.title,
    content: data.content,
    imageUrl: data.imageUrl || '',
    giftEnabled: Boolean(data.giftEnabled),
  };

  if (data.giftEnabled) {
    const giftPayload: Record<string, unknown> = {
      giftType: data.giftType || 'welfare',
      credits: Number(data.giftCredits || 0),
      description: data.giftDescription || '',
    };
    const giftCreditDays = Number(data.giftCreditExpireDays);
    if (!Number.isNaN(giftCreditDays) && giftCreditDays >= 1 && giftCreditDays <= 365) {
      giftPayload.creditExpireDays = Math.trunc(giftCreditDays);
    }
    base.giftPayload = giftPayload;
  } else {
    base.giftPayload = null;
  }

  const unreadDays = Number(data.unreadExpireDays);
  if (!Number.isNaN(unreadDays) && unreadDays >= 1 && unreadDays <= 365) {
    base.unreadExpireDays = Math.trunc(unreadDays);
  }

  return base;
};

function buildEditDefaults(record: any) {
  if (!record) {
    return {};
  }
  const gift = record.giftPayload;
  return {
    messageId: record.messageId || record.id,
    title: record.title,
    content: record.content,
    imageUrl: record.imageUrl || '',
    targetType: record.targetType,
    giftEnabled: record.messageType === 'gift' || Boolean(gift),
    giftType: gift?.giftType || gift?.GiftType || 'welfare',
    giftCredits: gift?.credits ?? gift?.Credits,
    giftCreditExpireDays:
      gift?.creditExpireDays ?? gift?.CreditExpireDays ?? 7,
    giftDescription: gift?.description ?? gift?.Description ?? '',
    unreadExpireDays: record.unreadExpireDays ?? 7,
  };
}

const MessageEditForm = () => {
  const record = useRecordContext();
  if (!record) {
    return null;
  }
  return (
    <SimpleForm
      key={(record as any).messageId || (record as any).id}
      defaultValues={buildEditDefaults(record)}
    >
      <Alert severity="info" sx={{ mb: 2 }}>
        此操作只更新消息模板主记录，不会向用户「重新发送」。已投递到用户收件箱的标题与正文不会自动变化。
      </Alert>

      <TextInput source="messageId" label="消息ID" disabled fullWidth />
      <TextFieldRo label="状态" value={(record as any).status} />
      <TextFieldRo label="发送范围" value={(record as any).targetType} />
      <TextFieldRo
        label="命中人数"
        value={String((record as any).targetCount ?? 0)}
      />

      <Divider sx={{ my: 2 }} />
      <TextInput source="title" label="标题" required fullWidth />
      <TextInput source="content" label="内容" required multiline fullWidth />

      <ImageUploadField />
      <TextInput source="imageUrl" sx={{ display: 'none' }} />

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        未读可见天数（仅对模板/统计保存；不追溯修改已发用户的过期时间）
      </Typography>
      <NumberInput
        source="unreadExpireDays"
        label="未读可见天数"
        min={1}
        max={365}
        helperText="1–365，默认 7"
      />

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        礼包
      </Typography>
      <BooleanInput source="giftEnabled" label="启用礼包" />
      <FormDataConsumer>
        {({ formData, ...rest }) =>
          formData?.giftEnabled ? (
            <Box>
              <SelectInput
                source="giftType"
                label="礼包类型"
                choices={[
                  { id: 'welfare', name: '福利' },
                  { id: 'compensation', name: '补偿' },
                ]}
                {...rest}
              />
              <NumberInput source="giftCredits" label="礼包积分" min={1} />
              <NumberInput
                source="giftCreditExpireDays"
                label="积分有效天数（领取后起算）"
                min={1}
                max={365}
                helperText="1–365，默认 7"
              />
              <TextInput source="giftDescription" label="礼包说明" fullWidth />
            </Box>
          ) : null
        }
      </FormDataConsumer>
    </SimpleForm>
  );
};

function TextFieldRo({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ mb: 1 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2">{value || '—'}</Typography>
    </Box>
  );
}

export const MessageEdit = () => (
  <Edit transform={transformUpdate} mutationMode="pessimistic">
    <MessageEditForm />
  </Edit>
);
