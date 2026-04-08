import { useCallback, useState } from 'react';
import { Show, SimpleShowLayout, TextField, DateField, FunctionField, useRecordContext, useRefresh } from 'react-admin';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField as MuiTextField } from '@mui/material';
import apiClient from '../../services/api';

const CreditsAdjuster = () => {
  const record = useRecordContext<any>();
  const refresh = useRefresh();
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState<string>('0');
  const [reason, setReason] = useState<string>('admin_adjust');
  const [loading, setLoading] = useState(false);

  const submit = useCallback(async () => {
    if (!record?.id) return;
    const n = parseInt(amount, 10);
    if (!Number.isFinite(n) || n === 0) {
      alert('调整金额不能为 0');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post(`/admin/test-accounts/${record.id}/virtual-currency/adjust`, { amount: n, reason });
      setOpen(false);
      refresh();
    } catch (e: any) {
      alert('调整失败: ' + (e?.response?.data?.error?.message || e?.message || 'unknown'));
    } finally {
      setLoading(false);
    }
  }, [record?.id, amount, reason, refresh]);

  return (
    <Box sx={{ mt: 2 }}>
      <Button variant="contained" onClick={() => setOpen(true)}>
        调整积分
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>调整测试账号积分</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            输入正数表示增加，负数表示扣减。
          </DialogContentText>
          <MuiTextField
            label="调整金额"
            type="number"
            fullWidth
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            sx={{ mb: 2 }}
          />
          <MuiTextField
            label="原因"
            fullWidth
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={loading}>
            取消
          </Button>
          <Button onClick={submit} variant="contained" disabled={loading}>
            {loading ? '提交中...' : '确认'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export const TestAccountShow = () => {
  return (
    <Show>
      <SimpleShowLayout>
        <TextField source="id" label="用户ID" />
        <TextField source="email" label="邮箱" />
        <TextField source="status" label="状态" />
        <FunctionField label="积分" render={(r: any) => r?.virtualCurrency?.totalBalance ?? 0} />
        <DateField source="createdAt" label="创建时间" showTime />
        <CreditsAdjuster />
      </SimpleShowLayout>
    </Show>
  );
};

