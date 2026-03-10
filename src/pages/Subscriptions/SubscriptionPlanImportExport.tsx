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
  Tabs,
  Tab,
} from '@mui/material';
import { Upload as UploadIcon, Download as DownloadIcon } from '@mui/icons-material';
import { useNotify, Title, usePermissions } from 'react-admin';
import { hasPermission } from '../../utils/permissions';
import { authUtils } from '../../utils/auth';
import apiClient from '../../services/api';

export const SubscriptionPlanImportExport = () => {
  const notify = useNotify();
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const userRole = adminInfo?.role;
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importData, setImportData] = useState('');
  const [exportData, setExportData] = useState('');
  const [importResult, setImportResult] = useState<any>(null);
  const [fileInput, setFileInput] = useState<HTMLInputElement | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  // 检查是否有 subscriptions:write 权限
  const canWrite = hasPermission(permissions, 'subscriptions:write', userRole);
  const canRead = hasPermission(permissions, 'subscriptions:read', userRole);

  if (!canRead) {
    return (
      <>
        <Title title="套餐导入导出" />
        <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
          <Alert severity="error">您没有访问套餐导入导出功能的权限。如需使用，请联系超级管理员。</Alert>
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

    if (!canWrite) {
      notify('您没有导入套餐的权限', { type: 'error' });
      return;
    }

    setImporting(true);
    setImportResult(null);

    try {
      let plansData;
      try {
        plansData = JSON.parse(importData);
      } catch (e) {
        throw new Error('JSON格式错误，请检查数据格式');
      }

      // 如果直接是数组，包装成导入格式
      if (Array.isArray(plansData)) {
        plansData = { plans: plansData };
      }

      // 验证数据结构
      if (!plansData.plans || !Array.isArray(plansData.plans)) {
        throw new Error('JSON格式错误：必须包含 plans 数组');
      }

      const response = await apiClient.post('/admin/subscriptions/plans/import', plansData);
      setImportResult(response.data.data);

      if (response.data.data.failedCount === 0) {
        notify(`导入成功：成功导入 ${response.data.data.successCount} 个套餐`, { type: 'success' });
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
        results: [{ name: 'unknown', success: false, message: errorMessage }],
      });
    } finally {
      setImporting(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setExportData('');

    try {
      const status = ''; // 导出所有状态的套餐
      const response = await apiClient.get(`/admin/subscriptions/plans/export?status=${status}`);
      const exportJson = JSON.stringify(response.data.data, null, 2);
      setExportData(exportJson);
      notify('导出成功', { type: 'success' });
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message || '导出失败';
      notify(errorMessage, { type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = () => {
    if (!exportData) {
      notify('请先导出数据', { type: 'error' });
      return;
    }

    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscription-plans-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <Title title="套餐导入导出" />
      <Box sx={{ p: 3, maxWidth: 1200, margin: '0 auto' }}>
        <Typography variant="h4" gutterBottom>
          套餐导入导出
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          批量导入或导出订阅套餐配置。导入的套餐默认为活跃状态。
        </Typography>

        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 3 }}>
          <Tab label="导入套餐" />
          <Tab label="导出套餐" />
        </Tabs>

        {/* 导入标签页 */}
        {activeTab === 0 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                导入套餐配置
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                支持两种方式：1) 选择JSON文件 2) 直接粘贴JSON数据
              </Typography>

              {!canWrite && (
                <Alert severity="warning" sx={{ mb: 2 }}>
                  您没有导入套餐的权限。如需使用，请联系超级管理员。
                </Alert>
              )}

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
                    disabled={importing || !canWrite}
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
                disabled={importing || !canWrite}
                sx={{ mb: 2 }}
                placeholder={`{
  "plans": [
    {
      "name": "基础套餐",
      "duration": 30,
      "billingCycle": "monthly",
      "pricing": [
        {
          "type": "Pro",
          "price": 9.9,
          "currency": "USD",
          "displayPrice": "$9.9/月",
          "autoRenew": true,
          "benefits": {
            "monthlyCredits": 10000,
            "creditsLabel": "每月10,000个通用积分"
          }
        }
      ],
      "sortOrder": 1,
      "isPopular": false,
      "status": "active"
    }
  ]
}`}
              />
              <Button
                variant="contained"
                startIcon={importing ? <CircularProgress size={20} /> : <UploadIcon />}
                onClick={handleImport}
                disabled={importing || !importData.trim() || !canWrite}
              >
                {importing ? '导入中...' : '导入套餐配置'}
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
                            <strong>{result.name}</strong>:{' '}
                            {result.success ? '✓ 导入成功' : `✗ 导入失败: ${result.message}`}
                            {result.planId && (
                              <span style={{ marginLeft: 8, fontSize: '0.875rem', color: '#666' }}>
                                ID: {result.planId}
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
        )}

        {/* 导出标签页 */}
        {activeTab === 1 && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                导出套餐配置
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                导出所有套餐配置为JSON格式，可用于备份或批量导入
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={exporting ? <CircularProgress size={20} /> : <DownloadIcon />}
                  onClick={handleExport}
                  disabled={exporting}
                  sx={{ mr: 2 }}
                >
                  {exporting ? '导出中...' : '导出套餐配置'}
                </Button>
                {exportData && (
                  <Button variant="outlined" onClick={handleDownload}>
                    下载JSON文件
                  </Button>
                )}
              </Box>

              {exportData && (
                <MuiTextField
                  fullWidth
                  multiline
                  rows={20}
                  label="导出的JSON数据"
                  value={exportData}
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{ mb: 2 }}
                />
              )}
            </CardContent>
          </Card>
        )}
      </Box>
    </>
  );
};
