import { Edit, SimpleForm, TextInput, SelectInput, NumberInput, DateInput, useNotify, useRedirect, usePermissions, useRecordContext, useRefresh, useGetOne } from 'react-admin';
import { useParams } from 'react-router-dom';
import { Alert, Typography, Divider, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box, Table, TableBody, TableCell, TableHead, TableRow, IconButton, Collapse, Paper } from '@mui/material';
import { hasPermission } from '../../utils/permissions';
import { authUtils } from '../../utils/auth';
import apiClient from '../../services/api';
import { useState, useEffect } from 'react';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

// 添加积分弹窗组件
const AddCreditsDialog = ({ open, onClose, userId, onSuccess }: { open: boolean; onClose: () => void; userId: string; onSuccess: () => void }) => {
  const [amount, setAmount] = useState<number>(0);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const notify = useNotify();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (amount <= 0) {
      notify('积分数额必须大于0', { type: 'error' });
      return;
    }
    if (!reason.trim()) {
      notify('请输入调整原因', { type: 'error' });
      return;
    }

    setLoading(true);
    try {
      await apiClient.post(`/admin/users/${userId}/virtual-currency/add`, {
        amount,
        expiresAt: expiresAt || undefined,
        reason,
      });
      notify('积分添加成功', { type: 'success' });
      onSuccess();
      onClose();
      // 重置表单
      setAmount(0);
      setExpiresAt('');
      setReason('');
    } catch (error: any) {
      notify(error.response?.data?.message || '添加积分失败', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>添加积分</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
          <TextField
            label="积分数额"
            type="number"
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
            fullWidth
            required
            inputProps={{ min: 1 }}
          />
          <TextField
            label="到期时间（可选，留空表示永不过期）"
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="调整原因"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            required
            multiline
            rows={3}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>取消</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? '添加中...' : '确定'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// 编辑积分详情组件
const EditCreditsDetails = ({ credits, userId, onSuccess }: { credits: any[]; userId: string; onSuccess: () => void }) => {
  const [expanded, setExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [editedCredits, setEditedCredits] = useState<Map<string, { remainingAmount?: number; expiresAt?: string }>>(new Map());
  const [originalCredits, setOriginalCredits] = useState<Map<string, any>>(new Map());
  const notify = useNotify();
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  // 初始化原始数据
  useEffect(() => {
    const originalMap = new Map();
    credits.forEach((credit: any) => {
      originalMap.set(credit.creditId, {
        remainingAmount: credit.remainingAmount,
        expiresAt: credit.expiresAt || '',
      });
    });
    setOriginalCredits(originalMap);
  }, [credits]);

  // 按到期时间倒序排序（null/空字符串排在最后）
  const sortedCredits = [...credits].sort((a: any, b: any) => {
    if ((!a.expiresAt || a.expiresAt === '') && (!b.expiresAt || b.expiresAt === '')) {
      return 0;
    }
    if (!a.expiresAt || a.expiresAt === '') {
      return 1; // a永不过期，排在后面
    }
    if (!b.expiresAt || b.expiresAt === '') {
      return -1; // b永不过期，a排在前面
    }
    const expiresA = new Date(a.expiresAt);
    const expiresB = new Date(b.expiresAt);
    return expiresB.getTime() - expiresA.getTime(); // 倒序：到期时间晚的在前
  });

  const totalPages = Math.ceil(sortedCredits.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const pageCredits = sortedCredits.slice(startIndex, endIndex);

  const handleCreditChange = (creditId: string, field: 'remainingAmount' | 'expiresAt', value: any) => {
    const newEditedCredits = new Map(editedCredits);
    if (!newEditedCredits.has(creditId)) {
      newEditedCredits.set(creditId, {});
    }
    const credit = newEditedCredits.get(creditId)!;
    if (field === 'remainingAmount') {
      credit.remainingAmount = value;
    } else {
      credit.expiresAt = value;
    }
    setEditedCredits(newEditedCredits);
  };

  const isCreditChanged = (creditId: string) => {
    const edited = editedCredits.get(creditId);
    if (!edited) return false;
    const original = originalCredits.get(creditId);
    if (!original) return false;
    
    if (edited.remainingAmount !== undefined && edited.remainingAmount !== original.remainingAmount) {
      return true;
    }
    if (edited.expiresAt !== undefined && edited.expiresAt !== original.expiresAt) {
      return true;
    }
    return false;
  };

  const handleSave = async () => {
    const updates: any[] = [];
    editedCredits.forEach((edited, creditId) => {
      if (isCreditChanged(creditId)) {
        const updateItem: any = {
          creditId,
        };
        
        // 添加剩余积分（如果已更改）
        if (edited.remainingAmount !== undefined) {
          updateItem.remainingAmount = edited.remainingAmount;
        }
        
        // 添加到期时间（如果已更改）
        if (edited.expiresAt !== undefined) {
          // 确保是 RFC3339 格式或空字符串
          if (edited.expiresAt === '') {
            updateItem.expiresAt = '';
          } else {
            // 如果已经是 ISO 格式，直接使用；否则转换
            try {
              const date = new Date(edited.expiresAt);
              if (!isNaN(date.getTime())) {
                updateItem.expiresAt = date.toISOString();
              } else {
                updateItem.expiresAt = edited.expiresAt;
              }
            } catch {
              updateItem.expiresAt = edited.expiresAt;
            }
          }
        }
        
        updates.push(updateItem);
      }
    });

    if (updates.length === 0) {
      notify('没有需要保存的更改', { type: 'info' });
      return;
    }

    setLoading(true);
    try {
      await apiClient.put(`/admin/users/${userId}/virtual-currency/update`, {
        credits: updates,
      });
      notify('积分详情更新成功', { type: 'success' });
      setEditedCredits(new Map());
      // 更新原始数据
      updates.forEach(update => {
        const original = originalCredits.get(update.creditId);
        if (original) {
          if (update.remainingAmount !== undefined) {
            original.remainingAmount = update.remainingAmount;
          }
          if (update.expiresAt !== undefined) {
            original.expiresAt = update.expiresAt;
          }
        }
      });
      onSuccess();
    } catch (error: any) {
      notify(error.response?.data?.message || '更新失败', { type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getCurrentCreditValue = (creditId: string, field: 'remainingAmount' | 'expiresAt') => {
    const edited = editedCredits.get(creditId);
    if (edited && edited[field] !== undefined) {
      if (field === 'expiresAt') {
        // 如果已编辑，返回编辑后的值（可能是 ISO 字符串或 datetime-local 格式）
        const value = edited[field] as string;
        if (!value) return '';
        // 如果是 ISO 格式，转换为 datetime-local
        if (value.includes('T') && value.includes('Z')) {
          const date = new Date(value);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}`;
        }
        return value; // 已经是 datetime-local 格式
      }
      return edited[field];
    }
    const credit = credits.find((c: any) => c.creditId === creditId);
    if (!credit) return field === 'remainingAmount' ? 0 : '';
    
    if (field === 'expiresAt') {
      if (!credit.expiresAt) return '';
      // 转换为 datetime-local 格式
      try {
        const date = new Date(credit.expiresAt);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      } catch {
        return '';
      }
    }
    return credit.remainingAmount || 0;
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Button
        variant="outlined"
        startIcon={expanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
        onClick={() => setExpanded(!expanded)}
        sx={{ mb: 2 }}
      >
        {expanded ? '收起积分详情' : '编辑积分详情'}
      </Button>

      <Collapse in={expanded}>
        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              积分明细（共 {sortedCredits.length} 项，按到期时间倒序）
            </Typography>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={loading || editedCredits.size === 0}
            >
              {loading ? '保存中...' : '保存更改'}
            </Button>
          </Box>

          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>积分ID</TableCell>
                <TableCell align="right">总积分</TableCell>
                <TableCell align="right" sx={{ minWidth: 150 }}>剩余积分</TableCell>
                <TableCell>来源</TableCell>
                <TableCell sx={{ minWidth: 200 }}>到期时间</TableCell>
                <TableCell>状态</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pageCredits.map((credit: any) => {
                const isChanged = isCreditChanged(credit.creditId);
                const expiresAt = credit.expiresAt ? new Date(credit.expiresAt) : null;
                const now = new Date();
                const isExpired = expiresAt && expiresAt < now;
                const isActive = credit.remainingAmount > 0 && !isExpired;

                return (
                  <TableRow
                    key={credit.creditId}
                    sx={{
                      backgroundColor: isChanged ? 'rgba(255, 235, 59, 0.3)' : 'transparent',
                    }}
                  >
                    <TableCell sx={{ fontSize: '12px' }}>{credit.creditId || '-'}</TableCell>
                    <TableCell align="right">{credit.totalAmount || 0}</TableCell>
                    <TableCell align="right">
                      <TextField
                        type="number"
                        value={getCurrentCreditValue(credit.creditId, 'remainingAmount')}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          if (value < 0) return;
                          if (value > credit.totalAmount) {
                            notify(`剩余积分不能超过总积分 ${credit.totalAmount}`, { type: 'warning' });
                            return;
                          }
                          handleCreditChange(credit.creditId, 'remainingAmount', value);
                        }}
                        size="small"
                        inputProps={{ min: 0, max: credit.totalAmount }}
                        sx={{ width: 100 }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontSize: '12px' }}>{credit.source || '-'}</TableCell>
                    <TableCell>
                      <TextField
                        type="datetime-local"
                        value={getCurrentCreditValue(credit.creditId, 'expiresAt')}
                        onChange={(e) => {
                          const value = e.target.value;
                          // 转换为 RFC3339 格式
                          if (value) {
                            try {
                              const date = new Date(value);
                              if (!isNaN(date.getTime())) {
                                handleCreditChange(credit.creditId, 'expiresAt', date.toISOString());
                              }
                            } catch {
                              // 忽略无效日期
                            }
                          } else {
                            handleCreditChange(credit.creditId, 'expiresAt', '');
                          }
                        }}
                        size="small"
                        InputLabelProps={{ shrink: true }}
                        placeholder="永不过期"
                        fullWidth
                      />
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
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* 分页控件 */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 2 }}>
              <IconButton
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeftIcon />
              </IconButton>
              <Typography>
                第 {currentPage} 页 / 共 {totalPages} 页
              </Typography>
              <IconButton
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRightIcon />
              </IconButton>
            </Box>
          )}
        </Paper>
      </Collapse>
    </Box>
  );
};

const UserEdit = () => {
  const notify = useNotify();
  const redirect = useRedirect();
  const refresh = useRefresh();
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const canWrite = hasPermission(permissions, 'users:write', adminInfo?.role);
  const record = useRecordContext();
  const { id } = useParams();
  const [addCreditsDialogOpen, setAddCreditsDialogOpen] = useState(false);
  
  // 获取用户ID - 从多个来源获取
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
      console.log('[UserEdit] Record data:', {
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
  
  // 检查是否是超级管理员
  const role = adminInfo?.role;
  const isSuperAdmin = role === 'super_admin' || String(role || '').toLowerCase() === 'super_admin';

  // 计算未到期的积分总和
  const calculateTotalBalance = (credits: any[]) => {
    if (!credits || credits.length === 0) return 0;
    const now = new Date();
    return credits.reduce((total, credit) => {
      if (credit.expiresAt) {
        const expiresAt = new Date(credit.expiresAt);
        if (expiresAt < now) {
          return total; // 已过期，不计入
        }
      }
      return total + (credit.remainingAmount || 0);
    }, 0);
  };

  const handleSave = async (data: any) => {
    try {
      // 使用从 record 或 URL 参数获取的 userId，而不是 data.id
      const finalUserId = userId || data.id || data.userId;
      
      if (!finalUserId) {
        notify('用户ID不存在，无法更新', { type: 'error' });
        return;
      }
      
      const promises: Promise<any>[] = [];

      // 更新用户状态
      if (data.status !== undefined) {
        promises.push(apiClient.put(`/admin/users/${finalUserId}/status`, { status: data.status }));
      }

      // 超级管理员可以更新订阅信息（到期日期和续订状态）
      if (isSuperAdmin) {
        // 更新订阅信息（到期日期和续订状态）
        const subscriptionUpdates: any = {};
        if (data.subscription?.endDate) {
          // 如果已经是 ISO 字符串，直接使用；否则转换为 ISO 字符串
          const endDate = typeof data.subscription.endDate === 'string' 
            ? data.subscription.endDate 
            : new Date(data.subscription.endDate).toISOString();
          subscriptionUpdates.endDate = endDate;
        }
        if (data.subscription?.renewalStatus) {
          subscriptionUpdates.renewalStatus = data.subscription.renewalStatus;
        }

        if (Object.keys(subscriptionUpdates).length > 0) {
          promises.push(
            apiClient.put(`/admin/users/${finalUserId}/subscription`, subscriptionUpdates)
          );
        }
      }

      await Promise.all(promises);
      notify('用户信息更新成功', { type: 'success' });
      redirect('list', 'users');
    } catch (error: any) {
      notify(error.response?.data?.message || error.message || '更新失败', { type: 'error' });
    }
  };

  const handleAddCreditsSuccess = () => {
    refresh();
  };

  const handleEditCreditsSuccess = () => {
    refresh();
  };

  if (!canWrite) {
    return (
      <Edit>
        <SimpleForm>
          <Alert severity="warning" sx={{ m: 2 }}>
            您没有编辑用户的权限。如需使用，请联系超级管理员。
          </Alert>
        </SimpleForm>
      </Edit>
    );
  }

  const credits = displayRecord?.virtualCurrency?.credits || [];
  const totalBalance = calculateTotalBalance(credits);
  
  // 调试：输出积分数据
  useEffect(() => {
    console.log('[UserEdit] Credits data:', {
      creditsCount: credits.length,
      credits: credits,
      totalBalance: totalBalance,
      virtualCurrency: displayRecord?.virtualCurrency,
      displayRecord: displayRecord,
    });
  }, [credits, totalBalance, displayRecord]);
  
  // 如果正在加载，显示加载状态
  if (isLoading && !displayRecord) {
    return (
      <Edit>
        <SimpleForm>
          <Alert severity="info">正在加载用户数据...</Alert>
        </SimpleForm>
      </Edit>
    );
  }

  return (
    <>
      <Edit>
        <SimpleForm onSubmit={handleSave}>
          <TextInput source="id" disabled label="用户ID" />
          <TextInput source="email" disabled label="邮箱" />
          <SelectInput
            source="status"
            label="状态"
            choices={[
              { id: 'active', name: '活跃' },
              { id: 'inactive', name: '未激活' },
              { id: 'suspended', name: '已暂停' },
            ]}
          />

          {isSuperAdmin ? (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" sx={{ mb: 2 }}>
                超级管理员专属设置
              </Typography>
              
              {/* 总积分显示（只读） */}
              <Box sx={{ mb: 2, p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>
                  总积分余额（未到期）：{totalBalance.toLocaleString()} 
                  {credits.length > 0 && (
                    <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      （共 {credits.length} 个积分项）
                    </Typography>
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  总积分是所有未到期积分的总和，不能直接编辑。请通过下方"添加积分"按钮添加新积分，或编辑单个积分项。
                </Typography>
                {credits.length === 0 && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    当前没有积分项，请点击"添加积分"按钮添加。
                  </Typography>
                )}
              </Box>

              {/* 添加积分按钮 */}
              <Box sx={{ mb: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setAddCreditsDialogOpen(true)}
                  sx={{ mb: 2 }}
                >
                  添加积分
                </Button>
              </Box>

              {/* 编辑积分详情 */}
              {credits.length > 0 ? (
                <EditCreditsDetails
                  credits={credits}
                  userId={userId}
                  onSuccess={handleEditCreditsSuccess}
                />
              ) : (
                <Box sx={{ mb: 2, p: 2, bgcolor: '#fff3cd', borderRadius: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    当前没有积分项，请点击"添加积分"按钮添加。
                  </Typography>
                </Box>
              )}

              {/* 订阅信息 */}
              <DateInput
                source="subscription.endDate"
                label="会员到期日期"
                helperText="设置会员到期日期和时间"
              />
              <SelectInput
                source="subscription.renewalStatus"
                label="续订状态"
                choices={[
                  { id: 'auto_renew', name: '正常续订' },
                  { id: 'onetime', name: '单次购买' },
                  { id: 'cancelled', name: '取消订阅' },
                ]}
                helperText="设置用户的续订状态"
              />
            </>
          ) : (
            <Alert severity="warning" sx={{ m: 2 }}>
              您不是超级管理员，无法编辑积分、到期日期和续订状态。当前角色：{adminInfo?.role || 'unknown'}
            </Alert>
          )}
        </SimpleForm>
      </Edit>

      {/* 添加积分弹窗 */}
      <AddCreditsDialog
        open={addCreditsDialogOpen}
        onClose={() => setAddCreditsDialogOpen(false)}
        userId={userId}
        onSuccess={handleAddCreditsSuccess}
      />
    </>
  );
};

export default UserEdit;
