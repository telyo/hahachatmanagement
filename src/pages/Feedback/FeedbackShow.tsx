import {
  Show,
  SimpleShowLayout,
  TextField,
  DateField,
  FunctionField,
  useNotify,
  useRefresh,
  useUpdate,
  useRecordContext,
} from 'react-admin';
import { FormControl, InputLabel, Select, MenuItem, Box, Typography } from '@mui/material';
import { formatUtils } from '../../utils/format';

const TYPE_LABELS: Record<string, string> = {
  suggestion: '建议',
  bug: 'Bug',
  complaint: '投诉',
};

function StatusEdit() {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [update, { isLoading }] = useUpdate();

  if (!record?.id) return null;

  const handleChange = async (event: any) => {
    const newStatus = event.target.value;
    try {
      await update('feedback', {
        id: record.id,
        data: { status: newStatus },
        previousData: record,
      });
      notify('状态已更新', { type: 'success' });
      refresh();
    } catch (e: any) {
      notify(e?.message || '更新失败', { type: 'error' });
    }
  };

  return (
    <FormControl size="small" sx={{ minWidth: 160 }} disabled={isLoading}>
      <InputLabel>状态</InputLabel>
      <Select
        value={record.status || 'pending'}
        label="状态"
        onChange={handleChange}
      >
        <MenuItem value="pending">{formatUtils.status('pending')}</MenuItem>
        <MenuItem value="processing">{formatUtils.status('processing')}</MenuItem>
        <MenuItem value="resolved">{formatUtils.status('resolved')}</MenuItem>
        <MenuItem value="closed">{formatUtils.status('closed')}</MenuItem>
      </Select>
    </FormControl>
  );
}

function DeviceInfoShow() {
  const record = useRecordContext();
  if (!record) return null;
  const parts = [
    record.deviceType && `设备类型: ${record.deviceType}`,
    record.deviceModel && `型号: ${record.deviceModel}`,
    record.osVersion && `系统: ${record.osVersion}`,
  ].filter(Boolean);
  return (
    <Typography variant="body2">
      {parts.length ? parts.join(' | ') : '—'}
    </Typography>
  );
}

const FeedbackShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField
        source="type"
        label="类型"
        format={(v: string) => TYPE_LABELS[v] ?? v ?? '—'}
      />
      <TextField source="title" label="标题" />
      <TextField source="content" label="内容" fullWidth />
      <FunctionField
        label="设备信息"
        render={() => <DeviceInfoShow />}
      />
      <TextField source="appVersion" label="版本信息" emptyText="—" />
      <DateField source="createdAt" label="创建时间" showTime />
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography variant="body2" color="text.secondary" sx={{ width: 120 }}>
          状态
        </Typography>
        <StatusEdit />
      </Box>
      <TextField source="adminReply" label="管理员回复" fullWidth />
      <DateField source="repliedAt" label="回复时间" showTime />
      <DateField source="updatedAt" label="更新时间" showTime />
    </SimpleShowLayout>
  </Show>
);

export default FeedbackShow;
