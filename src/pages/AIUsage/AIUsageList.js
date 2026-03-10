import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect, useMemo } from 'react';
import { List, Datagrid, TextField, NumberField, DateField, Filter, TextInput, useNotify, TopToolbar, ExportButton, } from 'react-admin';
import { Box, Card, CardContent, Typography, Grid, CircularProgress, ButtonGroup, Button, Alert } from '@mui/material';
import { aiUsageService } from '../../services/aiUsage';
import { formatUtils } from '../../utils/format';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
const AIUsageFilter = (props) => (_jsxs(Filter, { ...props, children: [_jsx(TextInput, { source: "userId", label: "\u7528\u6237ID" }), _jsx(TextInput, { source: "modelId", label: "\u6A21\u578BID" })] }));
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];
const AIUsageEmpty = () => (_jsx(Box, { sx: { p: 3, textAlign: 'center' }, children: _jsx(Alert, { severity: "info", children: "\u8BE5\u65F6\u95F4\u6BB5\u5185\u6682\u65E0\u4F7F\u7528\u8BB0\u5F55" }) }));
export const AIUsageList = () => {
    const [statistics, setStatistics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [dateRange, setDateRange] = useState('7d');
    const notify = useNotify();
    const { startTime, endTime } = useMemo(() => {
        const end = new Date();
        const endMs = end.getTime();
        let startMs;
        if (dateRange === 'today') {
            startMs = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 0, 0, 0).getTime();
        }
        else if (dateRange === '7d') {
            startMs = endMs - 7 * 24 * 60 * 60 * 1000;
        }
        else {
            startMs = endMs - 30 * 24 * 60 * 60 * 1000;
        }
        return { startTime: startMs, endTime: endMs };
    }, [dateRange]);
    useEffect(() => {
        const fetchStatistics = async () => {
            try {
                setLoading(true);
                const response = await aiUsageService.getStatistics({ startTime, endTime });
                setStatistics(response.data);
            }
            catch (error) {
                console.error('获取统计信息失败:', error);
                const errorMessage = error.response?.data?.error?.message || error.message || '获取统计信息失败';
                notify(errorMessage, { type: 'error' });
            }
            finally {
                setLoading(false);
            }
        };
        fetchStatistics();
    }, [notify, startTime, endTime]);
    return (_jsxs(_Fragment, { children: [loading ? (_jsx(Box, { sx: { display: 'flex', justifyContent: 'center', p: 3 }, children: _jsx(CircularProgress, {}) })) : statistics && (_jsxs(Box, { sx: { p: 3 }, children: [_jsx(Box, { sx: { display: 'flex', justifyContent: 'flex-end', mb: 2 }, children: _jsxs(ButtonGroup, { size: "small", variant: "outlined", children: [_jsx(Button, { color: dateRange === 'today' ? 'primary' : 'inherit', onClick: () => setDateRange('today'), children: "\u4ECA\u65E5" }), _jsx(Button, { color: dateRange === '7d' ? 'primary' : 'inherit', onClick: () => setDateRange('7d'), children: "\u6700\u8FD17\u5929" }), _jsx(Button, { color: dateRange === '30d' ? 'primary' : 'inherit', onClick: () => setDateRange('30d'), children: "\u6700\u8FD130\u5929" })] }) }), _jsxs(Grid, { container: true, spacing: 3, sx: { mb: 3 }, children: [_jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { color: "textSecondary", gutterBottom: true, variant: "body2", children: "\u603B\u8BF7\u6C42\u6570" }), _jsx(Typography, { variant: "h4", children: statistics.totalRequests.toLocaleString() })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { color: "textSecondary", gutterBottom: true, variant: "body2", children: "\u603BToken\u6570" }), _jsx(Typography, { variant: "h4", children: statistics.totalTokens.toLocaleString() })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 4, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { color: "textSecondary", gutterBottom: true, variant: "body2", children: "\u603B\u6210\u672C\uFF08\u79EF\u5206\uFF09" }), _jsxs(Typography, { variant: "h4", children: [formatUtils.number(statistics.totalCost), " \u79EF\u5206"] })] }) }) })] }), statistics.byModel && statistics.byModel.length > 0 && (_jsxs(Grid, { container: true, spacing: 3, sx: { mb: 3 }, children: [_jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "\u6309\u6A21\u578B\u5206\u5E03\uFF08\u8BF7\u6C42\u6570\uFF09" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: statistics.byModel, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "modelName" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Bar, { dataKey: "requests", fill: "#8884d8", name: "\u8BF7\u6C42\u6570" })] }) })] }) }) }), _jsx(Grid, { item: true, xs: 12, md: 6, children: _jsx(Card, { children: _jsxs(CardContent, { children: [_jsx(Typography, { variant: "h6", gutterBottom: true, children: "\u6309\u6A21\u578B\u5206\u5E03\uFF08Token\u6570\uFF09" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(PieChart, { children: [_jsx(Pie, { data: statistics.byModel, cx: "50%", cy: "50%", labelLine: false, label: ({ modelName, percent }) => `${modelName} ${(percent * 100).toFixed(0)}%`, outerRadius: 80, fill: "#8884d8", dataKey: "tokens", children: statistics.byModel.map((entry, index) => (_jsx(Cell, { fill: COLORS[index % COLORS.length] }, `cell-${index}`))) }), _jsx(Tooltip, {})] }) })] }) }) })] }))] })), _jsx(List, { filters: _jsx(AIUsageFilter, {}), filter: { startTime, endTime }, actions: _jsx(TopToolbar, { children: _jsx(ExportButton, {}) }), title: "AI \u4F7F\u7528\u8BB0\u5F55", empty: _jsx(AIUsageEmpty, {}), children: _jsxs(Datagrid, { children: [_jsx(TextField, { source: "userId", label: "\u7528\u6237ID" }), _jsx(TextField, { source: "modelName", label: "\u6A21\u578B\u540D\u79F0" }), _jsx(NumberField, { source: "inputTokens", label: "\u8F93\u5165Tokens" }), _jsx(NumberField, { source: "outputTokens", label: "\u8F93\u51FATokens" }), _jsx(NumberField, { source: "totalTokens", label: "\u603BTokens" }), _jsx(NumberField, { source: "cost", label: "\u6210\u672C\uFF08\u79EF\u5206\uFF09" }), _jsx(DateField, { source: "createdAt", label: "\u65F6\u95F4", showTime: true })] }) })] }));
};
