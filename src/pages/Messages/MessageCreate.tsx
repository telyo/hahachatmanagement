import {
  Create,
  SimpleForm,
  TextInput,
  SelectInput,
  BooleanInput,
  NumberInput,
  useNotify,
  FormDataConsumer,
} from 'react-admin';
import { useMemo, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Divider,
} from '@mui/material';
import apiClient from '../../services/api';
import { useFormContext } from 'react-hook-form';

const transformPayload = (data: any) => {
  const userIds = (data.userIds || '')
    .split(',')
    .map((v: string) => v.trim())
    .filter(Boolean);
  const emails = (data.emails || '')
    .split(',')
    .map((v: string) => v.trim())
    .filter(Boolean);

  const hasConstraints = Boolean(data?.targetConstraintsEnabled);
  const targetConstraints = data?.targetConstraints || {};

  const payload: any = {
    title: data.title,
    content: data.content,
    imageUrl: data.imageUrl || '',
    targetType: data.targetType,
    sendNow: true,
  };

  if (hasConstraints) {
    payload.targetType = 'filter';
    payload.target = targetConstraints;
  } else if (data.targetType === 'specific') {
    payload.target = {
      userIds,
      emails,
    };
  }

  if (data.giftEnabled) {
    payload.giftPayload = {
      giftType: data.giftType || 'welfare',
      credits: Number(data.giftCredits || 0),
      description: data.giftDescription || '',
    };
  }

  return payload;
};

function ConstraintSummary({ constraints }: { constraints: any }) {
  const parts: string[] = [];
  if (constraints?.registerTimeStart || constraints?.registerTimeEnd) {
    parts.push(`注册时间：${constraints?.registerTimeStart || '不限'} ~ ${constraints?.registerTimeEnd || '不限'}`);
  }
  if (constraints?.totalCredits?.op && constraints?.totalCredits?.value != null) {
    parts.push(`积分余额：${constraints.totalCredits.op} ${constraints.totalCredits.value}`);
  }
  if (constraints?.consumeInPeriod?.start || constraints?.consumeInPeriod?.end) {
    const c = constraints.consumeInPeriod;
    parts.push(`消耗积分：${c.start || '不限'} ~ ${c.end || '不限'}，${c.op || 'gt'} ${c.value ?? 0}`);
  }
  return (
    <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
      <Typography variant="body2" color="text.secondary">
        {parts.length ? parts.join('；') : '未设置约束'}
      </Typography>
    </Box>
  );
}

function ImageUploadField() {
  const notify = useNotify();
  const { setValue, watch } = useFormContext();
  const [imageUploading, setImageUploading] = useState(false);
  const imageUrl = watch('imageUrl') || '';

  const handleUploadImage = async (file: File) => {
    setImageUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const resp = await apiClient.post('/upload', form);
      const url = resp.data?.data?.url as string | undefined;
      if (!url) throw new Error('上传失败：未返回 url');
      setValue('imageUrl', url, { shouldDirty: true, shouldTouch: true });
      notify('图片已上传', { type: 'success' });
    } catch (e: any) {
      notify(e?.message || '图片上传失败', { type: 'error' });
    } finally {
      setImageUploading(false);
    }
  };

  return (
    <Box sx={{ mt: 1 }}>
      <Box sx={{ mt: 1 }}>
        <Typography variant="subtitle2" sx={{ mb: 1 }}>
          图片（可选）
        </Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Button component="label" variant="outlined" disabled={imageUploading}>
            {imageUploading ? '上传中…' : '上传图片到 R2'}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleUploadImage(f);
                e.target.value = '';
              }}
            />
          </Button>
          {imageUrl ? (
            <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
              {imageUrl}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary">
              未上传
            </Typography>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

export const MessageCreate = () => (
  <Create transform={transformPayload}>
    <SimpleForm>
      <TextInput source="title" label="标题" required fullWidth />
      <TextInput source="content" label="内容" required multiline fullWidth />

      <ImageUploadField />
      <TextInput source="imageUrl" sx={{ display: 'none' }} />

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        发送范围
      </Typography>

      <BooleanInput source="targetConstraintsEnabled" label="启用约束（启用后隐藏指定用户/邮箱）" />

      <FormDataConsumer>
        {({ formData, ...rest }) => {
          const constraintsEnabled = Boolean(formData?.targetConstraintsEnabled);
          return (
            <Box>
              <SelectInput
                source="targetType"
                label="范围"
                defaultValue="all"
                choices={[
                  { id: 'all', name: '全量用户' },
                  { id: 'specific', name: '指定用户/邮箱' },
                ]}
                disabled={constraintsEnabled}
                {...rest}
              />
              {!constraintsEnabled && formData?.targetType === 'specific' && (
                <Box>
                  <TextInput source="userIds" label="指定用户ID（逗号分隔）" fullWidth />
                  <TextInput source="emails" label="指定邮箱（逗号分隔）" fullWidth />
                </Box>
              )}
              {constraintsEnabled && (
                <Box sx={{ mt: 1 }}>
                  <TextInput source="targetConstraints.registerTimeStart" label="注册开始时间（RFC3339/或 datetime-local）" fullWidth />
                  <TextInput source="targetConstraints.registerTimeEnd" label="注册结束时间（RFC3339/或 datetime-local）" fullWidth />
                  <TextInput source="targetConstraints.totalCredits.op" label="积分余额 op（gt/gte/lt/lte/eq）" fullWidth />
                  <NumberInput source="targetConstraints.totalCredits.value" label="积分余额值" />
                  <TextInput source="targetConstraints.consumeInPeriod.start" label="消耗统计开始时间" fullWidth />
                  <TextInput source="targetConstraints.consumeInPeriod.end" label="消耗统计结束时间" fullWidth />
                  <TextInput source="targetConstraints.consumeInPeriod.op" label="消耗 op（gt/gte/lt/lte/eq）" fullWidth />
                  <NumberInput source="targetConstraints.consumeInPeriod.value" label="消耗值" />
                  <ConstraintSummary constraints={formData?.targetConstraints} />
                </Box>
              )}
            </Box>
          );
        }}
      </FormDataConsumer>

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        礼包（可选）
      </Typography>
      <BooleanInput source="giftEnabled" label="添加礼包" />
      <FormDataConsumer>
        {({ formData, ...rest }) =>
          formData?.giftEnabled ? (
            <Box>
              <SelectInput
                source="giftType"
                label="礼包类型"
                defaultValue="welfare"
                choices={[
                  { id: 'welfare', name: '福利' },
                  { id: 'compensation', name: '补偿' },
                ]}
                {...rest}
              />
              <NumberInput source="giftCredits" label="礼包积分" />
              <TextInput source="giftDescription" label="礼包说明" fullWidth />
            </Box>
          ) : null
        }
      </FormDataConsumer>
    </SimpleForm>
  </Create>
);
