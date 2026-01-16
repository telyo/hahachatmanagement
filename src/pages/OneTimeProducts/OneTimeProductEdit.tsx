import { Edit, SimpleForm, TextInput, NumberInput, SelectInput, BooleanInput, useNotify, useRefresh, useDataProvider, useRecordContext, usePermissions } from 'react-admin';
import { Alert } from '@mui/material';
import { useParams } from 'react-router-dom';
import { hasPermission } from '../../utils/permissions';
import { authUtils } from '../../utils/auth';

export const OneTimeProductEdit = () => {
  const notify = useNotify();
  const refresh = useRefresh();
  const dataProvider = useDataProvider();
  const record = useRecordContext();
  const { id } = useParams();
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const canWrite = hasPermission(permissions, 'subscriptions:write', adminInfo?.role);

  if (!canWrite) {
    return (
      <Edit>
        <SimpleForm>
          <Alert severity="warning" sx={{ m: 2 }}>
            您没有编辑单次购买产品的权限。如需使用，请联系超级管理员。
          </Alert>
        </SimpleForm>
      </Edit>
    );
  }

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      const productId = (record?.productId || data.productId || id) as string;
      
      if (!productId) {
        notify('产品ID不存在', { type: 'error' });
        return;
      }

      await dataProvider.update('onetime-products', {
        id: productId,
        data: data,
        previousData: record || {},
      });
      notify('产品更新成功', { type: 'success' });
      refresh();
    } catch (error: unknown) {
      const errorMessage = (error as { message?: string })?.message || '更新失败';
      notify(errorMessage, { type: 'error' });
    }
  };

  return (
    <Edit>
      <SimpleForm onSubmit={handleSave}>
        <TextInput source="productId" disabled label="产品ID" />
        <TextInput source="name" label="内部名称" required />
        <TextInput source="displayName" label="显示名称" required />
        <TextInput source="description" label="描述" multiline />
        <NumberInput source="price" label="价格" required min={0} step={0.01} />
        <TextInput source="currency" label="货币" required />
        <NumberInput source="credits" label="积分" required min={0} />
        <BooleanInput source="isPopular" label="推荐" />
        <SelectInput
          source="status"
          label="状态"
          choices={[
            { id: 'active', name: '活跃' },
            { id: 'inactive', name: '未激活' },
          ]}
        />
        <NumberInput source="sortOrder" label="排序" />
      </SimpleForm>
    </Edit>
  );
};
