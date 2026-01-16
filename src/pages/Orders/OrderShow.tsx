import {
  Show,
  SimpleShowLayout,
  TextField,
  NumberField,
  DateField,
  Button,
  useNotify,
  useRefresh,
} from 'react-admin';
import { Box } from '@mui/material';
import apiClient from '../../services/api';
import { formatUtils } from '../../utils/format';
import { useState } from 'react';

const RefundButton = ({ record }: any) => {
  const notify = useNotify();
  const refresh = useRefresh();
  const [loading, setLoading] = useState(false);

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

  if (record.status === 'refunded' || record.status === 'partially_refunded') {
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
      <TextField source="type" label="订单类型" />
      <TextField source="status" label="状态" format={(status) => formatUtils.status(status)} />
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

