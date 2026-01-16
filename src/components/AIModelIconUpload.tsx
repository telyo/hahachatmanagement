import { useState, useCallback } from 'react';
import { useFormContext } from 'react-hook-form';
import { useNotify } from 'react-admin';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';
import apiClient from '../services/api';

interface AIModelIconUploadProps {
  source?: string; // 默认为 displayConfig.iconUrl
}

export const AIModelIconUpload = ({ source = 'displayConfig.iconUrl' }: AIModelIconUploadProps) => {
  const notify = useNotify();
  const { setValue, watch } = useFormContext();
  const [uploading, setUploading] = useState(false);
  const iconUrl = watch(source) || '';

  const handleIconUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      notify('不支持的图片格式，仅支持 PNG、JPG、SVG', { type: 'error' });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      notify('文件大小不能超过 2MB', { type: 'error' });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await apiClient.post('/upload', formData);
      const uploadedUrl = response.data?.data?.url;

      if (uploadedUrl) {
        setValue(source, uploadedUrl, { shouldDirty: true });
        notify('图标上传成功', { type: 'success' });
      }
    } catch (error: unknown) {
      const errorMessage = (error as { response?: { data?: { message?: string } } })?.response?.data?.message || '上传失败';
      notify(errorMessage, { type: 'error' });
    } finally {
      setUploading(false);
      const fileInput = document.getElementById(`ai-model-icon-upload-${source}`) as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    }
  }, [notify, source, setValue]);

  return (
    <Box>
      <input
        accept="image/png,image/jpeg,image/jpg,image/svg+xml"
        style={{ display: 'none' }}
        id={`ai-model-icon-upload-${source}`}
        type="file"
        onChange={handleIconUpload}
        disabled={uploading}
      />
      <label htmlFor={`ai-model-icon-upload-${source}`}>
        <Button variant="outlined" component="span" disabled={uploading} fullWidth>
          {uploading ? (
            <>
              <CircularProgress size={16} sx={{ mr: 1 }} />
              上传中...
            </>
          ) : (
            '上传图标'
          )}
        </Button>
      </label>
      {iconUrl && (
        <Box sx={{ mt: 1 }}>
          <Typography variant="caption" color="text.secondary">已上传: {iconUrl}</Typography>
          <Box sx={{ mt: 1 }}>
            <img src={iconUrl} alt="图标预览" style={{ maxWidth: '100px', maxHeight: '100px', objectFit: 'contain' }} />
          </Box>
        </Box>
      )}
    </Box>
  );
};
