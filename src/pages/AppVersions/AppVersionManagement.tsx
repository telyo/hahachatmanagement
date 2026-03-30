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
  Tabs,
  Tab,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Pagination,
  IconButton,
} from '@mui/material';
import { Save as SaveIcon, Refresh as RefreshIcon, CloudUpload as UploadIcon, History as HistoryIcon, Close as CloseIcon } from '@mui/icons-material';
import { useNotify, usePermissions } from 'react-admin';
import apiClient from '../../services/api';
import { hasPermission } from '../../utils/permissions';
import { authUtils } from '../../utils/auth';

interface AppVersionData {
  platform: string;
  latestVersion: string;
  releaseNotes: string;
  storagePath: string;
  storeUrl: string;  // iOS 专用：App Store 地址
  forceUpdateVersion: string;
  fileSize: number;
  checksum: string;
  downloadToken: string;
  createdAt?: string;
  updatedAt?: string;
}

interface VersionHistoryItem {
  version: string;
  releaseNotes: string;
  createdAt: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`platform-tabpanel-${index}`}
      aria-labelledby={`platform-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

const PLATFORMS = [
  { id: 'android', label: 'Android', icon: '🤖' },
  { id: 'ios', label: 'iOS', icon: '🍎' },
  { id: 'macos', label: 'macOS', icon: '💻' },
  { id: 'windows', label: 'Windows', icon: '🪟' },
];

export const AppVersionManagement = () => {
  const notify = useNotify();
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const userRole = adminInfo?.role;

  const canRead = hasPermission(permissions, 'app_versions:read', userRole);
  const canWrite = hasPermission(permissions, 'app_versions:write', userRole);

  const [currentTab, setCurrentTab] = useState(0);
  const [versions, setVersions] = useState<Record<string, AppVersionData>>({});
  const [versionHistory, setVersionHistory] = useState<Record<string, VersionHistoryItem[]>>({});
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [dragOver, setDragOver] = useState<Record<string, boolean>>({});
  
  // 历史版本弹窗相关状态
  const [historyDialogOpen, setHistoryDialogOpen] = useState<Record<string, boolean>>({});
  const [historyPage, setHistoryPage] = useState<Record<string, number>>({});
  const itemsPerPage = 10;

  const loadVersions = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/admin/app-versions');
      const data = response.data?.data || [];
      
      const versionsMap: Record<string, AppVersionData> = {};
      data.forEach((version: AppVersionData) => {
        const v = { ...version, storeUrl: version.storeUrl ?? '' };
        versionsMap[version.platform] = v;
        // 后端将 macos 规范为 mac，需映射回 macos 以便前端正确显示
        if (version.platform === 'mac') {
          versionsMap['macos'] = { ...v, platform: 'macos' };
        }
      });
      
      // 为每个平台初始化默认值（如果不存在）
      PLATFORMS.forEach((platform) => {
        if (!versionsMap[platform.id]) {
          versionsMap[platform.id] = {
            platform: platform.id,
            latestVersion: '',
            releaseNotes: '',
            storagePath: '',
            storeUrl: '',
            forceUpdateVersion: '',
            fileSize: 0,
            checksum: '',
            downloadToken: '',
          };
        }
      });
      
      setVersions(versionsMap);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      notify(err.response?.data?.error?.message || '加载版本信息失败', { type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [notify]);

  const loadVersionHistory = useCallback(async (platform: string) => {
    try {
      setLoadingHistory((prev) => ({ ...prev, [platform]: true }));
      const response = await apiClient.get(`/admin/app-versions/${platform}/history`);
      const data = response.data?.data || [];
      setVersionHistory((prev) => ({
        ...prev,
        [platform]: data,
      }));
    } catch (error: unknown) {
      // 历史记录加载失败不影响主流程，只记录错误
      console.error(`Failed to load version history for ${platform}:`, error);
    } finally {
      setLoadingHistory((prev) => ({ ...prev, [platform]: false }));
    }
  }, []);

  useEffect(() => {
    if (canRead) {
      loadVersions();
    }
  }, [canRead, loadVersions]);

  // 当切换平台标签时，加载该平台的历史版本
  useEffect(() => {
    const currentPlatform = PLATFORMS[currentTab]?.id;
    if (currentPlatform && canRead) {
      // 每次都重新加载，确保数据是最新的
      loadVersionHistory(currentPlatform);
    }
  }, [currentTab, canRead, loadVersionHistory]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleChange = (platform: string, field: keyof AppVersionData, value: string | number) => {
    setVersions((prev) => ({
      ...prev,
      [platform]: {
        ...prev[platform],
        [field]: value,
      },
    }));
  };

  const handleSave = async (platform: string) => {
    if (!canWrite) {
      notify('无权限修改版本信息', { type: 'error' });
      return;
    }

    const version = versions[platform];
    if (!version) {
      notify('版本信息不存在', { type: 'error' });
      return;
    }

    // 验证必填字段
    if (!version.latestVersion.trim()) {
      notify('请输入最新版本号', { type: 'error' });
      return;
    }
    if (!version.releaseNotes.trim()) {
      notify('请输入版本更新说明', { type: 'error' });
      return;
    }
    if (platform === 'ios' && !version.storeUrl?.trim()) {
      notify('请输入 App Store 地址', { type: 'error' });
      return;
    }

    try {
      setSaving((prev) => ({ ...prev, [platform]: true }));
      await apiClient.put(`/admin/app-versions/${platform}`, {
        latestVersion: version.latestVersion,
        releaseNotes: version.releaseNotes,
        forceUpdateVersion: version.forceUpdateVersion || undefined,
        storagePath: version.storagePath,
        storeUrl: version.storeUrl || undefined,
        fileSize: version.fileSize,
        checksum: version.checksum,
      });
      notify('版本信息保存成功', { type: 'success' });
      await loadVersions();
      // 重新加载历史版本（因为可能新增了版本）
      await loadVersionHistory(platform);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { error?: { message?: string } } } };
      notify(err.response?.data?.error?.message || '保存失败', { type: 'error' });
    } finally {
      setSaving((prev) => ({ ...prev, [platform]: false }));
    }
  };

  const handleFileUpload = async (platform: string, file: File) => {
    if (!canWrite) {
      notify('无权限上传文件', { type: 'error' });
      return;
    }

    // 检查文件大小（超过 8MB 使用预签名 URL 直接上传到 R2）
    const FILE_SIZE_THRESHOLD = 8 * 1024 * 1024; // 8MB
    const usePresignedURL = file.size > FILE_SIZE_THRESHOLD;

    try {
      setUploading((prev) => ({ ...prev, [platform]: true }));

      let storagePath: string | undefined;
      let fileSize: number | undefined;
      let checksum: string | undefined;
      let objectKey: string | undefined;

      if (usePresignedURL) {
        // 使用预签名 URL 直接上传到 R2（不经应用服务器转传大 body）
        notify('文件较大，使用直接上传方式...', { type: 'info' });
        
        try {
          // 1. 获取预签名上传 URL
          console.log('[上传] 请求预签名 URL，平台:', platform, '文件名:', file.name);
          const urlResponse = await apiClient.get(`/admin/app-versions/${platform}/upload-url`, {
            params: { fileName: file.name },
          });
          
          console.log('[上传] 预签名 URL 响应:', urlResponse.data);
          const { uploadURL, objectKey: key } = urlResponse.data?.data || {};
          if (!uploadURL || !key) {
            console.error('[上传] 预签名 URL 响应数据不完整:', { uploadURL, key });
            throw new Error('获取上传 URL 失败：响应数据不完整');
          }
          
          objectKey = key;
          console.log('[上传] 预签名 URL:', uploadURL);
          console.log('[上传] 对象键:', objectKey);
          
          // 2. 计算文件校验和（在客户端计算）
          console.log('[上传] 开始计算文件校验和，文件大小:', file.size);
          const fileBuffer = await file.arrayBuffer();
          const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer);
          const hashArray = Array.from(new Uint8Array(hashBuffer));
          checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
          fileSize = file.size;
          console.log('[上传] 校验和计算完成:', checksum);
          
          // 3. 直接上传到 R2
          console.log('[上传] 开始上传文件到 R2...');
          // 从预签名 URL 中提取 Content-Type（如果存在）
          // 预签名 URL 的查询参数中可能包含 Content-Type
          const urlObj = new URL(uploadURL);
          
          // 检查所有查询参数（调试用）
          const allParams = Array.from(urlObj.searchParams.entries());
          console.log('[上传] URL 查询参数:', allParams);
          
          // 尝试不同的 Content-Type 参数名称
          // 注意：URL 参数名称是区分大小写的，但浏览器可能会自动处理
          let contentTypeFromURL = urlObj.searchParams.get('Content-Type');
          
          // 如果没找到，尝试其他可能的名称
          if (!contentTypeFromURL) {
            // 手动解析查询字符串，因为 searchParams 可能对某些特殊字符处理不当
            const searchParams = urlObj.search.substring(1); // 去掉开头的 '?'
            const params = new URLSearchParams(searchParams);
            contentTypeFromURL = params.get('Content-Type');
          }
          
          // 如果还是没找到，尝试小写
          if (!contentTypeFromURL) {
            contentTypeFromURL = urlObj.searchParams.get('content-type');
          }
          
          console.log('[上传] 提取的 Content-Type (原始):', contentTypeFromURL);
          
          // 重要：如果 URL 中有 Content-Type，必须使用 URL 中的值（签名验证要求）
          // URL 中的值可能被 URL 编码，需要解码
          let contentType: string;
          if (contentTypeFromURL) {
            // URL 中的 Content-Type 可能被编码，需要解码
            // 例如：application%2Fvnd.android.package-archive -> application/vnd.android.package-archive
            contentType = decodeURIComponent(contentTypeFromURL);
            console.log('[上传] Content-Type (解码后):', contentType);
            
            if (file.type && contentType !== file.type) {
              console.warn('[上传] Content-Type 不匹配:', {
                urlContentType: contentType,
                fileMimeType: file.type,
                using: contentType, // 必须使用 URL 中的值
              });
            }
          } else {
            // URL 中没有 Content-Type，使用文件的 MIME 类型
            contentType = file.type || 'application/octet-stream';
            console.warn('[上传] URL 中没有 Content-Type，使用文件的 MIME 类型:', contentType);
          }
          console.log('[上传] Content-Type:', contentType);
          console.log('[上传] URL 中的 Content-Type:', contentTypeFromURL);
          console.log('[上传] 文件的 MIME 类型:', file.type);
          
          // 构建请求头（必须与预签名 URL 中的 Content-Type 完全匹配）
          // 注意：HTTP header 名称不区分大小写，但值必须完全匹配
          const headers: HeadersInit = {
            'Content-Type': contentType,
          };
          
          console.log('[上传] 请求头:', headers);
          console.log('[上传] 完整上传 URL (前200字符):', uploadURL.substring(0, 200));
          console.log('[上传] 完整上传 URL (完整):', uploadURL);
          
          let uploadResponse: Response | undefined;
          try {
            // 注意：对于预签名 URL，如果 URL 中包含 Content-Type 查询参数，
            // 请求头中的 Content-Type 必须与查询参数中的值完全匹配
            console.log('[上传] 准备发送 PUT 请求到 R2');
            console.log('[上传] URL:', uploadURL.substring(0, 200) + '...'); // 只显示前200个字符
            console.log('[上传] Headers:', JSON.stringify(headers));
            console.log('[上传] File size:', file.size, 'bytes');
            
            // 重要：确保 Content-Type 头正确设置
            // 对于预签名 URL，Content-Type 必须与 URL 查询参数中的值完全匹配
            // 使用 Promise 包装 XMLHttpRequest，确保 Content-Type 头正确发送
            uploadResponse = await new Promise<Response>((resolve, reject) => {
              const xhr = new XMLHttpRequest();
              
              // 设置响应类型为 blob，以便正确处理二进制数据
              xhr.responseType = 'blob';
              
              // 设置超时时间（5分钟，用于大文件上传）
              xhr.timeout = 5 * 60 * 1000;
              
              xhr.open('PUT', uploadURL, true);
              
              // 重要：必须在 open() 之后，send() 之前设置请求头
              // 确保 Content-Type 头正确设置
              try {
                xhr.setRequestHeader('Content-Type', contentType);
                console.log('[上传] Content-Type 头已设置:', contentType);
              } catch (e) {
                console.error('[上传] 设置 Content-Type 头失败:', e);
                reject(new Error('无法设置 Content-Type 请求头'));
                return;
              }
              
              console.log('[上传] XMLHttpRequest 配置完成');
              console.log('[上传] Method: PUT');
              console.log('[上传] URL:', uploadURL.substring(0, 200) + '...');
              console.log('[上传] Content-Type header:', contentType);
              console.log('[上传] File size:', file.size, 'bytes');
              
              xhr.onload = () => {
                console.log('[上传] XMLHttpRequest onload, status:', xhr.status);
                console.log('[上传] Response headers:', xhr.getAllResponseHeaders());
                
                // 对于错误响应，尝试读取 XML 错误信息
                if (xhr.status >= 400 && xhr.response) {
                  // 如果响应是 Blob，需要异步读取
                  if (xhr.response instanceof Blob) {
                    const reader = new FileReader();
                    reader.onload = () => {
                      const errorText = reader.result as string;
                      console.error('[上传] R2 错误响应 (XML):', errorText);
                    };
                    reader.readAsText(xhr.response);
                  }
                }
                
                // 将 XMLHttpRequest 响应转换为 Fetch Response
                const response = new Response(xhr.response, {
                  status: xhr.status,
                  statusText: xhr.statusText,
                  headers: new Headers(),
                });
                
                // 复制响应头
                const responseHeaders = xhr.getAllResponseHeaders();
                if (responseHeaders) {
                  responseHeaders.split('\r\n').forEach((line) => {
                    const parts = line.split(': ');
                    if (parts.length === 2) {
                      response.headers.set(parts[0], parts[1]);
                    }
                  });
                }
                
                resolve(response);
              };
              
              xhr.onerror = () => {
                console.error('[上传] XMLHttpRequest onerror');
                console.error('[上传] Status:', xhr.status);
                console.error('[上传] StatusText:', xhr.statusText);
                console.error('[上传] Response:', xhr.response);
                console.error('[上传] ReadyState:', xhr.readyState);
                
                // 状态码 0 通常表示 CORS 错误或连接被重置
                if (xhr.status === 0) {
                  reject(new Error('连接被重置（可能是 CORS 配置问题或网络错误）'));
                } else {
                  reject(new Error(`Network error: ${xhr.status} ${xhr.statusText}`));
                }
              };
              
              xhr.ontimeout = () => {
                console.error('[上传] XMLHttpRequest timeout');
                reject(new Error('Request timeout'));
              };
              
              // 发送文件
              console.log('[上传] 开始发送文件，大小:', file.size, 'bytes');
              xhr.send(file);
            });
            
            console.log('[上传] Fetch 成功，响应状态:', uploadResponse.status);
          } catch (fetchError: unknown) {
            // 捕获网络错误（可能是 CORS 问题）
            const error = fetchError as Error;
            console.error('[上传] Fetch 错误:', error);
            
            // 如果是 CORS 或网络错误，尝试回退到后端上传
            if (error.message.includes('Failed to fetch') || 
                error.message.includes('CORS') || 
                error.name === 'TypeError') {
              console.log('[上传] 检测到可能的 CORS 问题，回退到后端上传方式...');
              notify('直接上传失败（CORS 配置问题），尝试通过后端上传...', { type: 'warning' });
              
              // 回退到后端上传（若单次请求体过大可能受入口/反代限制）
              try {
                const formData = new FormData();
                formData.append('file', file);
                
                const fallbackResponse = await apiClient.post(`/admin/app-versions/${platform}/upload`, formData, {
                  headers: {
                    'Content-Type': 'multipart/form-data',
                  },
                });
                
                const result = fallbackResponse.data?.data || {};
                storagePath = result.storagePath;
                fileSize = result.fileSize;
                checksum = result.checksum;
                
                notify('文件上传成功（通过后端）', { type: 'success' });
                // 回退成功，跳过后续的 R2 上传处理
              } catch (fallbackError: unknown) {
                const fallbackErr = fallbackError as { response?: { status?: number; data?: { error?: { message?: string } } } };
                if (fallbackErr.response?.status === 413) {
                  const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                  throw new Error(`文件过大（${fileSizeMB}MB）。经服务端上传可能受入口单次请求大小限制，请配置 R2 CORS 以支持浏览器直传 R2。`);
                }
                throw fallbackError;
              }
            } else {
              throw error;
            }
          }
          
          // 如果回退成功，uploadResponse 可能未定义，需要跳过后续处理
          if (!uploadResponse) {
            // 回退成功，storagePath 等已经设置，继续执行后续的状态更新
          } else {
            console.log('[上传] R2 响应状态:', uploadResponse.status, uploadResponse.statusText);
            
            if (!uploadResponse.ok) {
              const errorText = await uploadResponse.text().catch(() => '无法读取错误信息');
              const responseHeaders: Record<string, string> = {};
              uploadResponse.headers.forEach((value, key) => {
                responseHeaders[key] = value;
              });
              
              // 检查是否是签名错误
              const isSignatureError = errorText.includes('SignatureDoesNotMatch') || 
                                      errorText.includes('Signature') ||
                                      errorText.includes('InvalidArgument') ||
                                      uploadResponse.status === 403;
              
              console.error('[上传] R2 上传失败:', {
                status: uploadResponse.status,
                statusText: uploadResponse.statusText,
                error: errorText,
                responseHeaders: responseHeaders,
                requestURL: uploadURL.substring(0, 200),
                contentType: contentType,
                isSignatureError: isSignatureError,
              });
              
              // 如果是签名错误，提供更详细的提示
              if (isSignatureError) {
                console.error('[上传] 签名验证失败（403），可能的原因：');
                console.error('1. Content-Type 不匹配（URL 中的值与请求头中的值不一致）');
                console.error('   当前 Content-Type:', contentType);
                console.error('   URL 中的 Content-Type:', urlObj.searchParams.get('Content-Type'));
                console.error('2. URL 编码问题（查询参数编码不一致）');
                console.error('3. 时间戳过期（预签名 URL 已过期）');
                console.error('4. 签名计算错误（Canonical Request 格式不正确）');
                console.error('5. 凭证问题（Access Key ID 或 Secret Key 不正确）');
                
                // 解析 XML 错误响应（如果存在）
                if (errorText && errorText.includes('<Error>')) {
                  try {
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(errorText, 'text/xml');
                    const code = xmlDoc.querySelector('Code')?.textContent;
                    const message = xmlDoc.querySelector('Message')?.textContent;
                    console.error('[上传] R2 错误详情:', {
                      code: code,
                      message: message,
                    });
                  } catch (e) {
                    console.error('[上传] 无法解析错误响应:', e);
                  }
                }
              }
              
              // 如果是 403 或 CORS 相关错误，尝试回退
              if (uploadResponse.status === 403 || uploadResponse.status === 0) {
                console.log('[上传] 检测到权限或 CORS 问题，回退到后端上传方式...');
                notify('直接上传失败（CORS 配置问题），尝试通过后端上传...', { type: 'warning' });
                
                // 回退到后端上传（若单次请求体过大可能受入口/反代限制）
                try {
                  const formData = new FormData();
                  formData.append('file', file);
                  
                  const fallbackResponse = await apiClient.post(`/admin/app-versions/${platform}/upload`, formData, {
                    headers: {
                      'Content-Type': 'multipart/form-data',
                    },
                  });
                  
                  const result = fallbackResponse.data?.data || {};
                  storagePath = result.storagePath;
                  fileSize = result.fileSize;
                  checksum = result.checksum;
                  
                  notify('文件上传成功（通过后端）', { type: 'success' });
                  // 回退成功，storagePath 等已经设置，继续执行后续的状态更新
                } catch (fallbackError: unknown) {
                  const fallbackErr = fallbackError as { response?: { status?: number; data?: { error?: { message?: string } } } };
                  if (fallbackErr.response?.status === 413) {
                    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
                    throw new Error(`文件过大（${fileSizeMB}MB）。经服务端上传可能受入口单次请求大小限制，请配置 R2 CORS 以直传 R2，或使用分块上传。`);
                  }
                  throw fallbackError;
                }
              } else {
                throw new Error(`上传失败: ${uploadResponse.status} ${uploadResponse.statusText} - ${errorText}`);
              }
            } else {
              // R2 上传成功
              // 4. 构建存储路径（从对象键生成公开 URL）
              // objectKey 格式：apps/android/xxx.apk
              // storagePath 应该保存为相对路径，与后端 UploadFile 返回的格式一致
              // 后端会从 URL 中提取相对路径，所以这里直接使用 objectKey
              storagePath = objectKey;
              console.log('[上传] 上传成功，存储路径:', storagePath);
              
              notify('文件上传成功', { type: 'success' });
            }
          }
        } catch (urlError: unknown) {
          console.error('[上传] 预签名 URL 上传过程出错:', urlError);
          // 如果错误已经被处理（回退到后端上传），不再抛出
          // 检查是否已经设置了 storagePath（表示回退成功）
          if (!storagePath) {
            throw urlError;
          }
        }
      } else {
        // 小文件：通过后端 multipart 上传
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post(`/admin/app-versions/${platform}/upload`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const result = response.data?.data || {};
        storagePath = result.storagePath;
        fileSize = result.fileSize;
        checksum = result.checksum;
        
        notify('文件上传成功', { type: 'success' });
      }
      
      // 更新版本信息中的文件相关字段
      if (storagePath !== undefined && fileSize !== undefined && checksum !== undefined) {
        handleChange(platform, 'storagePath', storagePath as string);
        handleChange(platform, 'fileSize', fileSize as number);
        handleChange(platform, 'checksum', checksum as string);
      } else {
        throw new Error('上传失败：未获取到文件信息');
      }
    } catch (error: unknown) {
      console.error('[上传] 文件上传失败:', error);
      let errorMessage = '文件上传失败';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else {
        const err = error as { response?: { data?: { error?: { message?: string } } } };
        if (err.response?.data?.error?.message) {
          errorMessage = err.response.data.error.message;
        }
      }
      
      notify(errorMessage, { type: 'error' });
    } finally {
      setUploading((prev) => ({ ...prev, [platform]: false }));
    }
  };

  /** 各平台允许的安装包扩展名 */
  const getAcceptExtensions = useCallback((platformId: string): string[] => {
    switch (platformId) {
      case 'android': return ['.apk'];
      case 'ios': return ['.ipa'];
      case 'macos': return ['.dmg', '.pkg'];
      case 'windows': return ['.exe', '.msi', '.msix'];
      default: return [];
    }
  }, []);

  /** 校验拖入的文件是否为当前平台支持的安装包 */
  const isAcceptedFile = useCallback((file: File, platformId: string): boolean => {
    const exts = getAcceptExtensions(platformId);
    const name = file.name?.toLowerCase() ?? '';
    return exts.some((ext) => name.endsWith(ext));
  }, [getAcceptExtensions]);

  const handleDrop = useCallback((platformId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver((prev) => ({ ...prev, [platformId]: false }));
    if (uploading[platformId]) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!isAcceptedFile(file, platformId)) {
      const exts = getAcceptExtensions(platformId).join(', ');
      notify(`请拖入该平台支持的安装包（${exts}）`, { type: 'warning' });
      return;
    }
    handleFileUpload(platformId, file);
  }, [uploading, isAcceptedFile, getAcceptExtensions, notify, handleFileUpload]);

  const handleDragOver = useCallback((platformId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (uploading[platformId]) return;
    setDragOver((prev) => ({ ...prev, [platformId]: true }));
  }, [uploading]);

  const handleDragLeave = useCallback((platformId: string, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver((prev) => ({ ...prev, [platformId]: false }));
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (!canRead) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">无权限访问此页面</Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        版本管理
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        管理各平台的应用版本信息，包括版本号、更新说明、安装包上传和强制升级设置。
      </Typography>

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={currentTab} onChange={handleTabChange} aria-label="平台选择">
            {PLATFORMS.map((platform, index) => (
              <Tab
                key={platform.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <span>{platform.icon}</span>
                    <span>{platform.label}</span>
                    {(platform.id === 'ios' ? versions[platform.id]?.storeUrl : versions[platform.id]?.storagePath) && (
                      <Chip label={platform.id === 'ios' ? '已设置' : '已上传'} size="small" color="success" />
                    )}
                  </Box>
                }
                id={`platform-tab-${index}`}
                aria-controls={`platform-tabpanel-${index}`}
              />
            ))}
          </Tabs>
        </Box>

        {PLATFORMS.map((platform, index) => {
          const version = versions[platform.id];
          if (!version) return null;

          return (
            <TabPanel key={platform.id} value={currentTab} index={index}>
              <CardContent>
                <Stack spacing={3}>
                  {/* 版本信息 */}
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      版本信息
                    </Typography>
                    <Stack spacing={2} sx={{ mt: 2 }}>
                      <TextField
                        label="最新版本号"
                        value={version.latestVersion}
                        onChange={(e) => handleChange(platform.id, 'latestVersion', e.target.value)}
                        disabled={!canWrite}
                        fullWidth
                        required
                        placeholder="例如：1.0.0"
                        helperText="使用语义化版本号格式（MAJOR.MINOR.PATCH）"
                      />
                      <TextField
                        label="版本更新说明"
                        value={version.releaseNotes}
                        onChange={(e) => handleChange(platform.id, 'releaseNotes', e.target.value)}
                        disabled={!canWrite}
                        fullWidth
                        required
                        multiline
                        rows={6}
                        placeholder="请输入版本更新说明..."
                        helperText="支持多行文本，将展示给用户"
                      />
                      {/* 必须升级的最高版本 - 使用原生下拉选择框 */}
                      <Box>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                          必须升级的最高版本
                        </Typography>
                        <Box
                          component="select"
                          value={version.forceUpdateVersion || ''}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            const selectedValue = e.target.value;
                            // 如果选择的是当前版本，不允许选择
                            if (selectedValue === version.latestVersion) {
                              return;
                            }
                            handleChange(platform.id, 'forceUpdateVersion', selectedValue);
                          }}
                          disabled={!canWrite || loadingHistory[platform.id]}
                          sx={{
                            width: '100%',
                            padding: '14px',
                            fontSize: '1rem',
                            fontFamily: 'inherit',
                            border: '1px solid rgba(0, 0, 0, 0.23)',
                            borderRadius: '4px',
                            backgroundColor: 'background.paper',
                            color: 'text.primary',
                            cursor: 'pointer',
                            '&:hover:not(:disabled)': {
                              borderColor: 'text.primary',
                            },
                            '&:focus': {
                              borderColor: 'primary.main',
                              outline: 'none',
                              borderWidth: '2px',
                            },
                            '&:disabled': {
                              backgroundColor: 'action.disabledBackground',
                              cursor: 'not-allowed',
                              opacity: 0.6,
                            },
                          }}
                        >
                          <option value="">不强制升级</option>
                          {/* 当前版本（如果有）- 显示但不可选择 */}
                          {version.latestVersion && (
                            <option key={`current-${version.latestVersion}`} value={version.latestVersion} disabled>
                              {version.latestVersion} (当前版本 - 不可选择)
                            </option>
                          )}
                          {/* 历史版本 */}
                          {versionHistory[platform.id] && versionHistory[platform.id].length > 0 && (
                            <>
                              {versionHistory[platform.id].map((historyItem) => (
                                <option key={historyItem.version} value={historyItem.version}>
                                  {historyItem.version}
                                </option>
                              ))}
                            </>
                          )}
                          {/* 如果没有历史版本且没有当前版本 */}
                          {!version.latestVersion && (!versionHistory[platform.id] || versionHistory[platform.id].length === 0) && (
                            <option disabled value="">
                              暂无可用版本
                            </option>
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
                          {loadingHistory[platform.id] 
                            ? '正在加载历史版本...' 
                            : versionHistory[platform.id] && versionHistory[platform.id].length > 0
                            ? `共 ${versionHistory[platform.id].length} 个历史版本可选，低于选中版本的客户端必须强制升级`
                            : version.latestVersion
                            ? '从历史版本中选择，低于选中版本的客户端必须强制升级'
                            : '请先设置当前版本号'}
                        </Typography>
                      </Box>
                      
                      {/* 查看历史版本按钮 */}
                      <Box>
                        <Button
                          variant="outlined"
                          startIcon={<HistoryIcon />}
                          onClick={() => {
                            setHistoryDialogOpen((prev) => ({ ...prev, [platform.id]: true }));
                            setHistoryPage((prev) => ({ ...prev, [platform.id]: 1 }));
                            // 如果还没有加载历史版本，先加载
                            if (!versionHistory[platform.id]) {
                              loadVersionHistory(platform.id);
                            }
                          }}
                          disabled={loadingHistory[platform.id]}
                        >
                          查看历史版本
                          {versionHistory[platform.id] && versionHistory[platform.id].length > 0 && (
                            <Chip 
                              label={versionHistory[platform.id].length} 
                              size="small" 
                              sx={{ ml: 1, height: 20 }} 
                            />
                          )}
                        </Button>
                      </Box>
                    </Stack>
                  </Box>

                  <Divider />

                  {/* iOS：商店地址；其他平台：安装包 */}
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      {platform.id === 'ios' ? '应用商店地址' : '安装包'}
                    </Typography>
                    <Stack spacing={2} sx={{ mt: 2 }}>
                      {platform.id === 'ios' ? (
                        <>
                          <TextField
                            label="App Store 地址"
                            value={version.storeUrl || ''}
                            onChange={(e) => handleChange(platform.id, 'storeUrl', e.target.value)}
                            disabled={!canWrite}
                            fullWidth
                            placeholder="https://apps.apple.com/app/xxx/id123456789"
                            helperText="iOS 应用通过 App Store 分发，请填写应用在 App Store 的链接"
                          />
                          {version.storeUrl && (
                            <Alert severity="success">
                              已设置商店地址，用户将跳转至 App Store 下载
                            </Alert>
                          )}
                        </>
                      ) : (
                        <>
                          {version.storagePath ? (
                            <>
                              <Alert severity="success">
                                已上传安装包：{version.storagePath}
                              </Alert>
                              <TextField
                                label="文件大小"
                                value={formatFileSize(version.fileSize)}
                                disabled
                                fullWidth
                              />
                              <TextField
                                label="文件校验和（SHA256）"
                                value={version.checksum || '未计算'}
                                disabled
                                fullWidth
                              />
                            </>
                          ) : (
                            <Alert severity="info">
                              尚未上传安装包
                            </Alert>
                          )}
                          
                          {canWrite && (
                            <Box
                              onDragOver={(e) => handleDragOver(platform.id, e)}
                              onDragLeave={(e) => handleDragLeave(platform.id, e)}
                              onDrop={(e) => handleDrop(platform.id, e)}
                              sx={{
                                display: 'inline-block',
                                p: 1.5,
                                borderRadius: 1,
                                border: '2px dashed',
                                borderColor: dragOver[platform.id] ? 'primary.main' : 'divider',
                                bgcolor: dragOver[platform.id] ? 'action.hover' : 'transparent',
                                transition: 'border-color 0.2s, background-color 0.2s',
                              }}
                            >
                              <input
                                accept={
                                  platform.id === 'android' ? '.apk' :
                                  platform.id === 'macos' ? '.dmg,.pkg' :
                                  '.exe,.msi,.msix'
                                }
                                style={{ display: 'none' }}
                                id={`file-upload-${platform.id}`}
                                type="file"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    handleFileUpload(platform.id, file);
                                  }
                                }}
                              />
                              <label htmlFor={`file-upload-${platform.id}`}>
                                <Button
                                  variant="outlined"
                                  component="span"
                                  startIcon={<UploadIcon />}
                                  disabled={uploading[platform.id]}
                                >
                                  {uploading[platform.id] ? '上传中...' : '上传安装包（可拖拽到此处）'}
                                </Button>
                              </label>
                            </Box>
                          )}
                        </>
                      )}
                    </Stack>
                  </Box>

                  {/* 更新时间 */}
                  {version.updatedAt && (
                    <>
                      <Divider />
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          最后更新时间：{new Date(version.updatedAt).toLocaleString('zh-CN')}
                        </Typography>
                      </Box>
                    </>
                  )}

                  {/* 操作按钮 */}
                  {canWrite && (
                    <Stack direction="row" spacing={2} sx={{ mt: 2, justifyContent: 'flex-end' }}>
                      <Button
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={loadVersions}
                        disabled={saving[platform.id] || uploading[platform.id] || loading}
                      >
                        重置
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={() => handleSave(platform.id)}
                        disabled={saving[platform.id] || uploading[platform.id] || loading}
                      >
                        {saving[platform.id] ? '保存中...' : '保存版本信息'}
                      </Button>
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </TabPanel>
          );
        })}
      </Card>

      {/* 历史版本列表弹窗 */}
      {PLATFORMS.map((platform) => {
        const platformHistory = versionHistory[platform.id] || [];
        const currentPage = historyPage[platform.id] || 1;
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedHistory = platformHistory.slice(startIndex, endIndex);
        const totalPages = Math.ceil(platformHistory.length / itemsPerPage);

        return (
          <Dialog
            key={`history-dialog-${platform.id}`}
            open={historyDialogOpen[platform.id] || false}
            onClose={() => setHistoryDialogOpen((prev) => ({ ...prev, [platform.id]: false }))}
            maxWidth="md"
            fullWidth
          >
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>{platform.icon}</span>
                  <span>{platform.label} - 历史版本列表</span>
                </Box>
                <IconButton
                  onClick={() => setHistoryDialogOpen((prev) => ({ ...prev, [platform.id]: false }))}
                  size="small"
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              {loadingHistory[platform.id] ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : platformHistory.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                  暂无历史版本记录
                </Alert>
              ) : (
                <>
                  <TableContainer component={Paper} variant="outlined">
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold' }}>版本号</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>版本更新说明</TableCell>
                          <TableCell sx={{ fontWeight: 'bold' }}>发布时间</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {paginatedHistory.map((historyItem) => (
                          <TableRow key={historyItem.version}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="medium">
                                {historyItem.version}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                                {historyItem.releaseNotes || '无更新说明'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" color="text.secondary">
                                {new Date(historyItem.createdAt).toLocaleString('zh-CN')}
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  
                  {totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                      <Pagination
                        count={totalPages}
                        page={currentPage}
                        onChange={(_, page) => {
                          setHistoryPage((prev) => ({ ...prev, [platform.id]: page }));
                        }}
                        color="primary"
                        showFirstButton
                        showLastButton
                      />
                    </Box>
                  )}
                  
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    共 {platformHistory.length} 个历史版本，当前显示第 {startIndex + 1}-{Math.min(endIndex, platformHistory.length)} 条
                  </Typography>
                </>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setHistoryDialogOpen((prev) => ({ ...prev, [platform.id]: false }))}>
                关闭
              </Button>
            </DialogActions>
          </Dialog>
        );
      })}
    </Box>
  );
};
