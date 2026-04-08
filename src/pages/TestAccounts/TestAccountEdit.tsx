import { Edit, SimpleForm, TextInput, SelectInput } from 'react-admin';

export const TestAccountEdit = () => {
  return (
    <Edit>
      <SimpleForm>
        <SelectInput
          source="status"
          label="状态"
          choices={[
            { id: 'active', name: 'active' },
            { id: 'inactive', name: 'inactive' },
            { id: 'suspended', name: 'suspended' },
            { id: 'pending_deletion', name: 'pending_deletion' },
          ]}
        />
        <TextInput
          source="fixedLoginCode"
          label="重置固定验证码（可选）"
          helperText="不填则不修改。"
          fullWidth
        />
      </SimpleForm>
    </Edit>
  );
};

