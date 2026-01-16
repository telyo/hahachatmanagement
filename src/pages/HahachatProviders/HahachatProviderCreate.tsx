import { Create, SimpleForm, TextInput, SelectInput, NumberInput, ArrayInput, SimpleFormIterator, PasswordInput, useNotify } from 'react-admin';

export const HahachatProviderCreate = () => {
  const notify = useNotify();

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      // 清理数据
      const cleanData: any = { ...data };
      
      // 处理 supportedModels：ArrayInput 返回的是对象数组，需要转换为字符串数组
      if (cleanData.supportedModels && Array.isArray(cleanData.supportedModels)) {
        cleanData.supportedModels = cleanData.supportedModels
          .map((item: any) => {
            // 如果是对象，取第一个非空值；如果是字符串，直接使用
            if (typeof item === 'string') {
              return item;
            }
            if (typeof item === 'object' && item !== null) {
              // 取对象的第一个非空值
              const values = Object.values(item).filter((v: any) => v && v.trim && v.trim() !== '');
              return values.length > 0 ? String(values[0]) : null;
            }
            return null;
          })
          .filter((item: any) => item !== null && item !== '');
      } else {
        cleanData.supportedModels = [];
      }

      // 如果 secretKey 为空，不发送该字段
      if (cleanData.secretKey === '' || cleanData.secretKey === null || cleanData.secretKey === undefined) {
        delete cleanData.secretKey;
      }

      // 确保 status 有默认值
      if (!cleanData.status) {
        cleanData.status = 'active';
      }

      // 确保 sortOrder 有默认值
      if (cleanData.sortOrder === undefined || cleanData.sortOrder === null) {
        cleanData.sortOrder = 0;
      }

      // 确保 timeoutSeconds 和 retryAttempts 有默认值
      if (cleanData.timeoutSeconds === undefined || cleanData.timeoutSeconds === null) {
        cleanData.timeoutSeconds = 30;
      }
      if (cleanData.retryAttempts === undefined || cleanData.retryAttempts === null) {
        cleanData.retryAttempts = 3;
      }

      // 删除不应该发送的字段
      delete cleanData.id;
      delete cleanData.providerId;
      delete cleanData.createdAt;
      delete cleanData.updatedAt;
      delete cleanData.sk;
      delete cleanData.entityType;

      // 使用 dataProvider 创建（会自动处理签名）
      // 这里直接使用 SimpleForm 的默认提交，它会调用 dataProvider.create
      return cleanData;
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '创建失败';
      notify(errorMessage, { type: 'error' });
      throw error;
    }
  };

  return (
    <Create>
      <SimpleForm onSubmit={handleSave}>
        <TextInput source="name" label="名称" required helperText="提供商的内部名称" />
        <TextInput source="displayName" label="显示名称" required helperText="在前端显示的名称" />
        <TextInput source="description" label="描述" multiline helperText="提供商的描述信息" />
        <TextInput source="apiEndpoint" label="API 端点" required helperText="API 请求的完整 URL" />
        <PasswordInput 
          source="apiKey" 
          label="API Key" 
          required 
          helperText="提供商的 API Key（将加密存储）"
          autoComplete="new-password"
        />
        <PasswordInput 
          source="secretKey" 
          label="Secret Key" 
          helperText="部分提供商需要 Secret Key（可选，将加密存储）"
          autoComplete="new-password"
        />
        <ArrayInput source="supportedModels" label="支持的模型" defaultValue={[]}>
          <SimpleFormIterator>
            <TextInput source="" label="模型ID" helperText="该提供商支持的 AI 模型ID（用于内部判断，不用于显示）" fullWidth />
          </SimpleFormIterator>
        </ArrayInput>
        <NumberInput source="sortOrder" label="排序" defaultValue={0} helperText="排序值，数字越小越靠前" />
        <SelectInput
          source="status"
          label="状态"
          choices={[
            { id: 'active', name: '活跃' },
            { id: 'inactive', name: '未激活' },
          ]}
          defaultValue="active"
        />
      </SimpleForm>
    </Create>
  );
};
