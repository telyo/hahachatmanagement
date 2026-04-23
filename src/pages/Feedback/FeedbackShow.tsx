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
import {
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Typography,
  TextField as MuiTextField,
  Dialog,
  DialogContent,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import { useEffect, useRef, useState } from 'react';
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

function FeedbackImageAttachments() {
  const record = useRecordContext();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const raw = (record as any)?.imageUrls;
  const urls: string[] = Array.isArray(raw) ? raw.filter((u: unknown) => typeof u === 'string' && (u as string).trim() !== '') : [];
  if (urls.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );
  }
  return (
    <Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'row',
          gap: 1,
          overflowX: 'auto',
          pb: 0.5,
          alignItems: 'center',
        }}
      >
        {urls.map((url, i) => (
          <Box
            key={`${url}-${i}`}
            component="button"
            type="button"
            onClick={() => {
              setIndex(i);
              setOpen(true);
            }}
            sx={{
              border: 'none',
              padding: 0,
              margin: 0,
              cursor: 'pointer',
              borderRadius: 1,
              overflow: 'hidden',
              flexShrink: 0,
              width: 72,
              height: 72,
              background: 'transparent',
            }}
          >
            <Box
              component="img"
              src={url}
              alt=""
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </Box>
        ))}
      </Box>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
        <Box sx={{ position: 'relative', bgcolor: 'black' }}>
          <IconButton
            aria-label="关闭"
            onClick={() => setOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'white', zIndex: 1 }}
          >
            <CloseIcon />
          </IconButton>
          <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Box
              component="img"
              src={urls[index]}
              alt=""
              sx={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain' }}
            />
          </DialogContent>
        </Box>
      </Dialog>
    </Box>
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

function ConversationMessageImages({ urls }: { urls: string[] }) {
  const [open, setOpen] = useState(false);
  const [idx, setIdx] = useState(0);
  if (!urls?.length) return null;
  return (
    <>
      <Box sx={{ display: 'flex', gap: 0.5, overflowX: 'auto', mt: 0.5, pb: 0.5 }}>
        {urls.map((url, i) => (
          <Box
            key={`${url}-${i}`}
            component="button"
            type="button"
            onClick={() => {
              setIdx(i);
              setOpen(true);
            }}
            sx={{
              border: 'none',
              padding: 0,
              margin: 0,
              cursor: 'pointer',
              borderRadius: 1,
              overflow: 'hidden',
              flexShrink: 0,
              width: 48,
              height: 48,
              background: 'transparent',
            }}
          >
            <Box
              component="img"
              src={url}
              alt=""
              sx={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </Box>
        ))}
      </Box>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="lg" fullWidth>
        <Box sx={{ position: 'relative', bgcolor: 'black' }}>
          <IconButton
            aria-label="关闭"
            onClick={() => setOpen(false)}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'white', zIndex: 1 }}
          >
            <CloseIcon />
          </IconButton>
          <DialogContent sx={{ p: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            <Box
              component="img"
              src={urls[idx]}
              alt=""
              sx={{ maxWidth: '100%', maxHeight: '85vh', objectFit: 'contain' }}
            />
          </DialogContent>
        </Box>
      </Dialog>
    </>
  );
}

function FeedbackConversation() {
  const record = useRecordContext();
  const notify = useNotify();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  const [content, setContent] = useState('');
  const [pendingUrls, setPendingUrls] = useState<string[]>([]);
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

  const uploadFeedbackImage = async (file: File) => {
    setUploadingImg(true);
    try {
      const form = new FormData();
      form.append('file', file);
      form.append('purpose', 'feedback');
      const resp = await apiClient.post('/upload', form);
      const url = resp.data?.data?.url as string | undefined;
      if (url) {
        setPendingUrls((prev) => [...prev, url].slice(0, 9));
      } else {
        notify('上传失败：未返回 url', { type: 'error' });
      }
    } catch (e: any) {
      notify(e?.response?.data?.error?.message || '上传失败', { type: 'error' });
    } finally {
      setUploadingImg(false);
    }
  };

  const removePendingUrl = async (url: string) => {
    try {
      await apiClient.post('/upload/delete', { url });
    } catch {
      /* 仍从列表移除，避免卡住 */
    }
    setPendingUrls((p) => p.filter((u) => u !== url));
  };

  const sendMessage = async () => {
    const message = content.trim();
    if (!feedbackId || (!message && pendingUrls.length === 0)) return;
    setSending(true);
    try {
      await apiClient.post(`/admin/feedback/${feedbackId}/messages`, {
        content: message,
        imageUrls: pendingUrls,
      });
      setContent('');
      setPendingUrls([]);
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

  const canSend = (content.trim().length > 0 || pendingUrls.length > 0) && !sending;

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
            const msgUrls: string[] = Array.isArray(item?.imageUrls)
              ? item.imageUrls.filter((u: unknown) => typeof u === 'string' && (u as string).trim() !== '')
              : [];
            return (
              <Box key={item.messageId || `${item.createdAt}-${item.content}`} sx={{ mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary">
                  {isAdmin ? '客服' : '用户'} · {formatUtils.date(item.createdAt)}
                </Typography>
                {item.content ? <Typography variant="body2">{item.content}</Typography> : null}
                <ConversationMessageImages urls={msgUrls} />
                <Divider sx={{ mt: 1 }} />
              </Box>
            );
          })
        )}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1.5 }}>
        回复支持附图（可选，最多 9 张，与客户端一致走 feedback 目录）
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 1, mt: 0.5 }}>
        <input
          type="file"
          accept="image/*"
          hidden
          ref={fileInputRef}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void uploadFeedbackImage(f);
            e.target.value = '';
          }}
        />
        {pendingUrls.map((url) => (
          <Box key={url} sx={{ position: 'relative', width: 40, height: 40, flexShrink: 0 }}>
            <Box
              component="img"
              src={url}
              alt=""
              sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1, display: 'block' }}
            />
            <IconButton
              size="small"
              aria-label="移除"
              onClick={() => void removePendingUrl(url)}
              sx={{
                position: 'absolute',
                top: -10,
                right: -10,
                bgcolor: 'action.hover',
                width: 22,
                height: 22,
                padding: 0,
              }}
            >
              <CloseIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        ))}
        {pendingUrls.length < 9 ? (
          <IconButton
            color="primary"
            aria-label="添加图片"
            disabled={uploadingImg || sending}
            onClick={() => fileInputRef.current?.click()}
            sx={{
              width: 40,
              height: 40,
              border: '1px dashed',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            {uploadingImg ? <CircularProgress size={20} /> : <AddPhotoAlternateIcon />}
          </IconButton>
        ) : null}
      </Box>
      <Box sx={{ mt: 1.5, display: 'flex', gap: 1, alignItems: 'flex-start' }}>
        <MuiTextField
          label="回复内容"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          multiline
          minRows={2}
          fullWidth
          placeholder="仅发图时可为空"
        />
        <Button
          label={sending ? '发送中' : '发送'}
          onClick={sendMessage}
          disabled={!canSend}
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
      <FunctionField label="附图" render={() => <FeedbackImageAttachments />} />
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
