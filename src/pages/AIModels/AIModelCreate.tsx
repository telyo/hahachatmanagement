import { Create, SimpleForm, TextInput, NumberInput, SelectInput, BooleanInput, ArrayInput, SimpleFormIterator } from 'react-admin';
import { Divider, Typography } from '@mui/material';
import { ProviderSelector } from '../../components/ProviderSelector';
import { AIModelIconUpload } from '../../components/AIModelIconUpload';

export const AIModelCreate = () => (
  <Create>
    <SimpleForm>
      <TextInput source="name" label="名称" required />
      <TextInput source="displayName" label="显示名称" required />
      <TextInput source="description" label="描述" multiline />
      <TextInput source="provider" label="提供商" required />
      <TextInput 
        source="modelId" 
        label="提供商模型ID" 
        required 
        helperText="AI提供商的模型标识符，如 gpt-4, claude-3-opus, qwen-turbo 等。此ID会传递给AI提供商的API"
      />
      <TextInput source="category" label="分类" required />
      <SelectInput
        source="type"
        label="类型"
        choices={[
          { id: 'chat', name: '聊天' },
          { id: 'image', name: '图像' },
          { id: 'audio', name: '音频' },
          { id: 'video', name: '视频' },
          { id: 'embedding', name: '嵌入' },
        ]}
        required
      />
      <SelectInput
        source="status"
        label="状态"
        choices={[
          { id: 'active', name: '活跃' },
          { id: 'inactive', name: '未激活' },
        ]}
        defaultValue="active"
      />
      
      <NumberInput source="pricing.inputPrice" label="输入价格（每1K tokens）" required />
      <NumberInput source="pricing.outputPrice" label="输出价格（每1K tokens）" required />
      
      <NumberInput source="capabilities.maxTokens" label="最大Tokens" />
      <BooleanInput source="capabilities.supportsStreaming" label="支持流式" defaultValue={false} />
      <BooleanInput source="capabilities.supportsFunctionCalling" label="支持函数调用" defaultValue={false} />
      <BooleanInput source="capabilities.supportsVision" label="支持视觉（多图像）" defaultValue={false} helperText="支持同时处理多张图像" />
      <BooleanInput source="capabilities.supportsImageGeneration" label="支持图像生成" defaultValue={false} helperText="支持生成图像（如 DALL-E、Midjourney）" />
      <BooleanInput source="capabilities.supportsMultiDocument" label="支持多文档" defaultValue={false} helperText="支持同时处理多个文档" />
      <NumberInput source="capabilities.maxImages" label="最大图像数量" defaultValue={0} helperText="单次请求可处理的最大图像数量" />
      <NumberInput source="capabilities.maxDocuments" label="最大文档数量" defaultValue={0} helperText="单次请求可处理的最大文档数量" />
      
      <BooleanInput source="permissions.requiresSubscription" label="需要订阅" defaultValue={false} />
      <ArrayInput source="permissions.allowedPlans" label="允许的套餐">
        <SimpleFormIterator>
          <TextInput source="" label="套餐ID" />
        </SimpleFormIterator>
      </ArrayInput>
      <NumberInput source="permissions.minCredits" label="最小积分" />
      
      <NumberInput source="displayConfig.sortOrder" label="排序" defaultValue={0} />
      <BooleanInput source="displayConfig.isFeatured" label="是否推荐" defaultValue={false} />
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>模型图标</Typography>
      <AIModelIconUpload />
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>Hahachat 提供商配置</Typography>
      <ProviderSelector
        source="providers"
        label="支持的提供商"
        helperText="选择支持此模型的 Hahachat 提供商。可以多选并排序，系统会按优先级自动切换。如果提供商没有设置支持的模型，则支持所有模型。"
      />
    </SimpleForm>
  </Create>
);

