import { useState } from 'react';
import {
  List,
  Datagrid,
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
import { MenuItem, Select, FormControl, InputLabel, Box, IconButton, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { formatUtils } from '../../utils/format';

/** 列表中用户ID、设备串、版本号等：最多 8 个字符，超出省略号 */
function ellipsize8(value: string | null | undefined): string {
  if (value == null || value === '') return '—';
  const s = String(value);
  return s.length <= 8 ? s : `${s.slice(0, 8)}…`;
}

const TEXT_COL_WIDTH = 280;

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

/** 固定宽度、默认折叠为两行，可展开/收起；支持换行 */
function ExpandableTwoLineField({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const raw = text ?? '';
  const needsToggle =
    raw.includes('\n') ||
    raw.length > 72;

  return (
    <Box
      sx={{
        width: TEXT_COL_WIDTH,
        minWidth: TEXT_COL_WIDTH,
        maxWidth: TEXT_COL_WIDTH,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <Typography
        component="div"
        variant="body2"
        sx={{
          ...(open
            ? { display: 'block', overflow: 'visible' }
            : {
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }),
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {raw || '—'}
      </Typography>
      {needsToggle && (
        <IconButton
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setOpen(!open);
          }}
          aria-label={open ? '收起' : '展开'}
          aria-expanded={open}
        >
          {open ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
        </IconButton>
      )}
    </Box>
  );
}

function TitleCollapseField() {
  const record = useRecordContext();
  return <ExpandableTwoLineField text={record?.title ?? ''} />;
}

function ContentCollapseField() {
  const record = useRecordContext();
  return <ExpandableTwoLineField text={record?.content ?? ''} />;
}

function DeviceInfoField() {
  const record = useRecordContext();
  if (!record) return null;
  const parts = [
    record.deviceType,
    record.deviceModel,
    record.osVersion,
  ].filter(Boolean);
  const line = parts.length ? parts.join(' / ') : '';
  return <span title={line || undefined}>{ellipsize8(line)}</span>;
}

function UserEmailField() {
  const record = useRecordContext();
  if (!record) return null;
  const email = (record as any).userEmail ?? record.user?.email ?? '';
  const phone = (record as any).userPhone ?? record.user?.phone ?? '';
  const display = email || (phone ? `${phone}（手机）` : '');
  const titleTip = [email || null, phone || null].filter(Boolean).join(' / ') || undefined;
  return (
    <Box
      sx={{
        width: 200,
        maxWidth: 200,
        wordBreak: 'break-word',
        whiteSpace: 'normal',
      }}
      title={titleTip}
    >
      {display || '—'}
    </Box>
  );
}

function UserIdField() {
  const record = useRecordContext();
  if (!record) return null;
  const id = record.userId ?? record.user?.userId ?? '';
  return (
    <span title={id || undefined}>{ellipsize8(id)}</span>
  );
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

function AppVersionTruncField() {
  const record = useRecordContext();
  const v = record?.appVersion ?? '';
  return <span title={v || undefined}>{ellipsize8(v)}</span>;
}

export const FeedbackList = () => (
  <List filters={<FeedbackFilter />}>
    <Datagrid rowClick="show">
      <FunctionField label="用户邮箱" render={() => <UserEmailField />} />
      <FunctionField label="用户ID" render={() => <UserIdField />} />
      <FunctionField
        source="type"
        label="类型"
        render={(r: any) => TYPE_LABELS[r?.type] ?? r?.type ?? '—'}
      />
      <FunctionField label="标题" render={() => <TitleCollapseField />} />
      <FunctionField label="内容" render={() => <ContentCollapseField />} />
      <FunctionField label="设备信息" render={() => <DeviceInfoField />} />
      <FunctionField label="版本信息" render={() => <AppVersionTruncField />} />
      <DateField source="createdAt" label="创建时间" showTime />
      <FunctionField label="状态" render={() => <StatusEditField />} />
      <ShowButton />
    </Datagrid>
  </List>
);
