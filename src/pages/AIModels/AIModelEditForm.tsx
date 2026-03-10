import { SimpleForm, TextInput, NumberInput, SelectInput, BooleanInput, ArrayInput, SimpleFormIterator, DeleteButton, Toolbar, SaveButton } from 'react-admin';
import { Divider, Typography, Box } from '@mui/material';
import { ProviderSelector } from '../../components/ProviderSelector';
import { AIModelIconUpload } from '../../components/AIModelIconUpload';
import { useNotify, useRedirect } from 'react-admin';

interface AIModelEditFormProps {
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  currentModelId?: string; // 当前模型ID，用于过滤提供商的 supportedModels
}

export const AIModelEditForm = ({ onSubmit, currentModelId }: AIModelEditFormProps) => {
  const notify = useNotify();
  const redirect = useRedirect();

  return (
    <SimpleForm 
      onSubmit={onSubmit}
      toolbar={
        <Toolbar>
          <SaveButton />
          <Box sx={{ flex: '1 1 auto' }} />
          <DeleteButton
            mutationMode="pessimistic"
            mutationOptions={{
              onSuccess: () => {
                notify('模型删除成功', { type: 'success' });
                // 跳转到列表页面
                redirect('list', 'ai-models');
              },
              onError: (error: any) => {
                notify(error?.message || '删除失败', { type: 'error' });
              },
            }}
          />
        </Toolbar>
      }
    >
      <TextInput 
        source="id" 
        disabled 
        label="模型ID（系统生成）" 
        helperText="系统内部唯一标识符，由系统自动生成，不可编辑"
      />
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
      />
      
      <NumberInput source="pricing.creditsPerRequest" label="对话一次消耗的积分" required helperText="每次对话消耗的积分数" />
      
      <NumberInput source="capabilities.maxTokens" label="最大Tokens" />
      <BooleanInput source="capabilities.supportsStreaming" label="支持流式" />
      <BooleanInput source="capabilities.supportsFunctionCalling" label="支持函数调用" />
      <BooleanInput source="capabilities.supportsVision" label="支持视觉（多图像）" helperText="支持同时处理多张图像" />
      <BooleanInput source="capabilities.supportsImageGeneration" label="支持图像生成" helperText="支持生成图像（如 DALL-E、Midjourney）" />
      <BooleanInput source="capabilities.supportsMultiDocument" label="支持多文档" helperText="支持同时处理多个文档" />
      <NumberInput source="capabilities.maxImages" label="最大图像数量" helperText="单次请求可处理的最大图像数量" />
      <NumberInput source="capabilities.maxDocuments" label="最大文档数量" helperText="单次请求可处理的最大文档数量" />
      
      <SelectInput
        source="permissions.category"
        label="访问类别"
        choices={[
          { id: 'common', name: '通用' },
          { id: 'exclusive', name: '专属' },
          { id: 'embedding', name: '嵌入' },
        ]}
        helperText="嵌入类型仅后端用于记忆与文档分析，不向用户展示"
      />
      
      <NumberInput source="displayConfig.sortOrder" label="排序" />
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>提供商配置</Typography>
      <ProviderSelector 
        source="providers" 
        label="提供商" 
        helperText="选择该模型使用的 Hahachat 提供商，按优先级排序。聊天时会按优先级顺序尝试使用提供商。"
        currentModelId={currentModelId}
      />
      
      <Divider sx={{ my: 2 }} />
      
      <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>模型图标</Typography>
      <AIModelIconUpload />
    </SimpleForm>
  );
};

