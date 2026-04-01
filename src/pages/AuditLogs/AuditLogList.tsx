import { List, Datagrid, TextField, EmailField, DateField, Filter, TextInput, SelectInput, FunctionField } from 'react-admin';
import { formatUtils } from '../../utils/format';
import { useState } from 'react';
import { IconButton, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button, Stack, Typography, Divider } from '@mui/material';
import { Visibility as VisibilityIcon, InfoOutlined as InfoOutlinedIcon } from '@mui/icons-material';
import { RequestParamsDialog } from './RequestParamsDialog';

const AuditLogFilter = (props: Record<string, unknown>) => (
  <Filter {...props}>
    <TextInput source="adminId" label="管理员ID" />
    <TextInput source="action" label="操作类型" />
    <SelectInput
      source="resource"
      label="资源类型"
      choices={[
        { id: 'user', name: '用户' },
        { id: 'order', name: '订单' },
        { id: 'subscription', name: '订阅' },
        { id: 'ai_model', name: 'AI模型' },
        { id: 'feedback', name: '反馈' },
        { id: 'admin', name: '管理员' },
        { id: 'api_logger_config', name: 'API日志配置' },
      ]}
    />
    <SelectInput
      source="status"
      label="状态"
      choices={[
        { id: 'success', name: '成功' },
        { id: 'failed', name: '失败' },
        { id: 'partial', name: '部分成功' },
      ]}
    />
  </Filter>
);

// 操作类型映射
const actionMap: Record<string, string> = {
  'login': '登录',
  'change_password': '修改密码',
  'create_admin': '创建管理员',
  'update_admin': '更新管理员',
  'delete_admin': '删除管理员',
  'update_admin_status': '更新管理员状态',
  'add_balance': '增加积分',
  'deduct_balance': '减少积分',
  'update_status': '更新状态',
  'refund': '退款',
  'update': '更新',
  'create': '创建',
  'delete': '删除',
  'test': '测试',
  'import': '导入',
  'export': '导出',
  'update_feedback': '更新反馈',
  'reset': '重置',
};

// 资源类型映射
const resourceMap: Record<string, string> = {
  'user': '用户',
  'order': '订单',
  'subscription': '订阅',
  'ai_model': 'AI模型',
  'feedback': '反馈',
  'admin': '管理员',
  'api_logger_config': 'API日志配置',
};


export const AuditLogList = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogParams, setDialogParams] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailRecord, setDetailRecord] = useState<any>(null);

  const prettyJson = (value: any) => {
    if (value == null) return '';
    if (typeof value !== 'string') {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    const s = value.trim();
    if (!s) return '';
    try {
      return JSON.stringify(JSON.parse(s), null, 2);
    } catch {
      return value;
    }
  };

  return (
    <>
      <List filters={<AuditLogFilter />} sort={{ field: 'createdAt', order: 'DESC' }}>
        <Datagrid rowClick={false} bulkActionButtons={false}>
          <TextField source="id" label="日志ID" />
          <EmailField source="adminEmail" label="管理员邮箱" />
          <TextField source="action" label="操作" transform={(action: string) => actionMap[action] || action} />
          <TextField source="resource" label="资源类型" transform={(resource: string) => resourceMap[resource] || resource} />
          <TextField source="resourceId" label="资源ID" />
          <TextField source="status" label="状态" transform={(status: string) => formatUtils.status(status)} />
          <TextField source="ipAddress" label="IP地址" />
          <DateField source="createdAt" label="时间" showTime />
          <FunctionField
            label="详情"
            render={(record: any) => (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  setDetailRecord(record);
                  setDetailOpen(true);
                }}
                size="small"
                title="查看详情"
                sx={{ color: 'text.secondary' }}
              >
                <InfoOutlinedIcon fontSize="small" />
              </IconButton>
            )}
          />
          <FunctionField
            label="请求参数"
            render={(record: any) => {
              // 调试：打印记录数据
              if (import.meta.env.DEV) {
                console.log('AuditLog record in FunctionField:', record);
                console.log('requestParams:', record?.requestParams);
              }

              const hasRequestParams = record?.requestParams && record.requestParams.trim() !== '';

              if (!hasRequestParams) {
                return <Box sx={{ width: 40 }} />; // 占位，保持列宽一致
              }

              return (
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    setDialogParams(record.requestParams);
                    setDialogOpen(true);
                  }}
                  size="small"
                  title="查看请求参数"
                  sx={{ color: 'primary.main' }}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              );
            }}
          />
        </Datagrid>
      </List>
      <RequestParamsDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        requestParams={dialogParams}
      />

      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>操作日志详情</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.25}>
            <Typography variant="body2"><strong>日志ID：</strong>{detailRecord?.id || detailRecord?.logId || '-'}</Typography>
            <Typography variant="body2"><strong>管理员邮箱：</strong>{detailRecord?.adminEmail || '-'}</Typography>
            <Typography variant="body2"><strong>操作：</strong>{actionMap[detailRecord?.action] || detailRecord?.action || '-'}</Typography>
            <Typography variant="body2"><strong>资源类型：</strong>{resourceMap[detailRecord?.resource] || detailRecord?.resource || '-'}</Typography>
            <Typography variant="body2"><strong>资源ID：</strong>{detailRecord?.resourceId || '-'}</Typography>
            <Typography variant="body2"><strong>状态：</strong>{detailRecord?.status ? formatUtils.status(detailRecord.status) : '-'}</Typography>
            {detailRecord?.errorMessage ? (
              <Typography variant="body2" color="error"><strong>错误信息：</strong>{detailRecord.errorMessage}</Typography>
            ) : null}
            <Typography variant="body2"><strong>IP：</strong>{detailRecord?.ipAddress || '-'}</Typography>
            <Typography variant="body2"><strong>User-Agent：</strong>{detailRecord?.userAgent || '-'}</Typography>
            <Typography variant="body2"><strong>时间：</strong>{detailRecord?.createdAt || '-'}</Typography>

            <Divider />

            <Typography variant="subtitle2">Details</Typography>
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 1.25,
                bgcolor: 'background.default',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'auto',
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              {prettyJson(detailRecord?.details) || '-'}
            </Box>

            <Typography variant="subtitle2">Request Params</Typography>
            <Box
              component="pre"
              sx={{
                m: 0,
                p: 1.25,
                bgcolor: 'background.default',
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
                overflow: 'auto',
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              {prettyJson(detailRecord?.requestParams) || '-'}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailOpen(false)}>关闭</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

