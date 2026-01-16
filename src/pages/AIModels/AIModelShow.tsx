import {
  Show,
  SimpleShowLayout,
  TextField,
  NumberField,
  BooleanField,
  DateField,
  ArrayField,
  SingleFieldList,
  ChipField,
  TabbedShowLayout,
  Tab,
} from 'react-admin';
import { formatUtils } from '../../utils/format';
import { AIModelTest } from './AIModelTest';

export const AIModelShow = () => (
  <Show>
    <TabbedShowLayout>
      <Tab label="基本信息">
        <SimpleShowLayout>
      <TextField source="id" label="模型ID（系统生成）" />
      <TextField source="name" label="名称" />
      <TextField source="displayName" label="显示名称" />
      <TextField source="description" label="描述" />
      <TextField source="provider" label="提供商" />
      <TextField source="modelId" label="提供商模型ID" />
      <TextField source="category" label="分类" />
      <TextField source="type" label="类型" />
      <TextField source="status" label="状态" format={(status) => String(formatUtils.status(status || ''))} />
      
      <TextField source="pricing.inputPrice" label="输入价格（每1K tokens）" />
      <TextField source="pricing.outputPrice" label="输出价格（每1K tokens）" />
      
      <NumberField source="capabilities.maxTokens" label="最大Tokens" />
      <BooleanField source="capabilities.supportsStreaming" label="支持流式" />
      <BooleanField source="capabilities.supportsFunctionCalling" label="支持函数调用" />
      <BooleanField source="capabilities.supportsVision" label="支持视觉" />
      
      <BooleanField source="permissions.requiresSubscription" label="需要订阅" />
      <ArrayField source="permissions.allowedPlans" label="允许的套餐">
        <SingleFieldList>
          <ChipField source="" />
        </SingleFieldList>
      </ArrayField>
      <NumberField source="permissions.minCredits" label="最小积分" />
      
      <NumberField source="displayConfig.sortOrder" label="排序" />
      <BooleanField source="displayConfig.isFeatured" label="是否推荐" />
      
      <DateField source="createdAt" label="创建时间" showTime />
      <DateField source="updatedAt" label="更新时间" showTime />
        </SimpleShowLayout>
      </Tab>
      <Tab label="测试连接">
        <AIModelTest />
      </Tab>
    </TabbedShowLayout>
  </Show>
);

