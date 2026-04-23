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
import { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
  Divider,
  TextField,
  MenuItem,
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

  const unreadDays = Number(data.unreadExpireDays);
  if (!Number.isNaN(unreadDays) && unreadDays >= 1 && unreadDays <= 365) {
    payload.unreadExpireDays = Math.trunc(unreadDays);
  }

  return payload;
};

function formatConstraintDate(s?: string | null) {
  if (!s?.trim()) return '不限';
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? s : d.toLocaleString('zh-CN', { hour12: false });
}

/** datetime-local 使用本地时间；转为 RFC3339（UTC Z）供后端解析 */
function datetimeLocalToRFC3339(s: string): string | undefined {
  const t = s?.trim();
  if (!t) return undefined;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function rfc3339ToDatetimeLocal(iso?: string | null): string {
  if (!iso?.trim()) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const OP_CHOICES = [
  { id: 'gt', name: '大于 (gt)' },
  { id: 'gte', name: '大于等于 (gte)' },
  { id: 'lt', name: '小于 (lt)' },
  { id: 'lte', name: '小于等于 (lte)' },
  { id: 'eq', name: '等于 (eq)' },
];

function ConstraintSummary({ constraints }: { constraints: any }) {
  const parts: string[] = [];
  if (constraints?.registerTimeStart || constraints?.registerTimeEnd) {
    parts.push(
      `注册时间：${formatConstraintDate(constraints?.registerTimeStart)} ~ ${formatConstraintDate(constraints?.registerTimeEnd)}`
    );
  }
  if (constraints?.totalCredits?.op && constraints?.totalCredits?.value != null && constraints?.totalCredits?.value !== '') {
    parts.push(`积分余额：${constraints.totalCredits.op} ${constraints.totalCredits.value}`);
  }
  if (constraints?.consumeInPeriod?.start || constraints?.consumeInPeriod?.end) {
    const c = constraints.consumeInPeriod;
    parts.push(
      `消耗统计：${formatConstraintDate(c.start)} ~ ${formatConstraintDate(c.end)}，${c.op || 'gt'} ${c.value ?? 0}`
    );
  }
  return (
    <Box sx={{ p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
      <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
        {parts.length ? parts.join('\n') : '未设置约束，请点击下方按钮在弹窗中配置'}
      </Typography>
    </Box>
  );
}

type DraftConstraints = {
  registerStartLocal: string;
  registerEndLocal: string;
  totalCreditsOp: string;
  totalCreditsValue: string;
  consumeStartLocal: string;
  consumeEndLocal: string;
  consumeOp: string;
  consumeValue: string;
};

function emptyDraft(): DraftConstraints {
  return {
    registerStartLocal: '',
    registerEndLocal: '',
    totalCreditsOp: 'gt',
    totalCreditsValue: '',
    consumeStartLocal: '',
    consumeEndLocal: '',
    consumeOp: 'gt',
    consumeValue: '',
  };
}

function draftFromFormConstraints(c: any): DraftConstraints {
  const tc = c?.totalCredits;
  const cp = c?.consumeInPeriod;
  return {
    registerStartLocal: rfc3339ToDatetimeLocal(c?.registerTimeStart),
    registerEndLocal: rfc3339ToDatetimeLocal(c?.registerTimeEnd),
    totalCreditsOp: tc?.op || 'gt',
    totalCreditsValue: tc?.value != null && tc?.value !== '' ? String(tc.value) : '',
    consumeStartLocal: rfc3339ToDatetimeLocal(cp?.start),
    consumeEndLocal: rfc3339ToDatetimeLocal(cp?.end),
    consumeOp: cp?.op || 'gt',
    consumeValue: cp?.value != null && cp?.value !== '' ? String(cp.value) : '',
  };
}

function TargetConstraintsFields() {
  const { watch, setValue } = useFormContext();
  const constraints = watch('targetConstraints');
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DraftConstraints>(emptyDraft);

  const openDialog = () => {
    setDraft(draftFromFormConstraints(watch('targetConstraints')));
    setOpen(true);
  };

  const applyDraftToForm = () => {
    const regStart = datetimeLocalToRFC3339(draft.registerStartLocal);
    const regEnd = datetimeLocalToRFC3339(draft.registerEndLocal);
    const consStart = datetimeLocalToRFC3339(draft.consumeStartLocal);
    const consEnd = datetimeLocalToRFC3339(draft.consumeEndLocal);

    const next: any = {};

    if (regStart) next.registerTimeStart = regStart;
    if (regEnd) next.registerTimeEnd = regEnd;

    const tcVal = draft.totalCreditsValue.trim() === '' ? NaN : Number(draft.totalCreditsValue);
    if (!Number.isNaN(tcVal) && draft.totalCreditsOp) {
      next.totalCredits = { op: draft.totalCreditsOp, value: Math.trunc(tcVal) };
    }

    const cVal = draft.consumeValue.trim() === '' ? NaN : Number(draft.consumeValue);
    const hasConsumePeriod = Boolean(
      consStart || consEnd || (!Number.isNaN(cVal) && draft.consumeValue.trim() !== '')
    );
    if (hasConsumePeriod) {
      next.consumeInPeriod = {
        start: consStart || '',
        end: consEnd || '',
        op: draft.consumeOp || 'gt',
        value: Number.isNaN(cVal) ? 0 : Math.trunc(cVal),
      };
    }

    setValue('targetConstraints', next, { shouldDirty: true, shouldTouch: true });
    setOpen(false);
  };

  const clearAllInDialog = () => {
    setDraft(emptyDraft());
  };

  return (
    <Box sx={{ mt: 1 }}>
      <ConstraintSummary constraints={constraints} />
      <Button variant="outlined" sx={{ mt: 1 }} onClick={openDialog}>
        {constraints && Object.keys(constraints).length > 0 ? '编辑约束…' : '设置约束…'}
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>筛选约束</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="subtitle2" color="primary">
              注册时间段
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="注册开始时间"
                type="datetime-local"
                value={draft.registerStartLocal}
                onChange={(e) => setDraft((d) => ({ ...d, registerStartLocal: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="注册结束时间"
                type="datetime-local"
                value={draft.registerEndLocal}
                onChange={(e) => setDraft((d) => ({ ...d, registerEndLocal: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>

            <Divider />
            <Typography variant="subtitle2" color="primary">
              积分余额（可选）
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="比较方式"
                value={draft.totalCreditsOp}
                onChange={(e) => setDraft((d) => ({ ...d, totalCreditsOp: e.target.value }))}
                fullWidth
              >
                {OP_CHOICES.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="积分值"
                type="number"
                value={draft.totalCreditsValue}
                onChange={(e) => setDraft((d) => ({ ...d, totalCreditsValue: e.target.value }))}
                fullWidth
                inputProps={{ step: 1 }}
              />
            </Stack>

            <Divider />
            <Typography variant="subtitle2" color="primary">
              消耗统计时间段与条件
            </Typography>
            <Typography variant="caption" color="text.secondary">
              在下列时间段内统计用户积分消耗，再按比较方式与消耗值筛选
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                label="统计开始时间"
                type="datetime-local"
                value={draft.consumeStartLocal}
                onChange={(e) => setDraft((d) => ({ ...d, consumeStartLocal: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
              <TextField
                label="统计结束时间"
                type="datetime-local"
                value={draft.consumeEndLocal}
                onChange={(e) => setDraft((d) => ({ ...d, consumeEndLocal: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                select
                label="消耗比较方式"
                value={draft.consumeOp}
                onChange={(e) => setDraft((d) => ({ ...d, consumeOp: e.target.value }))}
                fullWidth
              >
                {OP_CHOICES.map((c) => (
                  <MenuItem key={c.id} value={c.id}>
                    {c.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="消耗值（时段内）"
                type="number"
                value={draft.consumeValue}
                onChange={(e) => setDraft((d) => ({ ...d, consumeValue: e.target.value }))}
                fullWidth
                inputProps={{ step: 1 }}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={clearAllInDialog} color="warning">
            清空表单
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button onClick={() => setOpen(false)}>取消</Button>
          <Button variant="contained" onClick={applyDraftToForm}>
            保存到表单
          </Button>
        </DialogActions>
      </Dialog>
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
              {constraintsEnabled && <TargetConstraintsFields />}
            </Box>
          );
        }}
      </FormDataConsumer>

      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" sx={{ mb: 1 }}>
        未读过期
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
        仅未读消息在到达期限后对用户隐藏；用户打开后（已读）将一直保留，直至用户或后台删除。不传时服务端默认 7 天。
      </Typography>
      <NumberInput
        source="unreadExpireDays"
        label="未读可见天数"
        defaultValue={7}
        min={1}
        max={365}
        helperText="1–365，默认 7"
      />

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
