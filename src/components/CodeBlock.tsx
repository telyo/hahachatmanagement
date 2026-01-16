import { Box, Typography } from '@mui/material';

interface CodeBlockProps {
  code: string;
  language?: string;
}

export const CodeBlock = ({ code, language = 'json' }: CodeBlockProps) => {
  return (
    <Box
      component="pre"
      sx={{
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
      }}
    >
      <code>{code}</code>
    </Box>
  );
};

