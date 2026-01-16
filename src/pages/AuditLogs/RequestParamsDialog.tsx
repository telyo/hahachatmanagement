import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import { CodeBlock } from '../../components/CodeBlock';

interface RequestParamsDialogProps {
  open: boolean;
  onClose: () => void;
  requestParams: string | null | undefined;
}

export const RequestParamsDialog = ({ open, onClose, requestParams }: RequestParamsDialogProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (requestParams) {
      try {
        // 尝试格式化 JSON
        const parsed = JSON.parse(requestParams);
        const formatted = JSON.stringify(parsed, null, 2);
        navigator.clipboard.writeText(formatted);
      } catch {
        // 如果不是 JSON，直接复制原始字符串
        navigator.clipboard.writeText(requestParams);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  let formattedContent: string = '';
  let isValidJSON = false;

  if (requestParams) {
    try {
      const parsed = JSON.parse(requestParams);
      formattedContent = JSON.stringify(parsed, null, 2);
      isValidJSON = true;
    } catch {
      formattedContent = requestParams;
      isValidJSON = false;
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>请求参数</DialogTitle>
      <DialogContent>
        {requestParams ? (
          <Box>
            <CodeBlock code={formattedContent} language={isValidJSON ? 'json' : 'text'} />
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            暂无请求参数
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        {requestParams && (
          <Button onClick={handleCopy} color="primary">
            {copied ? '已复制' : '复制'}
          </Button>
        )}
        <Button onClick={onClose} color="primary">
          关闭
        </Button>
      </DialogActions>
    </Dialog>
  );
};

