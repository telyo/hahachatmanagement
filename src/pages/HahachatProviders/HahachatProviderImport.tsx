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
} from '@mui/material';
import { Upload as UploadIcon } from '@mui/icons-material';
import { useNotify, Title, usePermissions } from 'react-admin';
import { hasPermission } from '../../utils/permissions';
import { authUtils } from '../../utils/auth';
import apiClient from '../../services/api';

export const HahachatProviderImport = () => {
  const notify = useNotify();
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const userRole = adminInfo?.role;
  const [importing, setImporting] = useState(false);
  const [importData, setImportData] = useState('');
  const [importResult, setImportResult] = useState<any>(null);
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);

  // 检查是否有 hahachat_providers:write 权限
  const canWrite = hasPermission(permissions, 'hahachat_providers:write', userRole);

  // 调试日志
  if (import.meta.env.DEV) {
    console.log('[HahachatProviderImport] 权限检查', {
      canWrite,
      userRole,
      permissions: Array.isArray(permissions) ? permissions : 'not array',
      adminInfo,
    });
  }

  if (!canWrite) {
    return (
      <>
        <Title title="Hahachat 提供商导入" />
        <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
          <Alert severity="error">
            您没有导入 Hahachat 提供商的权限。如需使用，请联系超级管理员。
          </Alert>
        </Box>
      </>
    );
  }

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
      let providersData;
      try {
        providersData = JSON.parse(importData);
      } catch (e) {
        throw new Error('JSON格式错误，请检查数据格式');
      }

      // 如果直接是数组，包装成导入格式
      if (Array.isArray(providersData)) {
        providersData = { providers: providersData };
      }

      // 验证数据结构
      if (!providersData.providers || !Array.isArray(providersData.providers)) {
        throw new Error('JSON格式错误：必须包含 providers 数组');
      }

      const response = await apiClient.post('/admin/hahachat-providers/import', providersData);
      setImportResult(response.data.data);

      if (response.data.data.failedCount === 0) {
        notify(`导入成功：成功导入 ${response.data.data.successCount} 个提供商`, { type: 'success' });
      } else {
        notify(
          `导入完成：成功 ${response.data.data.successCount}，失败 ${response.data.data.failedCount}`,
          { type: 'warning' }
        );
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message || '导入失败';
      notify(errorMessage, { type: 'error' });
      setImportResult({
        totalCount: 0,
        successCount: 0,
        failedCount: 1,
        results: [{ name: 'unknown', displayName: '未知', success: false, message: errorMessage }],
      });
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      <Title title="Hahachat 提供商导入" />
      <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
        <Typography variant="h4" gutterBottom>
          Hahachat 提供商导入
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          从JSON文件批量导入 Hahachat 提供商配置。导入的提供商默认为活跃状态。
          注意：导入时不需要提供支持的模型列表，支持的模型需要后续在编辑页面中配置。
        </Typography>

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              导入提供商配置
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
                ref={(input) => setFileInput(input)}
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
              rows={15}
              label="JSON数据"
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              disabled={importing}
              sx={{ mb: 2 }}
              placeholder={`{
  "providers": [
    {
      "name": "openai",
      "displayName": "OpenAI",
      "description": "OpenAI 提供商",
      "apiEndpoint": "https://api.openai.com/v1",
      "apiKey": "sk-...",
      "secretKey": "",
      "timeoutSeconds": 30,
      "retryAttempts": 3,
      "sortOrder": 1,
      "status": "active"
    }
  ]
}`}
            />
            <Button
              variant="contained"
              startIcon={importing ? <CircularProgress size={20} /> : <UploadIcon />}
              onClick={handleImport}
              disabled={importing || !importData.trim()}
            >
              {importing ? '导入中...' : '导入提供商配置'}
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
                    {importResult.results.map((result: any, index: number) => (
                      <Alert
                        key={index}
                        severity={result.success ? 'success' : 'error'}
                        sx={{ mb: 1 }}
                      >
                        <Typography variant="body2">
                          <strong>{result.displayName}</strong> ({result.name}):{' '}
                          {result.success ? '✓ 导入成功' : `✗ 导入失败: ${result.message}`}
                          {result.providerId && (
                            <span style={{ marginLeft: 8, fontSize: '0.875rem', color: '#666' }}>
                              ID: {result.providerId}
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
      </Box>
    </>
  );
};
