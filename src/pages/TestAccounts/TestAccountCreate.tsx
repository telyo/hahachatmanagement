import { Create, SimpleForm, TextInput, NumberInput, required, email } from 'react-admin';

export const TestAccountCreate = () => {
  return (
    <Create>
      <SimpleForm>
        <TextInput source="email" label="邮箱" validate={[required(), email()]} fullWidth />
        <TextInput
          source="fixedLoginCode"
          label="固定登录验证码"
          validate={[required()]}
          helperText="用于测试账号登录（不会发送验证码）。建议 6 位数字。"
          fullWidth
        />
        <NumberInput source="initialCredits" label="初始积分（可选）" />
      </SimpleForm>
    </Create>
  );
};

