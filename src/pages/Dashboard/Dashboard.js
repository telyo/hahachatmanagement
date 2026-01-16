import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { useGetList, usePermissions } from 'react-admin';
import { Box, Grid, Card, CardContent, Typography, CircularProgress, Alert } from '@mui/material';
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
    useEffect(() => {
        // 如果在登录页或没有 token，不加载数据
        const onLoginPage = isLoginPage();
        const token = authUtils.getToken();
        if (onLoginPage || !token) {
            if (import.meta.env.DEV) {
                console.log('[Dashboard] 在登录页或没有 token，跳过数据加载');
            }
            setLoading(false);
            return;
        }
        const fetchStatistics = async () => {
            try {
                setLoading(true);
                // 尝试获取统计数据，如果接口不存在则使用模拟数据
                try {
                    const response = await statisticsService.getStatistics();
                    setStatistics(response.data);
                }
                catch (err) {
                    // 如果接口不存在（404），使用模拟数据
                    if (err.response?.status === 404) {
                        console.warn('统计数据接口未实现，使用模拟数据');
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
    }, []);
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
    const newToday = statistics?.users?.newToday || 0;
    const todayRevenue = statistics?.revenue?.today || 0;
    const requestsToday = statistics?.ai?.requestsToday || 0;
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
    return (_jsxs(Box, { sx: { p: 3 }, children: [_jsx(Typography, { variant: "h4", gutterBottom: true, children: "\u4EEA\u8868\u76D8" }), error && (_jsxs(Alert, { severity: "warning", sx: { mb: 2 }, children: [error, "\uFF0C\u90E8\u5206\u6570\u636E\u4F7F\u7528\u6A21\u62DF\u6570\u636E"] })), !statistics && (_jsx(Alert, { severity: "info", sx: { mb: 2 }, children: "\u7EDF\u8BA1\u6570\u636E\u63A5\u53E3\u672A\u5B9E\u73B0\uFF0C\u5F53\u524D\u663E\u793A\u6A21\u62DF\u6570\u636E" })), _jsxs(Grid, { container: true, spacing: 3, sx: { mt: 2 }, children: [_jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(StatCard, { title: "\u603B\u7528\u6237\u6570", value: totalUsers.toLocaleString(), icon: PeopleIcon, color: "primary.main" }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(StatCard, { title: "\u4ECA\u65E5\u65B0\u589E", value: newToday.toLocaleString(), icon: TrendingUpIcon, color: "success.main" }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(StatCard, { title: "\u4ECA\u65E5\u6536\u5165", value: formatUtils.currency(todayRevenue), icon: MoneyIcon, color: "warning.main" }) }), _jsx(Grid, { item: true, xs: 12, sm: 6, md: 3, children: _jsx(StatCard, { title: "\u4ECA\u65E5AI\u8BF7\u6C42", value: requestsToday.toLocaleString(), icon: ChatIcon, color: "info.main" }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "\u7528\u6237\u589E\u957F\u8D8B\u52BF" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: userGrowthData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "count", stroke: "#8884d8", name: "\u7528\u6237\u6570" })] }) })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "\u6536\u5165\u8D8B\u52BF" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(LineChart, { data: revenueData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "date" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "amount", stroke: "#82ca9d", name: "\u6536\u5165" })] }) })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "AI \u4F7F\u7528\u5206\u5E03" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: aiDistributionData, cx: "50%", cy: "50%", labelLine: false, label: ({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`, outerRadius: 80, fill: "#8884d8", dataKey: "value", children: aiDistributionData.map((entry, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, `cell-${index}`))) }), _jsx(Tooltip, {})] }) })] }) }) }), topModelsData.length > 0 && (_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "\u70ED\u95E8\u6A21\u578B\u6392\u884C" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: topModelsData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "modelName" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Bar, { dataKey: "requests", fill: "#8884d8", name: "\u8BF7\u6C42\u6570" })] }) })] }) }) }))] })] }));
};
