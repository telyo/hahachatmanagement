import {
  Button,
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
import { CircularProgress, Divider, FormControl, InputLabel, Select, MenuItem, Box, Typography, TextField as MuiTextField } from '@mui/material';
import { useEffect, useState } from 'react';
import { formatUtils } from '../../utils/format';
import apiClient from '../../services/api';

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

function FeedbackConversation() {
  const record = useRecordContext();
  const notify = useNotify();
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [content, setContent] = useState('');
  const [items, setItems] = useState<any[]>([]);

  const feedbackId = record?.id;

  const loadMessages = async () => {
    if (!feedbackId) return;
    setLoading(true);
    try {
      const resp = await apiClient.get(`/admin/feedback/${feedbackId}/messages`);
      const list = resp.data?.data?.items;
      setItems(Array.isArray(list) ? list : []);
    } catch (e: any) {
      notify(e?.response?.data?.error?.message || '加载沟通记录失败', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    const message = content.trim();
    if (!feedbackId || !message) return;
    setSending(true);
    try {
      await apiClient.post(`/admin/feedback/${feedbackId}/messages`, { content: message });
      setContent('');
      await loadMessages();
      notify('发送成功', { type: 'success' });
    } catch (e: any) {
      notify(e?.response?.data?.error?.message || '发送失败', { type: 'error' });
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feedbackId]);

  if (!feedbackId) return null;

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" sx={{ mb: 1 }}>
        沟通记录
      </Typography>
      <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1, p: 1, maxHeight: 360, overflowY: 'auto' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} />
          </Box>
        ) : items.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            暂无沟通记录
          </Typography>
        ) : (
          items.map((item) => {
            const isAdmin = item?.senderType === 'admin';
            return (
              <Box key={item.messageId || `${item.createdAt}-${item.content}`} sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {isAdmin ? '客服' : '用户'} · {formatUtils.date(item.createdAt)}
                </Typography>
                <Typography variant="body2">{item.content}</Typography>
                <Divider sx={{ mt: 1 }} />
              </Box>
            );
          })
        )}
      </Box>
      <Box sx={{ mt: 1.5, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <MuiTextField
          label="回复内容"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          multiline
          minRows={2}
          fullWidth
        />
        <Button
          label={sending ? '发送中' : '发送'}
          onClick={sendMessage}
          disabled={sending || !content.trim()}
        />
      </Box>
    </Box>
  );
}

const FeedbackShow = () => (
  <Show>
    <SimpleShowLayout>
      <FunctionField
        label="用户ID"
        render={(r: any) => r.userId ?? r.user?.userId ?? '—'}
      />
      <FunctionField
        label="用户邮箱"
        render={(r: any) => r.userEmail ?? r.user?.email ?? '—'}
      />
      <FunctionField
        label="用户手机"
        render={(r: any) => r.userPhone ?? r.user?.phone ?? '—'}
      />
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
      <FeedbackConversation />
      <DateField source="updatedAt" label="更新时间" showTime />
    </SimpleShowLayout>
  </Show>
);

export default FeedbackShow;
