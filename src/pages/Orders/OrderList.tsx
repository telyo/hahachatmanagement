import { List, Datagrid, TextField, NumberField, ShowButton, Filter, TextInput, SelectInput, FunctionField } from 'react-admin';
import { formatUtils } from '../../utils/format';

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
  </Filter>
);

export const OrderList = () => (
  <List filters={<OrderFilter />}>
    <Datagrid rowClick="show">
      <TextField source="id" label="订单ID" />
      <TextField source="userId" label="用户ID" />
      <TextField source="type" label="订单类型" />
      <TextField source="status" label="状态" format={(status) => formatUtils.status(status)} />
      <NumberField source="amount" label="金额" options={{ style: 'currency', currency: 'USD' }} />
      <TextField source="currency" label="货币" />
      <FunctionField
        label="创建时间"
        render={(record: any) => formatUtils.dateInTimeZone(record?.createdAt)}
      />
      <ShowButton />
    </Datagrid>
  </List>
);

