import { useState, useEffect, useMemo } from 'react';
import { useGetList, usePermissions } from 'react-admin';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, Alert, ButtonGroup, Button, TextField } from '@mui/material';
import {
  People as PeopleIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  Chat as ChatIcon,
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { statisticsService } from '../../services/statistics';
import { Statistics } from '../../types/statistics';
import { formatUtils } from '../../utils/format';
import { isLoginPage } from '../../utils/routing';
import { authUtils } from '../../utils/auth';
import { hasPermission } from '../../utils/permissions';

const StatCard = ({ title, value, icon: Icon, color }: any) => (
  <Card>
    <CardContent>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography color="textSecondary" gutterBottom variant="body2">
            {title}
          </Typography>
          <Typography variant="h4">{value}</Typography>
        </Box>
        <Icon sx={{ fontSize: 48, color }} />
      </Box>
    </CardContent>
  </Card>
);

export const Dashboard = () => {
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const canAccessDashboard = hasPermission(permissions, 'dashboard:read', adminInfo?.role);

  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<'today' | '7d' | '30d' | 'custom'>('7d');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const { startTime, endTime, isTodayRange } = useMemo(() => {
    const end = new Date();
    const endMs = end.getTime();
    let startMs: number;
    if (dateRange === 'today') {
      startMs = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0).getTime();
      return { startTime: startMs, endTime: endMs, isTodayRange: true };
    } else if (dateRange === '7d') {
      startMs = endMs - 7 * 24 * 60 * 60 * 1000;
      return { startTime: startMs, endTime: endMs, isTodayRange: false };
    } else if (dateRange === '30d') {
      startMs = endMs - 30 * 24 * 60 * 60 * 1000;
      return { startTime: startMs, endTime: endMs, isTodayRange: false };
    } else {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const endD = new Date(endDate);
      endD.setHours(23, 59, 59, 999);
      const sameDay = startDate === endDate;
      return {
        startTime: start.getTime(),
        endTime: endD.getTime(),
        isTodayRange: sameDay,
      };
    }
  }, [dateRange, startDate, endDate]);

  useEffect(() => {
    const onLoginPage = isLoginPage();
    const token = authUtils.getToken();
    if (onLoginPage || !token) {
      setLoading(false);
      return;
    }

    const fetchStatistics = async () => {
      try {
        setLoading(true);
        try {
          const response = await statisticsService.getStatistics({ startTime, endTime });
          setStatistics(response.data);
        } catch (err: any) {
          if (err.response?.status === 404) {
            setStatistics(null);
          } else {
            throw err;
          }
        }
      } catch (err: any) {
        console.error('获取统计数据失败:', err);
        setError(err.message || '获取统计数据失败');
        setStatistics(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStatistics();
  }, [startTime, endTime]);

  // 检查是否应该获取数据
  const onLoginPage = isLoginPage();
  const token = authUtils.getToken();
  const shouldFetchUsers = !onLoginPage && !!token;

  // 注意：React hooks 必须在顶层调用，但 dataProvider 已经添加了登录页检查
  // 所以即使调用 useGetList，dataProvider 也会阻止请求
  const { data: users } = useGetList('users', {
    pagination: { page: 1, perPage: 1 },
  }, {
    // 如果不需要获取，传递一个特殊的选项让 dataProvider 知道
    enabled: shouldFetchUsers,
  } as any);

  const totalUsers = statistics?.users?.total || users?.total || 0;
  // 当传入时间段时，后端返回 newInRange/revenueInRange；否则用 newToday/today
  const newCount = (statistics?.users?.newInRange ?? statistics?.users?.newToday) ?? 0;
  const revenueCount = (statistics?.revenue?.revenueInRange ?? statistics?.revenue?.today) ?? 0;
  const requestsCount = statistics?.ai?.requestsToday ?? 0;

  // 使用真实数据或模拟数据
  const userGrowthData = statistics?.users?.growth || [
    { date: '2024-01', count: 100 },
    { date: '2024-02', count: 150 },
    { date: '2024-03', count: 200 },
    { date: '2024-04', count: 250 },
  ];

  const revenueData = statistics?.revenue?.trend || [
    { date: '2024-01', amount: 1000 },
    { date: '2024-02', amount: 1500 },
    { date: '2024-03', amount: 2000 },
    { date: '2024-04', amount: 2500 },
  ];

  const aiDistributionData = statistics?.ai?.distribution?.map((item) => ({
    name: item.modelName,
    value: item.requests,
  })) || [
    { name: 'GPT-4', value: 400 },
    { name: 'Claude', value: 300 },
    { name: 'Gemini', value: 200 },
    { name: '其他', value: 100 },
  ];

  const topModelsData = statistics?.ai?.topModels || [];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // 检查权限
  if (!canAccessDashboard) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning" sx={{ m: 2 }}>
          您没有查看仪表盘的权限。如需使用，请联系超级管理员。
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Typography variant="h4">
          仪表盘
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
          <ButtonGroup size="small" variant="outlined">
            <Button color={dateRange === 'today' ? 'primary' : 'inherit'} onClick={() => setDateRange('today')}>
              今日
            </Button>
            <Button color={dateRange === '7d' ? 'primary' : 'inherit'} onClick={() => setDateRange('7d')}>
              最近7天
            </Button>
            <Button color={dateRange === '30d' ? 'primary' : 'inherit'} onClick={() => setDateRange('30d')}>
              最近30天
            </Button>
            <Button
              color={dateRange === 'custom' ? 'primary' : 'inherit'}
              onClick={() => setDateRange('custom')}
            >
              自定义
            </Button>
          </ButtonGroup>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TextField
              label="开始日期"
              type="date"
              value={
                dateRange === 'custom'
                  ? startDate
                  : (() => {
                      const d = new Date();
                      if (dateRange === 'today') return d.toISOString().split('T')[0];
                      if (dateRange === '7d') d.setDate(d.getDate() - 6);
                      else if (dateRange === '30d') d.setDate(d.getDate() - 29);
                      return d.toISOString().split('T')[0];
                    })()
              }
              onChange={(e) => {
                setStartDate(e.target.value);
                setDateRange('custom');
              }}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ width: 160 }}
            />
            <TextField
              label="结束日期"
              type="date"
              value={dateRange === 'custom' ? endDate : new Date().toISOString().split('T')[0]}
              onChange={(e) => {
                setEndDate(e.target.value);
                setDateRange('custom');
              }}
              InputLabelProps={{ shrink: true }}
              size="small"
              sx={{ width: 160 }}
              inputProps={{ max: new Date().toISOString().split('T')[0] }}
            />
          </Box>
        </Box>
      </Box>

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {error}，部分数据使用模拟数据
        </Alert>
      )}

      {!statistics && (
        <Alert severity="info" sx={{ mb: 2 }}>
          统计数据接口未实现，当前显示模拟数据
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="总用户数"
            value={totalUsers.toLocaleString()}
            icon={PeopleIcon}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={isTodayRange ? '今日新增' : '时段内新增'}
            value={newCount.toLocaleString()}
            icon={TrendingUpIcon}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={isTodayRange ? '今日收入' : '时段内收入'}
            value={formatUtils.currency(revenueCount)}
            icon={MoneyIcon}
            color="warning.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title={isTodayRange ? '今日AI请求' : '时段内AI请求'}
            value={requestsCount.toLocaleString()}
            icon={ChatIcon}
            color="info.main"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                用户增长趋势
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={userGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="count" stroke="#8884d8" name="用户数" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                收入趋势
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="amount" stroke="#82ca9d" name="收入" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                AI 使用分布
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={aiDistributionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {aiDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {topModelsData.length > 0 && (
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  热门模型排行
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topModelsData}>
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
        )}
      </Grid>
    </Box>
  );
};

