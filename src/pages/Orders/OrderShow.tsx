import {
  Show,
  SimpleShowLayout,
  TextField,
  NumberField,
  DateField,
  Button,
  useNotify,
  useRefresh,
  useRecordContext,
} from 'react-admin';
import { Box } from '@mui/material';
import apiClient from '../../services/api';
import { formatUtils } from '../../utils/format';
import { useState } from 'react';

const RefundButton = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [loading, setLoading] = useState(false);

  // 如果 record 不存在或没有 id，不显示按钮
  if (!record || !record.id) {
    return null;
  }

  const handleRefund = async () => {
    if (!window.confirm('确定要退款吗？')) {
      return;
    }
    setLoading(true);
    try {
      await apiClient.post(`/admin/orders/${record.id}/refund`, {
        reason: '管理员操作',
      });
      notify('退款成功', { type: 'success' });
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
    <Button
      label="退款"
      onClick={handleRefund}
      disabled={loading}
      variant="contained"
      color="error"
    />
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
      <TextField source="billingCycle" label="计费周期" format={(cycle) => {
        const cycleMap: Record<string, string> = {
          'monthly': '连续包月',
          'annual': '连续包年',
          'yearly': '连续包年',
          'onetime': '单次购买',
        };
        return cycleMap[cycle] || cycle || '-';
      }} />
      <TextField source="type" label="订单类型" />
      <TextField source="status" label="状态" format={(status) => status ? formatUtils.status(status) : '-'} />
      <NumberField source="amount" label="金额" options={{ style: 'currency', currency: 'USD' }} />
      <TextField source="currency" label="货币" />
      <TextField source="paymentMethod" label="支付方式" />
      <DateField source="createdAt" label="创建时间" showTime />
      <DateField source="paidAt" label="支付时间" showTime />
      <DateField source="refundedAt" label="退款时间" showTime />
      <NumberField source="refundAmount" label="退款金额" options={{ style: 'currency', currency: 'USD' }} />
    </SimpleShowLayout>
  </Show>
);

