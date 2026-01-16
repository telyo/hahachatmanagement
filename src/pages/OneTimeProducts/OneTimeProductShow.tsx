import {
  Show,
  SimpleShowLayout,
  TextField,
  NumberField,
  BooleanField,
  DateField,
} from 'react-admin';
import { formatUtils } from '../../utils/format';

export const OneTimeProductShow = () => (
  <Show>
    <SimpleShowLayout>
      <TextField source="productId" label="产品ID" />
      <TextField source="name" label="内部名称" />
      <TextField source="displayName" label="显示名称" />
      <TextField source="description" label="描述" />
      <NumberField source="price" label="价格" options={{ style: 'currency', currency: 'USD' }} />
      <TextField source="currency" label="货币" />
      <NumberField source="credits" label="积分" />
      <BooleanField source="isPopular" label="推荐" />
      <TextField source="status" label="状态" format={(status) => formatUtils.status(status)} />
      <NumberField source="sortOrder" label="排序" />
      <DateField source="createdAt" label="创建时间" showTime />
      <DateField source="updatedAt" label="更新时间" showTime />
    </SimpleShowLayout>
  </Show>
);
