import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography } from '@mui/material';
import { CodeBlock } from '../../components/CodeBlock';
export const RequestParamsDialog = ({ open, onClose, requestParams }) => {
    const [copied, setCopied] = useState(false);
    const handleCopy = () => {
        if (requestParams) {
            try {
                // 尝试格式化 JSON
                const parsed = JSON.parse(requestParams);
                const formatted = JSON.stringify(parsed, null, 2);
                navigator.clipboard.writeText(formatted);
            }
            catch {
                // 如果不是 JSON，直接复制原始字符串
                navigator.clipboard.writeText(requestParams);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };
    let formattedContent = '';
    let isValidJSON = false;
    if (requestParams) {
        try {
            const parsed = JSON.parse(requestParams);
            formattedContent = JSON.stringify(parsed, null, 2);
            isValidJSON = true;
        }
        catch {
            formattedContent = requestParams;
            isValidJSON = false;
        }
    }
    return (_jsxs(Dialog, { open: open, onClose: onClose, maxWidth: "md", fullWidth: true, children: [_jsx(DialogTitle, { children: "\u8BF7\u6C42\u53C2\u6570" }), _jsx(DialogContent, { children: requestParams ? (_jsx(Box, { children: _jsx(CodeBlock, { code: formattedContent, language: isValidJSON ? 'json' : 'text' }) })) : (_jsx(Typography, { variant: "body2", color: "text.secondary", children: "\u6682\u65E0\u8BF7\u6C42\u53C2\u6570" })) }), _jsxs(DialogActions, { children: [requestParams && (_jsx(Button, { onClick: handleCopy, color: "primary", children: copied ? '已复制' : '复制' })), _jsx(Button, { onClick: onClose, color: "primary", children: "\u5173\u95ED" })] })] }));
};
