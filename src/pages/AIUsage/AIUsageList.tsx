import { useState, useEffect } from 'react';
import {
  List,
  Datagrid,
  TextField,
  NumberField,
  DateField,
  Filter,
  TextInput,
  useNotify,
  TopToolbar,
  ExportButton,
} from 'react-admin';
import { Box, Card, CardContent, Typography, Grid, CircularProgress } from '@mui/material';
import { aiUsageService, AIUsageStatistics } from '../../services/aiUsage';
import { formatUtils } from '../../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const AIUsageFilter = (props: any) => (
  <Filter {...props}>
    <TextInput source="userId" label="用户ID" />
    <TextInput source="modelId" label="模型ID" />
  </Filter>
);

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const AIUsageList = () => {
  const [statistics, setStatistics] = useState<AIUsageStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const notify = useNotify();

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        setLoading(true);
        const response = await aiUsageService.getStatistics();
        setStatistics(response.data);
      } catch (error: any) {
        console.error('获取统计信息失败:', error);
        const errorMessage = error.response?.data?.error?.message || error.message || '获取统计信息失败';
        notify(errorMessage, { type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [notify]);

  return (
    <>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : statistics && (
        <Box sx={{ p: 3 }}>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    总请求数
                  </Typography>
                  <Typography variant="h4">{statistics.totalRequests.toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    总Token数
                  </Typography>
                  <Typography variant="h4">{statistics.totalTokens.toLocaleString()}</Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={4}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    总成本
                  </Typography>
                  <Typography variant="h4">{formatUtils.currency(statistics.totalCost)}</Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {statistics.byModel && statistics.byModel.length > 0 && (
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      按模型分布（请求数）
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={statistics.byModel}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="modelName" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="requests" fill="#8884d8" name="请求数" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      按模型分布（Token数）
                    </Typography>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={statistics.byModel}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ modelName, percent }) => `${modelName} ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="tokens"
                        >
                          {statistics.byModel.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </Box>
      )}

      <List
        filters={<AIUsageFilter />}
        actions={
          <TopToolbar>
            <ExportButton />
          </TopToolbar>
        }
        title="AI 使用记录"
      >
        <Datagrid>
          <TextField source="id" label="记录ID" />
          <TextField source="userId" label="用户ID" />
          <TextField source="modelName" label="模型名称" />
          <NumberField source="inputTokens" label="输入Tokens" />
          <NumberField source="outputTokens" label="输出Tokens" />
          <NumberField source="totalTokens" label="总Tokens" />
          <NumberField source="cost" label="成本" options={{ style: 'currency', currency: 'USD' }} />
          <DateField source="createdAt" label="时间" showTime />
        </Datagrid>
      </List>
    </>
  );
};

