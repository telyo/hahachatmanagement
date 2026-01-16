import { Create, SimpleForm, TextInput, NumberInput, SelectInput, BooleanInput } from 'react-admin';

export const OneTimeProductCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" label="内部名称" required />
      <TextInput source="displayName" label="显示名称" required />
      <TextInput source="description" label="描述" multiline />
      <NumberInput source="price" label="价格" required min={0} step={0.01} />
      <TextInput source="currency" label="货币" defaultValue="USD" required />
      <NumberInput source="credits" label="积分" required min={1} />
      <BooleanInput source="isPopular" label="推荐" defaultValue={false} />
      <SelectInput
        source="status"
        label="状态"
        choices={[
          { id: 'active', name: '活跃' },
          { id: 'inactive', name: '未激活' },
        ]}
        defaultValue="active"
      />
      <NumberInput source="sortOrder" label="排序" defaultValue={0} />
    </SimpleForm>
  </Create>
);
