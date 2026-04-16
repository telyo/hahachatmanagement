import { List, Datagrid, TextField, ShowButton, Filter, TextInput, SelectInput, FunctionField } from 'react-admin';
import { formatUtils } from '../../utils/format';
import { Tooltip, Typography } from '@mui/material';

const shortId = (value: any) => {
  const s = String(value ?? '');
  if (!s) return '-';
  if (s.length <= 8) return s;
  return `${s.slice(0, 8)}…`;
};

const OrderFilter = (props: any) => (
  <Filter {...props}>
    <TextInput source="search" label="搜索订单ID或用户邮箱" alwaysOn />
    <SelectInput
      source="status"
      label="订单状态"
      choices={[
        { id: 'pending', name: '待处理' },
        { id: 'paid', name: '已支付' },
        { id: 'failed', name: '失败' },
        { id: 'refunded', name: '已退款' },
        { id: 'partially_refunded', name: '部分退款' },
      ]}
    />
    <SelectInput
      source="paymentProvider"
      label="订单来源"
      choices={[
        { id: 'airwallex', name: 'Airwallex' },
        { id: 'apple', name: 'Apple' },
        { id: 'googleplay', name: 'Google Play' },
      ]}
    />
  </Filter>
);

export const OrderList = () => (
  <List filters={<OrderFilter />}>
    <Datagrid rowClick="show">
      <FunctionField
        label="订单ID"
        render={(record: any) => {
          const full = record?.id || record?.orderId;
          return (
            <Tooltip title={String(full ?? '')} arrow placement="top">
              <Typography component="span" sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                {shortId(full)}
              </Typography>
            </Tooltip>
          );
        }}
      />
      <FunctionField
        label="用户ID"
        render={(record: any) => {
          const full = record?.userId;
          return (
            <Tooltip title={String(full ?? '')} arrow placement="top">
              <Typography component="span" sx={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace' }}>
                {shortId(full)}
              </Typography>
            </Tooltip>
          );
        }}
      />
      <TextField source="user.email" label="用户邮箱" />
      <TextField source="type" label="订单类型" />
      <TextField source="status" label="状态" format={(status) => formatUtils.status(status)} />
      <TextField source="paymentProvider" label="来源" />
      <FunctionField
        label="金额"
        render={(record: any) => formatUtils.currency(Number(record?.amount || 0), record?.currency || 'USD')}
      />
      <TextField source="currency" label="货币" />
      <FunctionField
        label="创建时间"
        render={(record: any) => formatUtils.dateInTimeZone(record?.createdAt)}
      />
      <ShowButton />
    </Datagrid>
  </List>
);

