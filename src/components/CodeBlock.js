import { jsx as _jsx } from "react/jsx-runtime";
import { Box } from '@mui/material';
export const CodeBlock = ({ code, language = 'json' }) => {
    return (_jsx(Box, { component: "pre", sx: {
            margin: 0,
            padding: 2,
            borderRadius: 1,
            fontSize: '0.875rem',
            fontFamily: 'monospace',
            backgroundColor: '#1e1e1e',
            color: '#d4d4d4',
            overflow: 'auto',
            maxHeight: '500px',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
        }, children: _jsx("code", { children: code }) }));
};
