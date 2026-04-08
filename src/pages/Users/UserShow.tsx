import {
  Show,
  SimpleShowLayout,
  TextField,
  EmailField,
  DateField,
  NumberField,
  ReferenceField,
  TabbedShowLayout,
  Tab,
  FunctionField,
} from 'react-admin';
import { formatUtils } from '../../utils/format';
import { useEffect, useState, useCallback } from 'react';
import { useRecordContext, useGetOne, useRefresh } from 'react-admin';
import { useParams } from 'react-router-dom';
import apiClient from '../../services/api';
import { Box, Table, TableBody, TableCell, TableHead, TableRow, IconButton, CircularProgress, Alert, Typography, TextField as MuiTextField, Button, Paper, Chip, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// 格式化续订状态
const formatRenewalStatus = (status?: string) => {
  if (!status) return '未设置';
  const statusMap: Record<string, string> = {
    'auto_renew': '正常续订',
    'onetime': '单次购买',
    'cancelled': '取消订阅',
  };
  return statusMap[status] || status;
};

export const UserShow = () => {
  const record = useRecordContext();
  const { id } = useParams();
  
  // 获取用户ID
  const userId = (record?.id || record?.userId || id) as string;
  
  // 如果 useRecordContext 没有数据，使用 useGetOne 获取
  const { data: fetchedRecord, isLoading } = useGetOne(
    'users',
    { id: userId },
    { enabled: !!userId && !record }
  );
  
  // 使用 fetchedRecord 或 record
  const displayRecord = record || fetchedRecord;
  
  // 调试：输出记录数据
  useEffect(() => {
    if (displayRecord) {
      console.log('[UserShow] Record data:', {
        userId: displayRecord.id || displayRecord.userId,
        hasVirtualCurrency: !!displayRecord.virtualCurrency,
        totalBalance: displayRecord.virtualCurrency?.totalBalance,
        creditsCount: displayRecord.virtualCurrency?.credits?.length || 0,
        credits: displayRecord.virtualCurrency?.credits,
        hasSubscription: !!displayRecord.subscription,
        subscription: displayRecord.subscription,
        rawRecord: displayRecord,
      });
    }
  }, [displayRecord]);

  return (
    <Show>
      <TabbedShowLayout>
      <Tab label="基本信息">
        <SimpleShowLayout>
          <TextField source="id" label="用户ID" />
          <EmailField source="email" label="邮箱" />
          <TextField source="phone" label="手机号" />
          <TextField source="username" label="用户名" />
          <FunctionField
            label="状态"
            render={() => {
              const status = displayRecord?.status;
              if (status === 'pending_deletion') {
                const scheduledAt = displayRecord?.deletionScheduledAt;
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip label="待删除" color="error" size="small" />
                    {scheduledAt && (
                      <Typography variant="body2" color="error">
                        计划删除时间：{new Date(scheduledAt).toLocaleString('zh-CN')}
                      </Typography>
                    )}
                  </Box>
                );
              }
              return formatUtils.status(status);
            }}
          />
          <FunctionField
            label="积分余额（未到期）"
            render={() => {
              const credits = displayRecord?.virtualCurrency?.credits || [];
              const now = new Date();
              let totalBalance = 0;
              credits.forEach((credit: any) => {
                if (credit.expiresAt) {
                  const expiresAt = new Date(credit.expiresAt);
                  if (expiresAt < now) {
                    return;
                  }
                }
                if (credit.remainingAmount > 0) {
                  totalBalance += credit.remainingAmount || 0;
                }
              });
              return totalBalance.toLocaleString();
            }}
          />
          <DateField source="createdAt" label="注册时间" showTime />
          <DateField source="updatedAt" label="更新时间" showTime />
          {displayRecord?.status === 'pending_deletion' && (
            <ForceDeleteButton userId={userId} />
          )}
        </SimpleShowLayout>
      </Tab>
      <Tab label="订阅信息">
        <SimpleShowLayout>
          <FunctionField
            label="套餐名称"
            render={() => displayRecord?.subscription?.planName || '未订阅'}
          />
          <FunctionField
            label="订阅状态"
            render={() => {
              if (!displayRecord?.subscription) return '未订阅';
              const statusMap: Record<string, string> = {
                'active': '已激活',
                'expired': '已过期',
                'cancelled': '已取消',
                'unpaid': '未支付',
                'pending': '待处理',
              };
              return statusMap[displayRecord.subscription.status] || displayRecord.subscription.status || '未知';
            }}
          />
          <FunctionField
            label="到期时间"
            render={() => {
              if (!displayRecord?.subscription?.endDate) return '未设置';
              try {
                return new Date(displayRecord.subscription.endDate).toLocaleString('zh-CN');
              } catch {
                return displayRecord.subscription.endDate;
              }
            }}
          />
          <FunctionField
            label="续订状态"
            render={() => formatRenewalStatus(displayRecord?.subscription?.renewalStatus)}
          />
          <FunctionField
            label="下次续费时间"
            render={() => {
              if (!displayRecord?.subscription?.nextBillingAt) return '未设置';
              try {
                return new Date(displayRecord.subscription.nextBillingAt).toLocaleString('zh-CN');
              } catch {
                return displayRecord.subscription.nextBillingAt;
              }
            }}
          />
        </SimpleShowLayout>
      </Tab>
      <Tab label="积分详情">
        <CreditsDetailsTab userId={userId} />
      </Tab>
    </TabbedShowLayout>
    </Show>
  );
};

// 强制删除用户按钮
const ForceDeleteButton = ({ userId }: { userId: string }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const refresh = useRefresh();

  const handleDelete = useCallback(async () => {
    setLoading(true);
    try {
      await apiClient.delete(`/admin/users/${userId}/force-delete`);
      setOpen(false);
      alert('用户已删除，通知邮件已发送');
      refresh();
    } catch (error: any) {
      console.error('Force delete failed:', error);
      alert('删除失败: ' + (error?.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  }, [userId, refresh]);

  return (
    <Box sx={{ mt: 2 }}>
      <Button
        variant="contained"
        color="error"
        startIcon={<DeleteForeverIcon />}
        onClick={() => setOpen(true)}
      >
        立即删除该用户
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>确认删除用户</DialogTitle>
        <DialogContent>
          <DialogContentText>
            此操作将立即永久删除该用户账号，并向用户发送删除通知邮件。此操作不可撤销。
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} disabled={loading}>取消</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={loading}>
            {loading ? '删除中...' : '确认删除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

// 积分详情标签页组件
const CreditsDetailsTab = ({ userId }: { userId: string }) => {
  const [credits, setCredits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // 积分消耗统计相关状态
  const [dailyStats, setDailyStats] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(false);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30); // 默认30天前
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]; // 今天
  });

  useEffect(() => {
    if (userId) {
      loadCredits();
      loadDailyStats();
    }
  }, [userId, page]);

  useEffect(() => {
    if (userId) {
      loadDailyStats();
    }
  }, [userId, startDate, endDate]);

  const loadCredits = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const response = await apiClient.get(`/admin/users/${userId}/virtual-currency/details`, {
        params: {
          page,
          pageSize,
          sortBy: 'expiresAt',
          order: 'DESC',
        },
      });
      
      if (response.data?.success && response.data?.data) {
        setCredits(response.data.data.items || []);
        setTotal(response.data.data.pagination?.total || 0);
        setTotalPages(response.data.data.pagination?.totalPages || 0);
      }
    } catch (error: any) {
      console.error('Failed to load credits:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDailyStats = async () => {
    if (!userId) return;
    
    setStatsLoading(true);
    try {
      const startTime = new Date(startDate);
      startTime.setHours(0, 0, 0, 0);
      const endTime = new Date(endDate);
      endTime.setHours(23, 59, 59, 999);
      
      const response = await apiClient.get(`/admin/users/${userId}/virtual-currency/daily-debit-stats`, {
        params: {
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
        },
      });
      
      if (response.data?.success && response.data?.data) {
        setDailyStats(response.data.data || []);
      }
    } catch (error: any) {
      console.error('Failed to load daily stats:', error);
      setDailyStats([]);
    } finally {
      setStatsLoading(false);
    }
  };

  // 计算未到期的积分总和
  const now = new Date();
  const validCredits = credits.filter((credit: any) => {
    if (credit.expiresAt) {
      const expiresAt = new Date(credit.expiresAt);
      if (expiresAt < now) {
        return false; // 已过期
      }
    }
    return credit.remainingAmount > 0;
  });
  
  const totalBalance = validCredits.reduce((sum, credit: any) => sum + (credit.remainingAmount || 0), 0);

  return (
    <SimpleShowLayout>
      <FunctionField
        label="总积分余额（未到期）"
        render={() => totalBalance.toLocaleString()}
      />
      <FunctionField
        label="积分项总数"
        render={() => total}
      />
      <FunctionField
        label="有效积分项数量（未到期）"
        render={() => validCredits.length}
      />
      
      {/* 每日积分消耗统计图表 */}
      <Box sx={{ mt: 4, mb: 4 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>每日积分消耗统计</Typography>
          
          {/* 时间段选择器 */}
          <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
            <MuiTextField
              label="开始日期"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              size="small"
            />
            <MuiTextField
              label="结束日期"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
              size="small"
            />
            <Button
              variant="outlined"
              onClick={() => {
                const date = new Date();
                date.setDate(date.getDate() - 7);
                setStartDate(date.toISOString().split('T')[0]);
                setEndDate(new Date().toISOString().split('T')[0]);
              }}
              size="small"
            >
              最近7天
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                const date = new Date();
                date.setDate(date.getDate() - 30);
                setStartDate(date.toISOString().split('T')[0]);
                setEndDate(new Date().toISOString().split('T')[0]);
              }}
              size="small"
            >
              最近30天
            </Button>
            <Button
              variant="outlined"
              onClick={() => {
                const date = new Date();
                date.setDate(date.getDate() - 90);
                setStartDate(date.toISOString().split('T')[0]);
                setEndDate(new Date().toISOString().split('T')[0]);
              }}
              size="small"
            >
              最近90天
            </Button>
          </Box>

          {/* 折线图 */}
          {statsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : dailyStats.length === 0 ? (
            <Alert severity="info">该时间段内暂无积分消耗记录</Alert>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={dailyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  label={{ value: '消耗积分', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: any) => [`${value.toLocaleString()} 积分`, '消耗积分']}
                  labelFormatter={(label) => `日期: ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="消耗积分"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Paper>
      </Box>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : credits.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>暂无积分记录</Alert>
      ) : (
        <>
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>积分明细</Typography>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>积分ID</TableCell>
                  <TableCell align="right">总积分</TableCell>
                  <TableCell align="right">剩余积分</TableCell>
                  <TableCell>来源</TableCell>
                  <TableCell>到期时间</TableCell>
                  <TableCell>状态</TableCell>
                  <TableCell>创建时间</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {credits.map((credit: any, index: number) => {
                  const expiresAt = credit.expiresAt ? new Date(credit.expiresAt) : null;
                  const isExpired = credit.isExpired || (expiresAt && expiresAt < now);
                  const isActive = credit.isActive || (credit.remainingAmount > 0 && !isExpired);
                  
                  return (
                    <TableRow
                      key={credit.creditId || index}
                      sx={{
                        opacity: isExpired ? 0.6 : 1,
                        backgroundColor: isExpired ? '#f5f5f5' : 'transparent',
                      }}
                    >
                      <TableCell sx={{ fontSize: '12px' }}>{credit.creditId || '-'}</TableCell>
                      <TableCell align="right">{credit.totalAmount || 0}</TableCell>
                      <TableCell align="right">{credit.remainingAmount || 0}</TableCell>
                      <TableCell sx={{ fontSize: '12px' }}>{credit.source || '-'}</TableCell>
                      <TableCell sx={{ fontSize: '12px' }}>
                        {expiresAt 
                          ? expiresAt.toLocaleString('zh-CN')
                          : '永不过期'}
                      </TableCell>
                      <TableCell>
                        {isExpired ? (
                          <span style={{ color: '#999' }}>已过期</span>
                        ) : isActive ? (
                          <span style={{ color: '#4caf50' }}>有效</span>
                        ) : (
                          <span style={{ color: '#999' }}>已用完</span>
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '12px' }}>
                        {credit.createdAt 
                          ? new Date(credit.createdAt).toLocaleString('zh-CN')
                          : '-'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>

          {/* 分页控件 */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 2 }}>
              <IconButton
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1 || loading}
              >
                <ChevronLeftIcon />
              </IconButton>
              <Typography>
                第 {page} 页 / 共 {totalPages} 页（共 {total} 条记录）
              </Typography>
              <IconButton
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                disabled={page === totalPages || loading}
              >
                <ChevronRightIcon />
              </IconButton>
            </Box>
          )}
        </>
      )}
    </SimpleShowLayout>
  );
};

