import {
  Show,
  SimpleShowLayout,
  TextField,
  ImageField,
  DateField,
  TabbedShowLayout,
  Tab,
  ArrayField,
  Datagrid,
} from 'react-admin';
import { formatUtils } from '../../utils/format';

export const ClientProviderShow = () => (
  <Show>
    <TabbedShowLayout>
      <Tab label="基本信息">
        <SimpleShowLayout>
          <ImageField source="iconUrl" label="图标" sx={{ '& img': { maxWidth: 100, maxHeight: 100 } }} />
          <TextField source="providerId" label="提供商ID" />
          <TextField source="providerCode" label="提供商代码" />
          <TextField source="displayName" label="显示名称" />
          <TextField source="baseUrl" label="API 基础 URL" />
          <TextField source="defaultModel" label="默认模型" />
          <TextField source="status" label="状态" format={(status) => formatUtils.status(status)} />
          <TextField source="sortOrder" label="排序" />
          <DateField source="createdAt" label="创建时间" showTime />
          <DateField source="updatedAt" label="更新时间" showTime />
        </SimpleShowLayout>
      </Tab>
      <Tab label="模型列表">
        <SimpleShowLayout>
          {({ record }: any) => (
            <div>
              {record?.modelList && record.modelList.length > 0 ? (
                <ArrayField source="modelList">
                  <Datagrid>
                    <TextField source="modelId" label="模型ID" />
                    <TextField source="displayName" label="显示名称" />
                  </Datagrid>
                </ArrayField>
              ) : (
                <p>未配置模型列表</p>
              )}
            </div>
          )}
        </SimpleShowLayout>
      </Tab>
    </TabbedShowLayout>
  </Show>
);

