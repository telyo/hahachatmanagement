import {
  Show,
  SimpleShowLayout,
  TextField,
  EmailField,
  DateField,
  NumberField,
  ReferenceField,
  TabbedShowLayout,
  Tab,
  FunctionField,
} from 'react-admin';
import { formatUtils } from '../../utils/format';

// 格式化续订状态
const formatRenewalStatus = (status?: string) => {
  if (!status) return '未设置';
  const statusMap: Record<string, string> = {
    'auto_renew': '正常续订',
    'onetime': '单次购买',
    'cancelled': '取消订阅',
  };
  return statusMap[status] || status;
};

export const UserShow = () => (
  <Show>
    <TabbedShowLayout>
      <Tab label="基本信息">
        <SimpleShowLayout>
          <TextField source="id" label="用户ID" />
          <EmailField source="email" label="邮箱" />
          <TextField source="phone" label="手机号" />
          <TextField source="username" label="用户名" />
          <TextField source="status" label="状态" format={(status) => formatUtils.status(status)} />
          <FunctionField
            label="积分余额"
            render={(record: any) => {
              if (record.virtualCurrency?.balance !== undefined) {
                return record.virtualCurrency.balance;
              }
              return record.credits || 0;
            }}
          />
          <DateField source="createdAt" label="注册时间" showTime />
          <DateField source="updatedAt" label="更新时间" showTime />
        </SimpleShowLayout>
      </Tab>
      <Tab label="订阅信息">
        <SimpleShowLayout>
          {({ record }: any) => (
            <>
              {record?.subscription ? (
                <>
                  <TextField source="subscription.planName" label="套餐名称" />
                  <TextField source="subscription.status" label="订阅状态" />
                  <DateField
                    source="subscription.endDate"
                    label="到期时间"
                    showTime
                    format={(value) => {
                      if (!value) {
                        // 如果没有 endDate，尝试使用 expiresAt
                        const expiresAt = record?.subscription?.expiresAt;
                        return expiresAt ? new Date(expiresAt).toLocaleString('zh-CN') : '未设置';
                      }
                      return new Date(value).toLocaleString('zh-CN');
                    }}
                  />
                  <FunctionField
                    label="续订状态"
                    render={(record: any) => formatRenewalStatus(record?.subscription?.renewalStatus)}
                  />
                </>
              ) : (
                <TextField label="订阅状态" value="未订阅" />
              )}
            </>
          )}
        </SimpleShowLayout>
      </Tab>
    </TabbedShowLayout>
  </Show>
);

