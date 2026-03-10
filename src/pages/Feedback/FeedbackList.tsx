import { useState } from 'react';
import {
  List,
  Datagrid,
  TextField,
  DateField,
  ShowButton,
  Filter,
  TextInput,
  SelectInput,
  useUpdate,
  useNotify,
  FunctionField,
  useRecordContext,
} from 'react-admin';
import { MenuItem, Select, FormControl, InputLabel, Box, IconButton } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { formatUtils } from '../../utils/format';

const TYPE_LABELS: Record<string, string> = {
  suggestion: '建议',
  bug: 'Bug',
  complaint: '投诉',
};

const FeedbackFilter = (props: any) => (
  <Filter {...props}>
    <TextInput source="search" label="搜索标题或内容" alwaysOn />
    <SelectInput
      source="type"
      label="类型"
      choices={[
        { id: 'suggestion', name: '建议' },
        { id: 'bug', name: 'Bug' },
        { id: 'complaint', name: '投诉' },
      ]}
    />
    <SelectInput
      source="status"
      label="状态"
      choices={[
        { id: 'pending', name: '待处理' },
        { id: 'processing', name: '进行中' },
        { id: 'resolved', name: '已处理' },
        { id: 'closed', name: '忽略' },
      ]}
    />
  </Filter>
);

function ContentCollapseField() {
  const record = useRecordContext();
  const [open, setOpen] = useState(false);
  const content = record?.content ?? '';
  const maxLen = 80;
  const truncated = content.length <= maxLen ? content : content.slice(0, maxLen) + '…';
  return (
    <Box sx={{ maxWidth: 320 }}>
      <Box component="span" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {open ? content : truncated}
      </Box>
      {content.length > maxLen && (
        <IconButton size="small" onClick={() => setOpen(!open)} aria-label={open ? '收起' : '展开'}>
          {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      )}
    </Box>
  );
}

function DeviceInfoField() {
  const record = useRecordContext();
  if (!record) return null;
  const parts = [
    record.deviceType,
    record.deviceModel,
    record.osVersion,
  ].filter(Boolean);
  return <span>{parts.length ? parts.join(' / ') : '—'}</span>;
}

function StatusEditField() {
  const record = useRecordContext();
  const [update, { isLoading }] = useUpdate();
  const notify = useNotify();

  if (!record?.id) return null;

  const handleChange = async (event: any) => {
    const newStatus = event.target.value;
    try {
      await update(
        'feedback',
        { id: record.id, data: { status: newStatus }, previousData: record }
      );
      notify('状态已更新', { type: 'success' });
    } catch (e: any) {
      notify(e?.message || '更新失败', { type: 'error' });
    }
  };

  return (
    <Box onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
      <FormControl size="small" sx={{ minWidth: 120 }} disabled={isLoading}>
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
    </Box>
  );
}

export const FeedbackList = () => (
  <List filters={<FeedbackFilter />}>
    <Datagrid rowClick="show">
      <FunctionField
        source="type"
        label="类型"
        render={(r: any) => TYPE_LABELS[r?.type] ?? r?.type ?? '—'}
      />
      <TextField source="title" label="标题" />
      <FunctionField label="内容" render={() => <ContentCollapseField />} />
      <FunctionField label="设备信息" render={() => <DeviceInfoField />} />
      <TextField source="appVersion" label="版本信息" emptyText="—" />
      <DateField source="createdAt" label="创建时间" showTime />
      <FunctionField label="状态" render={() => <StatusEditField />} />
      <ShowButton />
    </Datagrid>
  </List>
);
