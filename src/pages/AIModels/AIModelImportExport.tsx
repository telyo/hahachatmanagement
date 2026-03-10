import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  TextField as MuiTextField,
  CircularProgress,
  Grid,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { Download as DownloadIcon, Upload as UploadIcon } from '@mui/icons-material';
import { useNotify, Title } from 'react-admin';
import apiClient from '../../services/api';

export const AIModelImportExport = () => {
  const notify = useNotify();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importData, setImportData] = useState('');
  const [importResult, setImportResult] = useState<{
    totalCount: number;
    successCount: number;
    failedCount: number;
    results?: Array<{ status: string; modelId?: string; message?: string; error?: string }>;
    importedAt?: string;
  } | null>(null);
  const [overwrite, setOverwrite] = useState(false);
  const [skipErrors, setSkipErrors] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await apiClient.get('/admin/ai/models/export', {
        responseType: 'json',
      });

      // 提取 data 中的 models 数组，转换为导入格式
      let exportData: { models: unknown[]; options?: { overwrite: boolean; skipErrors: boolean } };
      
      if (response.data?.success && response.data?.data) {
        // 如果是标准 API 响应格式，提取 data
        const exportResponse = response.data.data;
        exportData = {
          models: exportResponse.models || [],
          options: {
            overwrite: false,
            skipErrors: false,
          },
        };
      } else if (response.data?.models) {
        // 如果直接是导入格式
        exportData = {
          models: response.data.models,
          options: response.data.options || {
            overwrite: false,
            skipErrors: false,
          },
        };
      } else {
        throw new Error('导出数据格式不正确');
      }

      // 转换为 JSON 字符串并下载
      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ai-models-export-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      notify('导出成功', { type: 'success' });
    } catch (error: unknown) {
      let errorMessage = '导出失败';
      if (error && typeof error === 'object' && 'response' in error) {
        const httpError = error as { response?: { data?: { error?: { message?: string } } }; message?: string };
        errorMessage = httpError.response?.data?.error?.message || httpError.message || '导出失败';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      notify(errorMessage, { type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
    };
    reader.onerror = () => {
      notify('读取文件失败', { type: 'error' });
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      notify('请先粘贴或选择要导入的JSON文件', { type: 'error' });
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      let parsedData: unknown;
      try {
        parsedData = JSON.parse(importData);
      } catch (e) {
        throw new Error('JSON格式错误，请检查数据格式');
      }

      // 确定 models 数组
      let modelsArray: Array<Record<string, unknown>> = [];
      
      if (Array.isArray(parsedData)) {
        // 如果直接是数组，使用它作为 models
        modelsArray = parsedData as Array<Record<string, unknown>>;
      } else if (parsedData && typeof parsedData === 'object') {
        const obj = parsedData as Record<string, unknown>;
        
        // 检查是否是导出响应格式（包含 success 和 data 字段）
        if (obj.success !== undefined && obj.data && typeof obj.data === 'object') {
          const dataObj = obj.data as Record<string, unknown>;
          if (Array.isArray(dataObj.models)) {
            // 这是导出接口返回的完整响应，提取 data.models
            modelsArray = dataObj.models as Array<Record<string, unknown>>;
            console.log('检测到导出响应格式，已提取 data.models，共', modelsArray.length, '个模型');
          } else {
            throw new Error('导出响应格式错误：data 中必须包含 models 数组');
          }
        } else if (Array.isArray(obj.models)) {
          // 如果是对象且包含 models 字段
          modelsArray = obj.models as Array<Record<string, unknown>>;
        } else {
          throw new Error('JSON格式错误：必须包含 models 数组。如果是导出响应，请确保包含 data.models 字段');
        }
      } else {
        throw new Error('JSON格式错误：数据必须是数组或包含 models 字段的对象');
      }

      // 验证模型列表不为空
      if (modelsArray.length === 0) {
        throw new Error('模型列表不能为空');
      }

      // 验证每个模型的基本字段
      for (let i = 0; i < modelsArray.length; i++) {
        const model = modelsArray[i];
        if (!model || typeof model !== 'object') {
          throw new Error(`模型 ${i + 1} 格式错误：必须是对象`);
        }
        if (!model.modelId) {
          throw new Error(`模型 ${i + 1} 缺少必填字段: modelId`);
        }
        if (!model.name) {
          throw new Error(`模型 ${i + 1} (${model.modelId}) 缺少必填字段: name`);
        }
        if (!model.provider) {
          throw new Error(`模型 ${i + 1} (${model.modelId}) 缺少必填字段: provider`);
        }
      }

      // 构建请求载荷，确保格式完全正确
      const requestPayload: {
        models: Array<Record<string, unknown>>;
        options: { overwrite: boolean; skipErrors: boolean };
      } = {
        models: modelsArray,
        options: {
          overwrite,
          skipErrors,
        },
      };

      // 打印请求数据以便调试
      console.log('发送导入请求:', {
        modelsCount: requestPayload.models.length,
        options: requestPayload.options,
        firstModel: requestPayload.models[0],
        fullPayload: JSON.stringify(requestPayload, null, 2),
        modelsType: Array.isArray(requestPayload.models) ? 'array' : typeof requestPayload.models,
        modelsIsArray: Array.isArray(requestPayload.models),
        modelsLength: requestPayload.models.length,
      });

      // 最后一次验证
      if (!requestPayload.models || !Array.isArray(requestPayload.models) || requestPayload.models.length === 0) {
        throw new Error('模型列表不能为空');
      }

      // 确保发送的数据格式完全正确
      const finalPayload = {
        models: requestPayload.models,
        options: requestPayload.options,
      };

      // 验证最终载荷
      console.log('最终发送的载荷:', {
        hasModels: !!finalPayload.models,
        modelsIsArray: Array.isArray(finalPayload.models),
        modelsLength: finalPayload.models?.length || 0,
        modelsType: Array.isArray(finalPayload.models) ? 'array' : typeof finalPayload.models,
        fullPayload: JSON.stringify(finalPayload, null, 2),
      });

      const response = await apiClient.post('/admin/ai/models/import', finalPayload);
      setImportResult(response.data.data);

      if (response.data.data.failedCount === 0) {
        notify(`导入成功：成功导入 ${response.data.data.successCount} 个模型`, { type: 'success' });
      } else {
        notify(`导入完成：成功 ${response.data.data.successCount}，失败 ${response.data.data.failedCount}`, {
          type: 'warning',
        });
      }
    } catch (error: unknown) {
      let errorMessage = '导入失败';
      
      if (error && typeof error === 'object' && 'response' in error) {
        const httpError = error as {
          response?: {
            data?: {
              error?: { message?: string; details?: unknown };
              message?: string;
            };
            status?: number;
            statusText?: string;
          };
        };
        // 服务器返回的错误
        const errorData = httpError.response?.data;
        if (errorData?.error?.message) {
          errorMessage = errorData.error.message;
        } else if (errorData?.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (httpError.response) {
          errorMessage = `服务器错误: ${httpError.response.status} ${httpError.response.statusText}`;
        }
        
        // 如果是 400 错误，尝试显示更详细的验证错误
        if (httpError.response?.status === 400) {
          console.error('服务器错误响应:', errorData);
          
          // 检查是否有字段验证错误
          if (errorData?.error?.details) {
            errorMessage = `${errorMessage}: ${JSON.stringify(errorData.error.details)}`;
          }
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      console.error('导入错误详情:', {
        error,
      });
      
      notify(errorMessage, { type: 'error' });
      setImportResult({
        totalCount: 0,
        successCount: 0,
        failedCount: 1,
        results: [{ status: 'failed', message: errorMessage }],
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Title title="模型导入/导出" />
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          模型导入/导出
        </Typography>
        <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                导出模型配置
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                导出所有AI模型配置为JSON文件，可用于备份或迁移到其他环境
              </Typography>
              <Button
                variant="contained"
                startIcon={exporting ? <CircularProgress size={20} /> : <DownloadIcon />}
                onClick={handleExport}
                disabled={exporting}
              >
                {exporting ? '导出中...' : '导出模型配置'}
              </Button>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                导入模型配置
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                支持两种方式：1) 选择JSON文件 2) 直接粘贴JSON数据
              </Typography>

              <Box sx={{ mb: 2 }}>
                <input
                  accept=".json"
                  style={{ display: 'none' }}
                  id="file-upload"
                  type="file"
                  onChange={handleFileSelect}
                  ref={(input) => {
                    // File input ref for potential future use
                    if (input) {
                      // Can be used to reset file input if needed
                    }
                  }}
                />
                <label htmlFor="file-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    disabled={importing}
                    sx={{ mr: 2 }}
                  >
                    选择JSON文件
                  </Button>
                </label>
              </Box>

              <MuiTextField
                fullWidth
                multiline
                rows={12}
                label="JSON数据"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                disabled={importing}
                sx={{ mb: 2 }}
                placeholder={`{
  "models": [
    {
      "modelId": "gpt-4",
      "name": "GPT-4",
      "displayName": "GPT-4",
      "provider": "openai",
      "providerModelId": "gpt-4",
      "category": "chat",
      "type": "chat",
      "status": "active",
      "pricing": {
        "creditsPerRequest": 1
      }
    }
  ],
  "options": {
    "overwrite": false,
    "skipErrors": false
  }
}`}
              />

              <Box sx={{ mb: 2 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={overwrite}
                      onChange={(e) => setOverwrite(e.target.checked)}
                      disabled={importing}
                    />
                  }
                  label="覆盖已存在的模型"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={skipErrors}
                      onChange={(e) => setSkipErrors(e.target.checked)}
                      disabled={importing}
                    />
                  }
                  label="跳过错误继续导入"
                />
              </Box>

              <Button
                variant="contained"
                startIcon={importing ? <CircularProgress size={20} /> : <UploadIcon />}
                onClick={handleImport}
                disabled={importing || !importData.trim()}
              >
                {importing ? '导入中...' : '导入模型配置'}
              </Button>

              {importResult && (
                <Box sx={{ mt: 3 }}>
                  <Alert
                    severity={importResult.failedCount === 0 ? 'success' : 'warning'}
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="body2">
                      总计: {importResult.totalCount} | 成功: {importResult.successCount} | 失败:{' '}
                      {importResult.failedCount}
                    </Typography>
                    {importResult.importedAt && (
                      <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                        导入时间: {new Date(importResult.importedAt).toLocaleString('zh-CN')}
                      </Typography>
                    )}
                  </Alert>

                  {importResult.results && importResult.results.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        导入详情:
                      </Typography>
                      {importResult.results.map((result, index: number) => (
                        <Alert
                          key={index}
                          severity={
                            result.status === 'success'
                              ? 'success'
                              : result.status === 'skipped'
                              ? 'info'
                              : 'error'
                          }
                          sx={{ mb: 1 }}
                        >
                          <Typography variant="body2">
                            <strong>{result.modelId || `模型 ${index + 1}`}</strong>:{' '}
                            {result.status === 'success' && '✓ 导入成功'}
                            {result.status === 'skipped' && '⊘ 已跳过'}
                            {result.status === 'failed' && `✗ 导入失败: ${result.error || result.message || ''}`}
                            {result.message && result.status !== 'failed' && (
                              <span style={{ marginLeft: 8, fontSize: '0.875rem', color: '#666' }}>
                                {result.message}
                              </span>
                            )}
                          </Typography>
                        </Alert>
                      ))}
                    </Box>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      </Box>
    </>
  );
};

