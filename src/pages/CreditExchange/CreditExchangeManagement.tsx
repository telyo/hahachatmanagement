import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { useNotify, usePermissions } from 'react-admin';
import apiClient from '../../services/api';
import { hasPermission } from '../../utils/permissions';
import { authUtils } from '../../utils/auth';

interface RedeemCode {
  code: string;
  amount: number;
  expiresAt: string;
  creditValidityDays: number;
  maxUseCount: number;
  usedCount: number;
  usedByUserIds: string[];
  remark: string;
  createdAt: string;
  updatedAt: string;
}

interface InviteConfig {
  configId: string;
  inviterCredits: number;
  inviteeCredits: number;
  creditValidityDays: number;
  inviteDailyLimit: number;
  inviteTotalLimit: number;
  createdAt: string;
  updatedAt: string;
}

interface RegisterCreditConfig {
  configId: string;
  amount: number;
  creditValidityDays: number;
  createdAt: string;
  updatedAt: string;
}

interface RedeemCodeUsage {
  code: string;
  userEmail: string;
  amount: number;
  createdAt: string;
}

interface InviteRecord {
  inviterEmail: string;
  inviteeEmail: string;
  inviterCredits: number;
  inviteeCredits: number;
  inviterCreditsGrantedAt?: string;
  createdAt: string;
}

export const CreditExchangeManagement = () => {
  const notify = useNotify();
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const userRole = adminInfo?.role;

  const canRead = hasPermission(permissions, 'credit_exchange:read', userRole);
  const canWrite = hasPermission(permissions, 'credit_exchange:write', userRole);

  // 兑换码列表
  const [redeemCodes, setRedeemCodes] = useState<RedeemCode[]>([]);
  const [redeemCodesLoading, setRedeemCodesLoading] = useState(false);
  const rowsPerPage = 20;

  // 注册初始积分配置
  const [registerCreditConfig, setRegisterCreditConfig] = useState<RegisterCreditConfig | null>(null);
  const [registerCreditLoading, setRegisterCreditLoading] = useState(false);
  const [registerCreditSaving, setRegisterCreditSaving] = useState(false);

  // 邀请配置
  const [inviteConfig, setInviteConfig] = useState<InviteConfig | null>(null);
  const [inviteConfigLoading, setInviteConfigLoading] = useState(false);
  const [inviteConfigSaving, setInviteConfigSaving] = useState(false);

  // 兑换码编辑弹窗
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    amount: 100,
    expiresAt: '',
    creditValidityDays: 0,
    maxUseCount: 0,
    remark: '',
  });
  const [formSaving, setFormSaving] = useState(false);

  // Tab 与记录
  const [tabValue, setTabValue] = useState(0);
  const [redeemUsages, setRedeemUsages] = useState<RedeemCodeUsage[]>([]);
  const [redeemUsagesLoading, setRedeemUsagesLoading] = useState(false);
  const [inviteRecords, setInviteRecords] = useState<InviteRecord[]>([]);
  const [inviteRecordsLoading, setInviteRecordsLoading] = useState(false);

  const loadRedeemCodes = useCallback(async () => {
    if (!canRead) return;
    try {
      setRedeemCodesLoading(true);
      const params = new URLSearchParams({ limit: String(rowsPerPage) });
      const response = await apiClient.get(
        `/admin/credit-exchange/redeem-codes?${params}`
      );
      const data = response.data?.data || {};
      setRedeemCodes(data.items || []);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string }; message?: string } } };
      notify(err.response?.data?.error?.message || err.response?.data?.message || '加载兑换码列表失败', {
        type: 'error',
      });
    } finally {
      setRedeemCodesLoading(false);
    }
  }, [canRead, notify]);

  const loadRegisterCreditConfig = useCallback(async () => {
    if (!canRead) return;
    try {
      setRegisterCreditLoading(true);
      const response = await apiClient.get('/admin/credit-exchange/register-credit-config');
      const data = response.data?.data || {};
      setRegisterCreditConfig({
        configId: data.configId || 'register_credit_config',
        amount: data.amount ?? 0,
        creditValidityDays: data.creditValidityDays ?? 0,
        createdAt: data.createdAt || '',
        updatedAt: data.updatedAt || '',
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string }; message?: string } } };
      notify(err.response?.data?.error?.message || err.response?.data?.message || '加载注册初始积分配置失败', {
        type: 'error',
      });
    } finally {
      setRegisterCreditLoading(false);
    }
  }, [canRead, notify]);

  const loadInviteConfig = useCallback(async () => {
    if (!canRead) return;
    try {
      setInviteConfigLoading(true);
      const response = await apiClient.get('/admin/credit-exchange/invite-config');
      const data = response.data?.data || {};
      setInviteConfig({
        configId: data.configId || 'invite_config',
        inviterCredits: data.inviterCredits ?? 0,
        inviteeCredits: data.inviteeCredits ?? 0,
        creditValidityDays: data.creditValidityDays ?? 0,
        inviteDailyLimit: data.inviteDailyLimit ?? 3,
        inviteTotalLimit: data.inviteTotalLimit ?? 10,
        createdAt: data.createdAt || '',
        updatedAt: data.updatedAt || '',
      });
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      notify(err.response?.data?.error?.message || err.response?.data?.message || '加载邀请配置失败', {
        type: 'error',
      });
    } finally {
      setInviteConfigLoading(false);
    }
  }, [canRead, notify]);

  useEffect(() => {
    if (canRead) {
      loadRedeemCodes();
    }
  }, [canRead, loadRedeemCodes]);

  useEffect(() => {
    if (canRead) {
      loadRegisterCreditConfig();
    }
  }, [canRead, loadRegisterCreditConfig]);

  useEffect(() => {
    if (canRead) {
      loadInviteConfig();
    }
  }, [canRead, loadInviteConfig]);

  const loadRedeemUsages = useCallback(async () => {
    if (!canRead) return;
    try {
      setRedeemUsagesLoading(true);
      const params = new URLSearchParams({ limit: String(rowsPerPage) });
      const response = await apiClient.get(`/admin/credit-exchange/redeem-usages?${params}`);
      const data = response.data?.data || {};
      setRedeemUsages(data.items || []);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      notify(err.response?.data?.error?.message || err.response?.data?.message || '加载兑换记录失败', {
        type: 'error',
      });
    } finally {
      setRedeemUsagesLoading(false);
    }
  }, [canRead, notify]);

  const loadInviteRecords = useCallback(async () => {
    if (!canRead) return;
    try {
      setInviteRecordsLoading(true);
      const params = new URLSearchParams({ limit: String(rowsPerPage) });
      const response = await apiClient.get(`/admin/credit-exchange/invite-records?${params}`);
      const data = response.data?.data || {};
      setInviteRecords(data.items || []);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      notify(err.response?.data?.error?.message || err.response?.data?.message || '加载邀请记录失败', {
        type: 'error',
      });
    } finally {
      setInviteRecordsLoading(false);
    }
  }, [canRead, notify]);

  useEffect(() => {
    if (canRead && tabValue === 1) {
      loadRedeemUsages();
    }
  }, [canRead, tabValue, loadRedeemUsages]);

  useEffect(() => {
    if (canRead && tabValue === 2) {
      loadInviteRecords();
    }
  }, [canRead, tabValue, loadInviteRecords]);

  const handleCreateRedeemCode = () => {
    setEditingCode(null);
    setFormData({
      code: '',
      amount: 100,
      expiresAt: '',
      creditValidityDays: 0,
      maxUseCount: 0,
      remark: '',
    });
    setEditDialogOpen(true);
  };

  const handleEditRedeemCode = (record: RedeemCode) => {
    setEditingCode(record.code);
    setFormData({
      code: record.code,
      amount: record.amount,
      expiresAt: toDateTimeLocalValue(record.expiresAt || ''),
      creditValidityDays: record.creditValidityDays ?? 0,
      maxUseCount: record.maxUseCount || 0,
      remark: record.remark || '',
    });
    setEditDialogOpen(true);
  };

  const handleSaveRedeemCode = async () => {
    if (!canWrite) {
      notify('无权限', { type: 'error' });
      return;
    }
    try {
      setFormSaving(true);
      if (editingCode) {
        const toRfc3339 = (s: string) => (s?.trim() ? (s.endsWith('Z') ? s : `${s}:00Z`) : undefined);
        await apiClient.put(`/admin/credit-exchange/redeem-codes/${editingCode}`, {
          amount: formData.amount,
          expiresAt: toRfc3339(formData.expiresAt),
          creditValidityDays: formData.creditValidityDays ?? 0,
          maxUseCount: formData.maxUseCount || undefined,
          remark: formData.remark || undefined,
        });
        notify('兑换码更新成功', { type: 'success' });
      } else {
        if (!formData.code.trim()) {
          notify('兑换码不能为空', { type: 'error' });
          return;
        }
        if (formData.amount < 1) {
          notify('积分数额必须大于 0', { type: 'error' });
          return;
        }
        const toRfc3339 = (s: string) => (s?.trim() ? (s.endsWith('Z') ? s : `${s}:00Z`) : undefined);
        await apiClient.post('/admin/credit-exchange/redeem-codes', {
          code: formData.code.trim(),
          amount: formData.amount,
          expiresAt: toRfc3339(formData.expiresAt),
          creditValidityDays: formData.creditValidityDays ?? 0,
          maxUseCount: formData.maxUseCount || undefined,
          remark: formData.remark || undefined,
        });
        notify('兑换码创建成功', { type: 'success' });
      }
      setEditDialogOpen(false);
      loadRedeemCodes();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      notify(err.response?.data?.error?.message || err.response?.data?.message || '保存失败', { type: 'error' });
    } finally {
      setFormSaving(false);
    }
  };

  const handleDeleteRedeemCode = async (code: string) => {
    if (!canWrite || !window.confirm(`确定要删除兑换码 "${code}" 吗？`)) return;
    try {
      await apiClient.delete(`/admin/credit-exchange/redeem-codes/${code}`);
      notify('删除成功', { type: 'success' });
      loadRedeemCodes();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      notify(err.response?.data?.error?.message || err.response?.data?.message || '删除失败', { type: 'error' });
    }
  };

  const handleSaveRegisterCreditConfig = async () => {
    if (!registerCreditConfig || !canWrite) {
      notify('无权限修改配置', { type: 'error' });
      return;
    }
    try {
      setRegisterCreditSaving(true);
      await apiClient.put('/admin/credit-exchange/register-credit-config', {
        amount: registerCreditConfig.amount,
        creditValidityDays: registerCreditConfig.creditValidityDays ?? 0,
      });
      notify('注册初始积分配置保存成功', { type: 'success' });
      loadRegisterCreditConfig();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      notify(err.response?.data?.error?.message || err.response?.data?.message || '保存失败', { type: 'error' });
    } finally {
      setRegisterCreditSaving(false);
    }
  };

  const handleSaveInviteConfig = async () => {
    if (!inviteConfig || !canWrite) {
      notify('无权限修改配置', { type: 'error' });
      return;
    }
    try {
      setInviteConfigSaving(true);
      await apiClient.put('/admin/credit-exchange/invite-config', {
        inviterCredits: inviteConfig.inviterCredits,
        inviteeCredits: inviteConfig.inviteeCredits,
          creditValidityDays: inviteConfig.creditValidityDays ?? 0,
        inviteDailyLimit: inviteConfig.inviteDailyLimit || 3,
        inviteTotalLimit: inviteConfig.inviteTotalLimit || 10,
      });
      notify('邀请配置保存成功', { type: 'success' });
      loadInviteConfig();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      notify(err.response?.data?.error?.message || err.response?.data?.message || '保存失败', { type: 'error' });
    } finally {
      setInviteConfigSaving(false);
    }
  };

  const formatDate = (str: string) => {
    if (!str) return '-';
    try {
      const d = new Date(str);
      return isNaN(d.getTime()) ? str : d.toLocaleString('zh-CN');
    } catch {
      return str;
    }
  };

  // 将后端 RFC3339 转为 datetime-local 的 value 格式 (YYYY-MM-DDTHH:mm)
  const toDateTimeLocalValue = (str: string): string => {
    if (!str?.trim()) return '';
    const m = str.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})/);
    if (m) return `${m[1]}T${m[2]}:${m[3]}`;
    try {
      const d = new Date(str);
      if (isNaN(d.getTime())) return '';
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}`;
    } catch {
      return '';
    }
  };

  if (!canRead) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">无权限访问此页面</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        积分兑换管理
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        管理兑换码与邀请规则配置，查看兑换与邀请记录。
      </Typography>

      <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} sx={{ mb: 2 }}>
        <Tab label="兑换码与配置" />
        <Tab label="兑换码记录" />
        <Tab label="邀请记录" />
      </Tabs>

      {tabValue === 0 && (
        <>
      {/* 兑换码列表 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
            <Typography variant="h6">兑换码列表</Typography>
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={loadRedeemCodes}
                disabled={redeemCodesLoading}
              >
                刷新
              </Button>
              {canWrite && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<AddIcon />}
                  onClick={handleCreateRedeemCode}
                >
                  新建兑换码
                </Button>
              )}
            </Stack>
          </Stack>

          {redeemCodesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>兑换码</TableCell>
                    <TableCell align="right">积分</TableCell>
                    <TableCell>兑换码有效期</TableCell>
                    <TableCell>积分有效期</TableCell>
                    <TableCell align="center">已用/上限</TableCell>
                    <TableCell>备注</TableCell>
                    {canWrite && <TableCell align="right">操作</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {redeemCodes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canWrite ? 7 : 6} align="center" sx={{ py: 4 }}>
                        暂无兑换码
                      </TableCell>
                    </TableRow>
                  ) : (
                    redeemCodes.map((row) => (
                      <TableRow key={row.code}>
                        <TableCell>
                          <Typography variant="body2" fontFamily="monospace">
                            {row.code}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{row.amount}</TableCell>
                        <TableCell>{formatDate(row.expiresAt) || '永不过期'}</TableCell>
                        <TableCell>{row.creditValidityDays ? `${row.creditValidityDays} 天` : '永不过期'}</TableCell>
                        <TableCell align="center">
                          {row.usedCount} / {row.maxUseCount === 0 ? '∞' : row.maxUseCount}
                        </TableCell>
                        <TableCell>{row.remark || '-'}</TableCell>
                        {canWrite && (
                          <TableCell align="right">
                            <IconButton
                              size="small"
                              onClick={() => handleEditRedeemCode(row)}
                              title="编辑"
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDeleteRedeemCode(row.code)}
                              title="删除"
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* 注册初始积分配置 */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            注册初始积分配置
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            新用户注册后自动发放的积分，与邮箱绑定（同一邮箱只发放一次，防止删号重注册刷积分）。积分数额为 0 表示不发放。
          </Typography>

          {registerCreditLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : registerCreditConfig ? (
            <Stack spacing={3} sx={{ maxWidth: 400 }}>
              <TextField
                label="注册初始积分数额"
                type="number"
                value={registerCreditConfig.amount}
                onChange={(e) =>
                  setRegisterCreditConfig((prev) =>
                    prev ? { ...prev, amount: parseInt(e.target.value, 10) || 0 } : prev
                  )
                }
                disabled={!canWrite}
                inputProps={{ min: 0 }}
                helperText="新用户注册时发放的积分数额，0 表示不发放"
              />
              <TextField
                label="积分有效期（天）"
                type="number"
                value={registerCreditConfig.creditValidityDays || ''}
                onChange={(e) =>
                  setRegisterCreditConfig((prev) =>
                    prev ? { ...prev, creditValidityDays: parseInt(e.target.value, 10) || 0 } : prev
                  )
                }
                disabled={!canWrite}
                inputProps={{ min: 0 }}
                helperText="0 表示永不过期；到期时间 = 注册时间 + 有效天数"
              />
              {canWrite && (
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadRegisterCreditConfig}
                    disabled={registerCreditSaving || registerCreditLoading}
                  >
                    重置
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveRegisterCreditConfig}
                    disabled={registerCreditSaving || registerCreditLoading}
                  >
                    {registerCreditSaving ? '保存中...' : '保存配置'}
                  </Button>
                </Stack>
              )}
            </Stack>
          ) : (
            <Alert severity="error">无法加载注册初始积分配置</Alert>
          )}
        </CardContent>
      </Card>

      <Divider sx={{ mb: 3 }} />

      {/* 邀请规则配置 */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            邀请规则配置
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            配置邀请人与被邀请人注册时获得的积分。每人每日最多邀请人数、累计最多邀请人数。积分有效天数 0 表示永不过期，用户领取时按「领取时间 + 天数」计算到期日。
          </Typography>

          {inviteConfigLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : inviteConfig ? (
            <Stack spacing={3} sx={{ maxWidth: 400 }}>
              <TextField
                label="邀请人获得积分"
                type="number"
                value={inviteConfig.inviterCredits}
                onChange={(e) =>
                  setInviteConfig((prev) =>
                    prev ? { ...prev, inviterCredits: parseInt(e.target.value, 10) || 0 } : prev
                  )
                }
                disabled={!canWrite}
                inputProps={{ min: 0 }}
                helperText="邀请人每成功邀请一人获得的积分（在被邀请人连续两天使用对话后发放）"
              />
              <TextField
                label="被邀请人获得积分"
                type="number"
                value={inviteConfig.inviteeCredits}
                onChange={(e) =>
                  setInviteConfig((prev) =>
                    prev ? { ...prev, inviteeCredits: parseInt(e.target.value, 10) || 0 } : prev
                  )
                }
                disabled={!canWrite}
                inputProps={{ min: 0 }}
                helperText="被邀请人注册时立即获得的积分；邀请人积分在被邀请人连续两天使用对话后发放"
              />
              <TextField
                label="每人每日最多邀请人数"
                type="number"
                value={inviteConfig.inviteDailyLimit}
                onChange={(e) =>
                  setInviteConfig((prev) =>
                    prev ? { ...prev, inviteDailyLimit: parseInt(e.target.value, 10) || 0 } : prev
                  )
                }
                disabled={!canWrite}
                inputProps={{ min: 0 }}
                helperText="0 表示使用默认值 3"
              />
              <TextField
                label="每人累计最多邀请人数"
                type="number"
                value={inviteConfig.inviteTotalLimit}
                onChange={(e) =>
                  setInviteConfig((prev) =>
                    prev ? { ...prev, inviteTotalLimit: parseInt(e.target.value, 10) || 0 } : prev
                  )
                }
                disabled={!canWrite}
                inputProps={{ min: 0 }}
                helperText="0 表示使用默认值 10"
              />
              <TextField
                label="积分有效期（天）"
                type="number"
                value={inviteConfig.creditValidityDays || ''}
                onChange={(e) =>
                  setInviteConfig((prev) =>
                    prev ? { ...prev, creditValidityDays: parseInt(e.target.value, 10) || 0 } : prev
                  )
                }
                disabled={!canWrite}
                inputProps={{ min: 0 }}
                helperText="0 表示永不过期；用户领取时按「领取时间 + 天数」计算到期日"
              />
              {canWrite && (
                <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                  <Button
                    variant="outlined"
                    startIcon={<RefreshIcon />}
                    onClick={loadInviteConfig}
                    disabled={inviteConfigSaving || inviteConfigLoading}
                  >
                    重置
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSaveInviteConfig}
                    disabled={inviteConfigSaving || inviteConfigLoading}
                  >
                    {inviteConfigSaving ? '保存中...' : '保存配置'}
                  </Button>
                </Stack>
              )}
            </Stack>
          ) : (
            <Alert severity="error">无法加载邀请配置</Alert>
          )}
        </CardContent>
      </Card>
        </>
      )}

      {tabValue === 1 && (
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">兑换码兑换记录</Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={loadRedeemUsages}
                disabled={redeemUsagesLoading}
              >
                刷新
              </Button>
            </Stack>
            {redeemUsagesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>兑换码</TableCell>
                      <TableCell>兑换日期</TableCell>
                      <TableCell>用户邮箱</TableCell>
                      <TableCell align="right">积分</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {redeemUsages.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                          暂无兑换记录
                        </TableCell>
                      </TableRow>
                    ) : (
                      redeemUsages.map((row, idx) => (
                        <TableRow key={`${row.code}-${row.createdAt}-${idx}`}>
                          <TableCell>
                            <Typography variant="body2" fontFamily="monospace">
                              {row.code}
                            </Typography>
                          </TableCell>
                          <TableCell>{formatDate(row.createdAt)}</TableCell>
                          <TableCell>{row.userEmail || '-'}</TableCell>
                          <TableCell align="right">{row.amount}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {tabValue === 2 && (
        <Card>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
              <Typography variant="h6">邀请记录</Typography>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={loadInviteRecords}
                disabled={inviteRecordsLoading}
              >
                刷新
              </Button>
            </Stack>
            {inviteRecordsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>邀请人邮箱</TableCell>
                      <TableCell>被邀请人邮箱</TableCell>
                      <TableCell>日期</TableCell>
                      <TableCell align="right">邀请人积分</TableCell>
                      <TableCell align="right">被邀请人积分</TableCell>
                      <TableCell>邀请人积分发放</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {inviteRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                          暂无邀请记录
                        </TableCell>
                      </TableRow>
                    ) : (
                      inviteRecords.map((row, idx) => (
                        <TableRow key={`${row.inviteeEmail}-${row.createdAt}-${idx}`}>
                          <TableCell>{row.inviterEmail || '-'}</TableCell>
                          <TableCell>{row.inviteeEmail || '-'}</TableCell>
                          <TableCell>{formatDate(row.createdAt)}</TableCell>
                          <TableCell align="right">{row.inviterCredits}</TableCell>
                          <TableCell align="right">{row.inviteeCredits}</TableCell>
                          <TableCell>
                            {row.inviterCreditsGrantedAt
                              ? formatDate(row.inviterCreditsGrantedAt)
                              : '待发放'}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      {/* 兑换码创建/编辑弹窗 */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCode ? '编辑兑换码' : '新建兑换码'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="兑换码"
              value={formData.code}
              onChange={(e) => setFormData((prev) => ({ ...prev, code: e.target.value }))}
              disabled={!!editingCode}
              placeholder="如 WELCOME2025"
              helperText={editingCode ? '兑换码不可修改' : '创建后不可修改'}
            />
            <TextField
              label="可兑换积分数额"
              type="number"
              value={formData.amount}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, amount: parseInt(e.target.value, 10) || 0 }))
              }
              inputProps={{ min: 1 }}
              required
            />
            <TextField
              label="兑换码有效期"
              type="datetime-local"
              value={formData.expiresAt}
              onChange={(e) => setFormData((prev) => ({ ...prev, expiresAt: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              helperText="留空表示永不过期"
              fullWidth
            />
            <TextField
              label="积分有效期（天）"
              type="number"
              value={formData.creditValidityDays || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  creditValidityDays: parseInt(e.target.value, 10) || 0,
                }))
              }
              inputProps={{ min: 0 }}
              helperText="0 表示永不过期；用户领取时按「领取时间 + 天数」计算到期日"
              fullWidth
            />
            <TextField
              label="最大使用次数"
              type="number"
              value={formData.maxUseCount || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  maxUseCount: parseInt(e.target.value, 10) || 0,
                }))
              }
              inputProps={{ min: 0 }}
              helperText="0 表示不限"
            />
            <TextField
              label="备注"
              value={formData.remark}
              onChange={(e) => setFormData((prev) => ({ ...prev, remark: e.target.value }))}
              multiline
              rows={2}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>取消</Button>
          <Button
            variant="contained"
            onClick={handleSaveRedeemCode}
            disabled={formSaving || (!editingCode && !formData.code.trim())}
          >
            {formSaving ? '保存中...' : '保存'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
