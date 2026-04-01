import {
  Show,
  SimpleShowLayout,
  TextField,
  NumberField,
  DateField,
  Button,
  FunctionField,
  useNotify,
  useRefresh,
  useRecordContext,
} from 'react-admin';
import { Box, Dialog, DialogTitle, DialogContent, DialogActions, TextField as MuiTextField, Stack, Typography, Divider, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import apiClient from '../../services/api';
import { formatUtils } from '../../utils/format';
import { useState } from 'react';

type CreditItem = {
  creditId: string;
  totalAmount: number;
  remainingAmount: number;
  expiresAt: string;
  source: string;
  planId: string;
  orderId?: string;
  subscriptionId?: string;
  createdAt: string;
  isExpired?: boolean;
  isActive?: boolean;
};

const RefundButton = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reason, setReason] = useState('管理员操作');
  const [refundAmount, setRefundAmount] = useState<string>('');
  const [creditsLoading, setCreditsLoading] = useState(false);
  const [creditsBefore, setCreditsBefore] = useState<CreditItem[]>([]);
  const [creditsAfter, setCreditsAfter] = useState<CreditItem[]>([]);

  // 如果 record 不存在或没有 id，不显示按钮
  if (!record || !record.id) {
    return null;
  }

  const totalBalance = (credits: CreditItem[]) =>
    credits.reduce((sum, c) => sum + (Number.isFinite(c.remainingAmount) ? c.remainingAmount : 0), 0);

  const openDialog = async () => {
    setDialogOpen(true);
    setReason('管理员操作');
    setRefundAmount(String(record.amount ?? ''));
    setCreditsBefore([]);
    setCreditsAfter([]);

    // 拉取用户积分详情
    if (!record.userId) return;
    setCreditsLoading(true);
    try {
      const resp = await apiClient.get(`/admin/users/${record.userId}/virtual-currency/details`, {
        params: { page: 1, pageSize: 100, sortBy: 'expiresAt', order: 'DESC' },
      });
      const items: CreditItem[] = resp.data?.data?.items || [];
      setCreditsBefore(items);
      // 默认“退款后积分详情”=当前积分详情（可编辑）
      setCreditsAfter(items.map((x) => ({ ...x })));
    } catch (error: any) {
      notify(error.response?.data?.message || '获取用户积分详情失败', { type: 'error' });
    } finally {
      setCreditsLoading(false);
    }
  };

  const handleRefund = async () => {
    setLoading(true);
    try {
      const amountNum = Number(refundAmount);
      const payload: any = {
        reason: reason?.trim() || '管理员操作',
      };
      if (Number.isFinite(amountNum) && amountNum > 0) {
        payload.amount = amountNum;
      }

      await apiClient.post(`/admin/orders/${record.id}/refund`, payload);

      // 退款成功后，把积分更新成“退款后积分详情”（可编辑）
      if (record.userId && creditsAfter.length > 0) {
        const updates = creditsAfter.map((c) => ({
          creditId: c.creditId,
          remainingAmount: Math.max(0, Math.floor(Number(c.remainingAmount) || 0)),
          // 允许管理员把 expiresAt 清空表示永不过期；不想改可保持原值
          expiresAt: typeof c.expiresAt === 'string' ? c.expiresAt : '',
        }));
        await apiClient.put(`/admin/users/${record.userId}/virtual-currency/update`, { credits: updates });
      }
      notify('退款成功', { type: 'success' });
      setDialogOpen(false);
      refresh();
    } catch (error: any) {
      notify(error.response?.data?.message || '退款失败', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // 检查 status 是否存在，避免访问 undefined 的属性
  if (!record.status || record.status === 'refunded' || record.status === 'partially_refunded') {
    return null;
  }

  return (
    <>
      <Button
        label="退款"
        onClick={openDialog}
        disabled={loading}
        variant="contained"
        color="error"
      />

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="lg" fullWidth>
        <DialogTitle>订单退款</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2}>
            <Stack spacing={1}>
              <Typography variant="body2" color="text.secondary">
                订单：{record.id}（状态：{record.status ? formatUtils.status(record.status) : '-'}）
              </Typography>
              <Typography variant="body2" color="text.secondary">
                用户：{record.user?.email || record.userId}
              </Typography>
            </Stack>

            <Divider />

            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <MuiTextField
                label="退款金额（USD）"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                helperText="默认填订单金额；可改为部分退款金额"
                fullWidth
              />
              <MuiTextField
                label="退款原因"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                fullWidth
              />
            </Stack>

            <Divider />

            <Stack spacing={1}>
              <Typography variant="subtitle2">用户积分详情（当前）</Typography>
              <Typography variant="body2" color="text.secondary">
                合计（简单相加 remainingAmount）：{totalBalance(creditsBefore)}
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>creditId</TableCell>
                      <TableCell>source</TableCell>
                      <TableCell align="right">total</TableCell>
                      <TableCell align="right">remaining</TableCell>
                      <TableCell>expiresAt</TableCell>
                      <TableCell>createdAt</TableCell>
                      <TableCell>状态</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {creditsBefore.map((c) => (
                      <TableRow key={c.creditId}>
                        <TableCell>{c.creditId}</TableCell>
                        <TableCell>{c.source}</TableCell>
                        <TableCell align="right">{c.totalAmount}</TableCell>
                        <TableCell align="right">{c.remainingAmount}</TableCell>
                        <TableCell>{c.expiresAt || '-'}</TableCell>
                        <TableCell>{c.createdAt || '-'}</TableCell>
                        <TableCell>{c.isExpired ? '已过期' : c.isActive ? '可用' : '-'}</TableCell>
                      </TableRow>
                    ))}
                    {creditsLoading && (
                      <TableRow>
                        <TableCell colSpan={7}>加载中...</TableCell>
                      </TableRow>
                    )}
                    {!creditsLoading && creditsBefore.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7}>无积分项</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Stack>

            <Stack spacing={1}>
              <Typography variant="subtitle2">退款后积分详情（可编辑，退款成功后会写入）</Typography>
              <Typography variant="body2" color="text.secondary">
                合计（简单相加 remainingAmount）：{totalBalance(creditsAfter)}
              </Typography>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>creditId</TableCell>
                      <TableCell>source</TableCell>
                      <TableCell align="right">total</TableCell>
                      <TableCell align="right">remaining（可改）</TableCell>
                      <TableCell>expiresAt（可改/可清空）</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {creditsAfter.map((c, idx) => (
                      <TableRow key={c.creditId}>
                        <TableCell>{c.creditId}</TableCell>
                        <TableCell>{c.source}</TableCell>
                        <TableCell align="right">{c.totalAmount}</TableCell>
                        <TableCell align="right" sx={{ minWidth: 160 }}>
                          <MuiTextField
                            value={String(c.remainingAmount)}
                            onChange={(e) => {
                              const v = e.target.value;
                              setCreditsAfter((prev) => {
                                const next = [...prev];
                                next[idx] = { ...next[idx], remainingAmount: Number(v) };
                                return next;
                              });
                            }}
                            size="small"
                            fullWidth
                          />
                        </TableCell>
                        <TableCell sx={{ minWidth: 260 }}>
                          <MuiTextField
                            value={c.expiresAt ?? ''}
                            onChange={(e) => {
                              const v = e.target.value;
                              setCreditsAfter((prev) => {
                                const next = [...prev];
                                next[idx] = { ...next[idx], expiresAt: v };
                                return next;
                              });
                            }}
                            size="small"
                            fullWidth
                            placeholder="RFC3339 或留空"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {!creditsLoading && creditsAfter.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5}>无可编辑积分项</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Box>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button label="取消" onClick={() => setDialogOpen(false)} disabled={loading} />
          <Button label="确认退款" onClick={handleRefund} disabled={loading} variant="contained" color="error" />
        </DialogActions>
      </Dialog>
    </>
  );
};

export const OrderShow = () => (
  <Show
    actions={
      <Box sx={{ display: 'flex', gap: 1 }}>
        <RefundButton />
      </Box>
    }
  >
    <SimpleShowLayout>
      <TextField source="id" label="订单ID" />
      <TextField source="userId" label="用户ID" />
      <TextField source="user.email" label="用户邮箱" />
      <TextField source="planId" label="套餐ID" />
      <TextField source="plan.name" label="套餐名称" />
      <TextField source="pricingType" label="价格类型" />
      <TextField source="billingCycle" label="计费周期" format={(cycle: string) => {
        const cycleMap: Record<string, string> = {
          'monthly': '连续包月',
          'annual': '连续包年',
          'yearly': '连续包年',
          'onetime': '单次购买',
        };
        return cycleMap[cycle] || cycle || '-';
      }} />
      <TextField source="type" label="订单类型" />
      <TextField source="status" label="状态" format={(status: string) => status ? formatUtils.status(status) : '-'} />
      <NumberField source="amount" label="金额" options={{ style: 'currency', currency: 'USD' }} />
      <TextField source="currency" label="货币" />
      <TextField source="paymentMethod" label="支付方式" />
      <FunctionField
        label="创建时间"
        render={(record: any) => formatUtils.dateInTimeZone(record?.createdAt)}
      />
      <DateField source="paidAt" label="支付时间" showTime />
      <DateField source="refundedAt" label="退款时间" showTime />
      <NumberField source="refundAmount" label="退款金额" options={{ style: 'currency', currency: 'USD' }} />
    </SimpleShowLayout>
  </Show>
);

