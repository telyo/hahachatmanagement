import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { useGetList, usePermissions } from 'react-admin';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, Alert, ButtonGroup, Button, TextField } from '@mui/material';
import { People as PeopleIcon, AttachMoney as MoneyIcon, TrendingUp as TrendingUpIcon, Chat as ChatIcon, } from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { statisticsService } from '../../services/statistics';
import { formatUtils } from '../../utils/format';
import { isLoginPage } from '../../utils/routing';
import { authUtils } from '../../utils/auth';
import { hasPermission } from '../../utils/permissions';
const StatCard = ({ title, value, icon: Icon, color }) => (_jsx(Card, { children: _jsx(CardContent, { children: _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' }, children: [_jsxs(Box, { children: [_jsx(Typography, { color: "textSecondary", gutterBottom: true, variant: "body2", children: title }), _jsx(Typography, { variant: "h4", children: value })] }), _jsx(Icon, { sx: { fontSize: 48, color } })] }) }) }));
export const Dashboard = () => {
    const { permissions } = usePermissions();
    const adminInfo = authUtils.getAdminInfo();
    const canAccessDashboard = hasPermission(permissions, 'dashboard:read', adminInfo?.role);
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dateRange, setDateRange] = useState('7d');
    const [startDate, setStartDate] = useState(() => {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
    const { startTime, endTime, isTodayRange } = useMemo(() => {
        const end = new Date();
        const endMs = end.getTime();
        let startMs;
        if (dateRange === 'today') {
            startMs = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0).getTime();
            return { startTime: startMs, endTime: endMs, isTodayRange: true };
        }
        else if (dateRange === '7d') {
            startMs = endMs - 7 * 24 * 60 * 60 * 1000;
            return { startTime: startMs, endTime: endMs, isTodayRange: false };
        }
        else if (dateRange === '30d') {
            startMs = endMs - 30 * 24 * 60 * 60 * 1000;
            return { startTime: startMs, endTime: endMs, isTodayRange: false };
        }
        else {
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
                }
                catch (err) {
                    if (err.response?.status === 404) {
                        setStatistics(null);
                    }
                    else {
                        throw err;
                    }
                }
            }
            catch (err) {
                console.error('获取统计数据失败:', err);
                setError(err.message || '获取统计数据失败');
                setStatistics(null);
            }
            finally {
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
    });
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
        return (_jsx(Box, { sx: { p: 3 }, children: _jsx(Alert, { severity: "warning", sx: { m: 2 }, children: "\u60A8\u6CA1\u6709\u67E5\u770B\u4EEA\u8868\u76D8\u7684\u6743\u9650\u3002\u5982\u9700\u4F7F\u7528\uFF0C\u8BF7\u8054\u7CFB\u8D85\u7EA7\u7BA1\u7406\u5458\u3002" }) }));
    }
    if (loading) {
        return (_jsx(Box, { sx: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }, children: _jsx(CircularProgress, {}) }));
    }
    return (_jsxs(Box, { sx: { p: 3 }, children: [_jsxs(Box, { sx: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }, children: [_jsx(Typography, { variant: "h4", children: "\u4EEA\u8868\u76D8" }), _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }, children: [_jsxs(ButtonGroup, { size: "small", variant: "outlined", children: [_jsx(Button, { color: dateRange === 'today' ? 'primary' : 'inherit', onClick: () => setDateRange('today'), children: "\u4ECA\u65E5" }), _jsx(Button, { color: dateRange === '7d' ? 'primary' : 'inherit', onClick: () => setDateRange('7d'), children: "\u6700\u8FD17\u5929" }), _jsx(Button, { color: dateRange === '30d' ? 'primary' : 'inherit', onClick: () => setDateRange('30d'), children: "\u6700\u8FD130\u5929" }), _jsx(Button, { color: dateRange === 'custom' ? 'primary' : 'inherit', onClick: () => setDateRange('custom'), children: "\u81EA\u5B9A\u4E49" })] }), _jsxs(Box, { sx: { display: 'flex', alignItems: 'center', gap: 1 }, children: [_jsx(TextField, { label: "\u5F00\u59CB\u65E5\u671F", type: "date", value: dateRange === 'custom'
                                            ? startDate
                                            : (() => {
                                                const d = new Date();
                                                if (dateRange === 'today')
                                                    return d.toISOString().split('T')[0];
                                                if (dateRange === '7d')
                                                    d.setDate(d.getDate() - 6);
                                                else if (dateRange === '30d')
                                                    d.setDate(d.getDate() - 29);
                                                return d.toISOString().split('T')[0];
                                            })(), onChange: (e) => {
                                            setStartDate(e.target.value);
                                            setDateRange('custom');
                                        }, InputLabelProps: { shrink: true }, size: "small", sx: { width: 160 } }), _jsx(TextField, { label: "\u7ED3\u675F\u65E5\u671F", type: "date", value: dateRange === 'custom' ? endDate : new Date().toISOString().split('T')[0], onChange: (e) => {
                                            setEndDate(e.target.value);
                                            setDateRange('custom');
                                        }, InputLabelProps: { shrink: true }, size: "small", sx: { width: 160 }, inputProps: { max: new Date().toISOString().split('T')[0] } })] })] })] }), error && (_jsxs(Alert, { severity: "warning", sx: { mb: 2 }, children: [error, "\uFF0C\u90E8\u5206\u6570\u636E\u4F7F\u7528\u6A21\u62DF\u6570\u636E"] })), !statistics && (_jsx(Alert, { severity: "info", sx: { mb: 2 }, children: "\u7EDF\u8BA1\u6570\u636E\u63A5\u53E3\u672A\u5B9E\u73B0\uFF0C\u5F53\u524D\u663E\u793A\u6A21\u62DF\u6570\u636E" })), _jsxs(Grid, { container: true, spacing: 3, sx: { mt: 2 }, children: [_jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(StatCard, { title: "\u603B\u7528\u6237\u6570", value: totalUsers.toLocaleString(), icon: PeopleIcon, color: "primary.main" }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(StatCard, { title: isTodayRange ? '今日新增' : '时段内新增', value: newCount.toLocaleString(), icon: TrendingUpIcon, color: "success.main" }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(StatCard, { title: isTodayRange ? '今日收入' : '时段内收入', value: formatUtils.currency(revenueCount), icon: MoneyIcon, color: "warning.main" }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(StatCard, { title: isTodayRange ? '今日AI请求' : '时段内AI请求', value: requestsCount.toLocaleString(), icon: ChatIcon, color: "info.main" }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "\u7528\u6237\u589E\u957F\u8D8B\u52BF" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: userGrowthData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "count", stroke: "#8884d8", name: "\u7528\u6237\u6570" })] }) })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "\u6536\u5165\u8D8B\u52BF" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: revenueData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "amount", stroke: "#82ca9d", name: "\u6536\u5165" })] }) })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "AI \u4F7F\u7528\u5206\u5E03" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: aiDistributionData, cx: "50%", cy: "50%", labelLine: false, label: ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`, outerRadius: 80, fill: "#8884d8", dataKey: "value", children: aiDistributionData.map((entry, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, `cell-${index}`))) }), _jsx(Tooltip, {})] }) })] }) }) }), topModelsData.length > 0 && (_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "\u70ED\u95E8\u6A21\u578B\u6392\u884C" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: topModelsData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "modelName" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Bar, { dataKey: "requests", fill: "#8884d8", name: "\u8BF7\u6C42\u6570" })] }) })] }) }) }))] })] }));
};
