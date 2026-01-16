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
} from '@mui/material';
import { Download as DownloadIcon, Upload as UploadIcon } from '@mui/icons-material';
import { useNotify, Title } from 'react-admin';
import apiClient from '../../services/api';

export const AIModelImportExport = () => {
  const notify = useNotify();
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importData, setImportData] = useState('');
  const [importResult, setImportResult] = useState<any>(null);

  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await apiClient.get('/admin/ai/models/export', {
        responseType: 'blob',
      });

      // 创建下载链接
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ai-models-export-${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      notify('导出成功', { type: 'success' });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message || '导出失败';
      notify(errorMessage, { type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      notify('请先粘贴要导入的JSON数据', { type: 'error' });
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      let modelsData;
      try {
        modelsData = JSON.parse(importData);
      } catch (e) {
        throw new Error('JSON格式错误，请检查数据格式');
      }

      // 如果直接是数组，包装成导入格式
      if (Array.isArray(modelsData)) {
        modelsData = { models: modelsData, options: { overwrite: false, skipErrors: false } };
      }

      const response = await apiClient.post('/admin/ai/models/import', modelsData);
      setImportResult(response.data.data);

      if (response.data.data.failedCount === 0) {
        notify('导入成功', { type: 'success' });
      } else {
        notify(`导入完成：成功 ${response.data.data.successCount}，失败 ${response.data.data.failedCount}`, {
          type: 'warning',
        });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message || '导入失败';
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
                从JSON文件导入AI模型配置
              </Typography>
              <MuiTextField
                fullWidth
                multiline
                rows={6}
                label="JSON数据"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                disabled={importing}
                sx={{ mb: 2 }}
                placeholder='{"models": [...], "options": {"overwrite": false, "skipErrors": false}}'
              />
              <Button
                variant="contained"
                startIcon={importing ? <CircularProgress size={20} /> : <UploadIcon />}
                onClick={handleImport}
                disabled={importing || !importData.trim()}
              >
                {importing ? '导入中...' : '导入模型配置'}
              </Button>

              {importResult && (
                <Box sx={{ mt: 2 }}>
                  <Alert
                    severity={importResult.failedCount === 0 ? 'success' : 'warning'}
                    sx={{ mb: 2 }}
                  >
                    <Typography variant="body2">
                      总计: {importResult.totalCount} | 成功: {importResult.successCount} | 失败:{' '}
                      {importResult.failedCount}
                    </Typography>
                  </Alert>

                  {importResult.results && importResult.results.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        导入详情:
                      </Typography>
                      {importResult.results.map((result: any, index: number) => (
                        <Alert
                          key={index}
                          severity={result.status === 'success' ? 'success' : 'error'}
                          sx={{ mb: 1 }}
                        >
                          {result.modelId || `模型 ${index + 1}`}: {result.status} -{' '}
                          {result.message || result.error || ''}
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

