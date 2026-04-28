import { Show, SimpleShowLayout, TextField, DateField, ArrayField, SingleFieldList, ChipField, TabbedShowLayout, Tab } from 'react-admin';
import { HahachatProviderTest } from './HahachatProviderTest';

export const HahachatProviderShow = () => {
  return (
    <Show>
      <TabbedShowLayout>
        <Tab label="详情">
          <SimpleShowLayout>
            <TextField source="providerId" label="提供商ID" />
            <TextField source="name" label="名称" />
            <TextField source="displayName" label="显示名称" />
            <TextField source="description" label="描述" />
            <TextField source="apiEndpoint" label="API 端点" />
            <TextField source="imageGenerationRoute" label="图片生成 API 路径" emptyText="（自动）" />
            <TextField source="imageEditRoute" label="图片编辑 API 路径" emptyText="（自动）" />
            <ArrayField source="supportedModels" label="支持的模型">
              <SingleFieldList>
                <ChipField source="id" />
              </SingleFieldList>
            </ArrayField>
            <TextField source="sortOrder" label="排序" />
            <TextField source="status" label="状态" />
            <DateField source="createdAt" label="创建时间" showTime />
            <DateField source="updatedAt" label="更新时间" showTime />
          </SimpleShowLayout>
        </Tab>
        <Tab label="测试连接">
          <HahachatProviderTest />
        </Tab>
      </TabbedShowLayout>
    </Show>
  );
};
