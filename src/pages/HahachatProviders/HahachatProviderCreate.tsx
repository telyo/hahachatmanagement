import { Create, SimpleForm, TextInput, SelectInput, NumberInput, ArrayInput, SimpleFormIterator, PasswordInput, BooleanInput, useNotify, useGetList } from 'react-admin';
import { dataProvider } from '../../services/dataProvider';
import { useState, useEffect } from 'react';
import { Alert } from '@mui/material';
import { useFormContext } from 'react-hook-form';

// 调试组件：显示表单验证错误
const FormDebugger = () => {
  const { formState } = useFormContext();
  
  useEffect(() => {
    if (formState.isSubmitted && !formState.isValid) {
      console.error('表单验证错误:', formState.errors);
      // 详细输出每个字段的错误
      Object.keys(formState.errors).forEach((key) => {
        console.error(`字段 ${key} 的错误:`, formState.errors[key]);
      });
    }
  }, [formState.isSubmitted, formState.isValid, formState.errors]);
  
  return null;
};

// 条件渲染 API 字段的组件
const ConditionalApiFields = ({ isHahachat }: { isHahachat: boolean }) => {
  const { setValue } = useFormContext();
  
  // 当切换为 Hahachat 时，清空 API 相关字段
  useEffect(() => {
    if (isHahachat) {
      setValue('apiEndpoint', '', { shouldValidate: false });
      setValue('apiKey', '', { shouldValidate: false });
      setValue('secretKey', '', { shouldValidate: false });
      setValue('supportedModels', [], { shouldValidate: false });
    }
  }, [isHahachat, setValue]);
  
  if (isHahachat) {
    return null;
  }
  
  return (
    <>
      <TextInput 
        source="apiEndpoint" 
        label="API 端点" 
        required
        helperText="API 请求的完整 URL" 
      />
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
    </>
  );
};

export const HahachatProviderCreate = () => {
  const notify = useNotify();
  const [isHahachat, setIsHahachat] = useState(false);
  const [hasExistingHahachat, setHasExistingHahachat] = useState(false);

  // 检查是否已存在 Hahachat 提供商
  const { data: providersData } = useGetList('hahachat-providers', {
    pagination: { page: 1, perPage: 1000 },
    sort: { field: 'sortOrder', order: 'ASC' },
  });

  useEffect(() => {
    if (!providersData) return;
    // useGetList 返回的 data 是一个数组
    const providers = Array.isArray(providersData) ? providersData : [];
    const existingHahachat = providers.some((p: { isHahachat?: boolean }) => p.isHahachat === true);
    setHasExistingHahachat(existingHahachat);
    if (existingHahachat) {
      setIsHahachat(false); // 如果已有 Hahachat，不允许再创建
    }
  }, [providersData]);

  const handleSave = async (data: Record<string, unknown>) => {
    try {
      // 清理数据
      const cleanData: Record<string, unknown> = { ...data };
      
      // 处理 supportedModels：ArrayInput 返回的是对象数组，需要转换为字符串数组
      if (cleanData.supportedModels && Array.isArray(cleanData.supportedModels)) {
        cleanData.supportedModels = cleanData.supportedModels
          .map((item: unknown) => {
            // 如果是对象，取第一个非空值；如果是字符串，直接使用
            if (typeof item === 'string') {
              return item;
            }
            if (typeof item === 'object' && item !== null) {
              // 取对象的第一个非空值
              const values = Object.values(item).filter((v: unknown) => v && typeof v === 'string' && v.trim() !== '');
              return values.length > 0 ? String(values[0]) : null;
            }
            return null;
          })
          .filter((item: unknown) => item !== null && item !== '');
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

      // 如果设置为 Hahachat，检查是否已有其他 Hahachat 提供商
      if (cleanData.isHahachat === true && hasExistingHahachat) {
        notify('已存在 Hahachat 提供商，只能有一个 Hahachat 提供商', { type: 'error' });
        throw new Error('已存在 Hahachat 提供商');
      }

      // 如果设置为 Hahachat，清空 API 相关字段和 supportedModels
      if (cleanData.isHahachat === true) {
        if (!cleanData.loginUrl || !cleanData.subscriptionUrl) {
          notify('Hahachat 提供商必须提供登录链接和订阅链接', { type: 'error' });
          throw new Error('Hahachat 提供商必须提供登录链接和订阅链接');
        }
        // 删除 API 相关字段（Hahachat 提供商不需要）
        delete cleanData.apiEndpoint;
        delete cleanData.apiKey;
        delete cleanData.secretKey;
        // Hahachat 提供商不需要设置支持的模型
        cleanData.supportedModels = [];
      } else {
        // 非 Hahachat 提供商，API 相关字段必填
        if (!cleanData.apiEndpoint || !cleanData.apiKey) {
          notify('非 Hahachat 提供商必须提供 API 端点和 API Key', { type: 'error' });
          throw new Error('非 Hahachat 提供商必须提供 API 端点和 API Key');
        }
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
      // 提取错误消息
      let errorMessage = '创建失败';
      const err = error as any;
      
      if (err?.body?.message) {
        errorMessage = err.body.message;
      } else if (err?.body?.error?.message) {
        errorMessage = err.body.error.message;
      } else if (err?.message) {
        errorMessage = err.message;
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      
      notify(errorMessage, { type: 'error' });
      
      // 规范化错误对象，只包含 message，避免 React Admin 错误地将字段值当作错误消息
      const normalizedError: any = new Error(errorMessage);
      normalizedError.body = {
        message: errorMessage,
      };
      normalizedError.status = err?.status || 400;
      throw normalizedError;
    }
  };

  return (
    <Create>
      <SimpleForm 
        onSubmit={async (data: Record<string, unknown>) => {
          try {
            // 调用 handleSave 处理数据
            const cleanData = await handleSave(data);
            // 直接调用 dataProvider.create，而不是返回数据
            // 这样可以避免 React Admin 错误地将数据当作错误对象
            const result = await dataProvider.create('hahachat-providers', {
              data: cleanData,
            });
            notify('创建成功', { type: 'success' });
            return result.data;
          } catch (error: any) {
            // 提取错误消息
            let errorMessage = '创建失败';
            const err = error as any;
            
            if (err?.body?.message) {
              errorMessage = err.body.message;
            } else if (err?.body?.error?.message) {
              errorMessage = err.body.error.message;
            } else if (err?.message) {
              errorMessage = err.message;
            }
            
            notify(errorMessage, { type: 'error' });
            
            // 规范化错误对象，只包含 message，避免 React Admin 错误地将字段值当作错误消息
            const normalizedError: any = new Error(errorMessage);
            normalizedError.body = {
              message: errorMessage,
            };
            normalizedError.status = err?.status || 400;
            throw normalizedError;
          }
        }}
        defaultValues={{
          isHahachat: false,
          status: 'active',
          sortOrder: 0,
          timeoutSeconds: 30,
          retryAttempts: 3,
          supportedModels: [],
        }}
      >
        <FormDebugger />
        {hasExistingHahachat && (
          <Alert severity="info" sx={{ mb: 2 }}>
            已存在 Hahachat 提供商，无法再创建新的 Hahachat 提供商
          </Alert>
        )}
        <TextInput source="name" label="名称" required helperText="提供商的内部名称" />
        <TextInput source="displayName" label="显示名称" required helperText="在前端显示的名称" />
        <TextInput source="description" label="描述" multiline helperText="提供商的描述信息" />
        
        <BooleanInput
          source="isHahachat"
          label="是否为 Hahachat 提供商"
          defaultValue={false}
          disabled={hasExistingHahachat}
          helperText={hasExistingHahachat ? "已存在 Hahachat 提供商，无法再创建" : "开启后，将使用 Hahachat 专用配置（登录页面、订阅套餐页面）"}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setIsHahachat(e.target.checked)}
        />

        {/* Hahachat 专用配置 */}
        {isHahachat && (
          <>
            <TextInput
              source="loginUrl"
              label="登录页面 URL"
              required={isHahachat}
              validate={isHahachat ? [(value: string) => {
                if (!value || value.trim() === '') {
                  return '登录页面 URL 是必填项';
                }
                return undefined;
              }] : undefined}
              helperText="Hahachat 登录页面的完整 URL"
            />
            <TextInput
              source="subscriptionUrl"
              label="订阅套餐页面 URL"
              required={isHahachat}
              validate={isHahachat ? [(value: string) => {
                if (!value || value.trim() === '') {
                  return '订阅套餐页面 URL 是必填项';
                }
                return undefined;
              }] : undefined}
              helperText="Hahachat 订阅套餐页面的完整 URL"
            />
          </>
        )}

        {/* 条件渲染：非 Hahachat 提供商显示 API 相关字段 */}
        <ConditionalApiFields isHahachat={isHahachat} />

        <NumberInput 
          source="sortOrder" 
          label="排序" 
          defaultValue={0} 
          helperText="排序值，数字越小越靠前"
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
      </SimpleForm>
    </Create>
  );
};
