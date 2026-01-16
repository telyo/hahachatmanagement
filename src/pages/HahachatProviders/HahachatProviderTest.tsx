import { useState } from 'react';
import { Button, useNotify, useRecordContext } from 'react-admin';
import { 
  Box, 
  Card, 
  CardContent, 
  Typography, 
  CircularProgress, 
  Alert 
} from '@mui/material';
import { PlayArrow as PlayIcon } from '@mui/icons-material';
import apiClient from '../../services/api';

interface TestResult {
  success: boolean;
  error?: string;
  response?: string;
  latencyMs?: number;
}

export const HahachatProviderTest = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const handleTest = async () => {
    const providerId = (record?.id || record?.providerId) as string;
    
    if (!providerId) {
      notify('提供商ID不存在', { type: 'error' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await apiClient.post(
        `/admin/hahachat-providers/${providerId}/test`
      );

      const result = response.data.data?.result || response.data.data;
      
      setTestResult({
        success: result.success || false,
        error: result.error,
        response: result.response,
        latencyMs: result.latencyMs,
      });

      if (result.success) {
        notify('提供商测试成功', { type: 'success' });
      } else {
        notify(result.error || '提供商测试失败', { type: 'error' });
      }
    } catch (error: any) {
      const errorMessage = 
        error.response?.data?.error?.message || 
        error.response?.data?.message ||
        error.message || 
        '测试失败';
      
      setTestResult({
        success: false,
        error: errorMessage,
      });
      
      notify(errorMessage, { type: 'error' });
    } finally {
      setTesting(false);
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            测试提供商连接
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            验证 API Key 是否正确，将发送一个简单的测试请求到提供商
          </Typography>

          <Box sx={{ mb: 2 }}>
            <Button
              label="开始测试"
              onClick={handleTest}
              disabled={testing}
              variant="contained"
              startIcon={testing ? <CircularProgress size={20} /> : <PlayIcon />}
            />
          </Box>

          {testResult && (
            <Box sx={{ mt: 2 }}>
              {testResult.success ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    连接成功！
                  </Typography>
                  {testResult.latencyMs && (
                    <Typography variant="body2">
                      响应时间: {testResult.latencyMs}ms
                    </Typography>
                  )}
                </Alert>
              ) : (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                    连接失败
                  </Typography>
                  <Typography variant="body2">
                    {testResult.error || '未知错误'}
                  </Typography>
                </Alert>
              )}

              {testResult.response && (
                <Card variant="outlined" sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      测试响应:
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {testResult.response}
                    </Typography>
                  </CardContent>
                </Card>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};
