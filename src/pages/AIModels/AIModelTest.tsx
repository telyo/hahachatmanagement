import { useState } from 'react';
import {
  Show,
  SimpleShowLayout,
  TextField,
  Button,
  useNotify,
  useRecordContext,
} from 'react-admin';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField as MuiTextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import { PlayArrow as PlayIcon } from '@mui/icons-material';
import apiClient from '../../services/api';

interface TestResult {
  connected: boolean;
  responseTime?: number;
  error?: string;
  testResponse?: string;
}

export const AIModelTest = () => {
  const record = useRecordContext();
  const notify = useNotify();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [testMessage, setTestMessage] = useState('Hello, this is a test');

  const handleTest = async () => {
    if (!record?.id) {
      notify('模型ID不存在', { type: 'error' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await apiClient.post(`/admin/ai/models/${record.id}/test`, {
        testMessage: testMessage || 'Hello, this is a test',
      });

      const result = response.data.data;
      setTestResult({
        connected: result.connected || result.success || false,
        responseTime: result.responseTime || result.latencyMs,
        error: result.error,
        testResponse: result.testResponse || result.response,
      });

      if (result.connected || result.success) {
        notify('模型测试成功', { type: 'success' });
      } else {
        notify('模型测试失败', { type: 'error' });
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message || '测试失败';
      setTestResult({
        connected: false,
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
            测试模型连接
          </Typography>

          <Box sx={{ mb: 2 }}>
            <MuiTextField
              fullWidth
              label="测试消息"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              multiline
              rows={3}
              disabled={testing}
              sx={{ mb: 2 }}
            />
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
              {testResult.connected ? (
                <Alert severity="success" sx={{ mb: 2 }}>
                  连接成功！
                  {testResult.responseTime && (
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      响应时间: {testResult.responseTime}ms
                    </Typography>
                  )}
                </Alert>
              ) : (
                <Alert severity="error" sx={{ mb: 2 }}>
                  连接失败: {testResult.error || '未知错误'}
                </Alert>
              )}

              {testResult.testResponse && (
                <Card variant="outlined" sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      测试响应:
                    </Typography>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {testResult.testResponse}
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

