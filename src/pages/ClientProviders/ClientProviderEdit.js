import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Edit, SimpleForm, TextInput, SelectInput, NumberInput, ArrayInput, SimpleFormIterator, BooleanInput, useNotify, useRedirect, useRefresh, useRecordContext, useGetOne, useGetList } from 'react-admin';
import { useParams } from 'react-router-dom';
import apiClient from '../../services/api';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Box, Typography, Alert } from '@mui/material';
import { useFormContext } from 'react-hook-form';
const ClientProviderEdit = () => {
    const notify = useNotify();
    const redirect = useRedirect();
    const refresh = useRefresh();
    const record = useRecordContext();
    const { id } = useParams();
    const [uploading, setUploading] = useState(false);
    const [currentIconUrl, setCurrentIconUrl] = useState(null);
    const [isHahachat, setIsHahachat] = useState(false);
    const [hasOtherHahachat, setHasOtherHahachat] = useState(false);
    const setFormValueRef = useRef(null);
    const providerId = (record?.id || record?.providerId || id);
    // 如果 useRecordContext 没有数据，使用 useGetOne 获取
    const { data: fetchedRecord } = useGetOne('client-providers', { id: providerId }, { enabled: !!providerId && !record });
    // 使用 fetchedRecord 或 record
    const displayRecord = record || fetchedRecord;
    // 检查是否有其他 Hahachat 提供商
    const { data: providers } = useGetList('client-providers', {
        pagination: { page: 1, perPage: 1000 },
        sort: { field: 'id', order: 'ASC' },
    });
    // 当 record 更新时，更新当前图标 URL 和 isHahachat 状态
    useEffect(() => {
        if (displayRecord?.iconUrl) {
            setCurrentIconUrl(displayRecord.iconUrl);
        }
        else if (displayRecord && !displayRecord.iconUrl) {
            setCurrentIconUrl(null);
        }
        // 更新 isHahachat 状态
        if (displayRecord?.isHahachat !== undefined) {
            setIsHahachat(displayRecord.isHahachat === true);
        }
    }, [record, fetchedRecord, displayRecord]);
    // 检查是否有其他 Hahachat 提供商
    useEffect(() => {
        if (providers && providerId) {
            const otherHahachat = providers.some((p) => p.isHahachat === true && (p.providerId || p.id) !== providerId);
            setHasOtherHahachat(otherHahachat);
        }
    }, [providers, providerId]);
    const handleSave = async (data) => {
        try {
            const updateId = (data.id || data.providerId || providerId);
            if (!updateId) {
                notify('提供商ID不存在', { type: 'error' });
                return;
            }
            // 如果设置为 Hahachat，检查是否已有其他 Hahachat 提供商
            if (data.isHahachat === true && hasOtherHahachat) {
                notify('已存在其他 Hahachat 提供商，只能有一个 Hahachat 提供商', { type: 'error' });
                return;
            }
            // 如果设置为 Hahachat，清空 modelList
            if (data.isHahachat === true) {
                data.modelList = [];
            }
            else if (!data.isHahachat && (!data.modelList || (Array.isArray(data.modelList) && data.modelList.length === 0))) {
                // 如果取消 Hahachat 标记，需要确保有 modelList
                if (!displayRecord?.modelList || (Array.isArray(displayRecord.modelList) && displayRecord.modelList.length === 0)) {
                    notify('非 Hahachat 提供商必须提供模型列表', { type: 'error' });
                    return;
                }
            }
            await apiClient.put(`/admin/client-providers/${updateId}`, data);
            notify('提供商更新成功', { type: 'success' });
            redirect('list', 'client-providers');
        }
        catch (error) {
            const errorMessage = error?.response?.data?.message || '更新失败';
            notify(errorMessage, { type: 'error' });
        }
    };
    // 文件上传处理函数
    const handleIconUpload = useCallback(async (event) => {
        console.log('[IconUpload] onChange triggered', event.target.files);
        const file = event.target.files?.[0];
        if (!file) {
            console.log('[IconUpload] No file selected');
            return;
        }
        console.log('[IconUpload] File selected:', file.name, file.type, file.size);
        // 验证文件类型
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            notify('不支持的图片格式，仅支持 PNG、JPG、SVG', { type: 'error' });
            return;
        }
        // 验证文件大小（最大 2MB）
        if (file.size > 2 * 1024 * 1024) {
            notify('文件大小不能超过 2MB', { type: 'error' });
            return;
        }
        if (!providerId) {
            notify('提供商ID不存在', { type: 'error' });
            return;
        }
        console.log('[IconUpload] Starting upload for provider:', providerId);
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('icon', file);
            console.log('[IconUpload] Sending request to:', `/admin/client-providers/${providerId}/icon`);
            const response = await apiClient.post(`/admin/client-providers/${providerId}/icon`, formData);
            console.log('[IconUpload] Upload response:', response);
            const newIconUrl = response.data?.data?.iconUrl;
            if (newIconUrl) {
                const iconUrlWithTimestamp = `${newIconUrl}?t=${Date.now()}`;
                setCurrentIconUrl(iconUrlWithTimestamp);
                // 使用 ref 更新表单中的 iconUrl 字段，使表单变为"脏"状态
                if (setFormValueRef.current) {
                    console.log('[IconUpload] Updating form field iconUrl');
                    setFormValueRef.current('iconUrl', newIconUrl, { shouldDirty: true, shouldTouch: true });
                }
            }
            notify('图标上传成功', { type: 'success' });
            refresh();
        }
        catch (error) {
            console.error('[IconUpload] Upload error:', error);
            const errorMessage = error?.response?.data?.message || '上传失败';
            notify(errorMessage, { type: 'error' });
        }
        finally {
            setUploading(false);
            const fileInput = document.getElementById('icon-upload-button');
            if (fileInput) {
                fileInput.value = '';
            }
        }
    }, [notify, providerId, refresh]);
    // 内部组件：用于在 SimpleForm 内部获取 setValue 并保存到 ref
    const IconUploadHandler = () => {
        const { setValue } = useFormContext();
        useEffect(() => {
            setFormValueRef.current = setValue;
            return () => {
                setFormValueRef.current = null;
            };
        }, [setValue]);
        return null; // 这个组件不渲染任何内容，只用于获取 setValue
    };
    // 判断是否显示 isHahachat 开关
    const canShowIsHahachatSwitch = !hasOtherHahachat;
    return (_jsx(Edit, { children: _jsxs(SimpleForm, { onSubmit: handleSave, children: [hasOtherHahachat && (_jsx(Alert, { severity: "info", sx: { mb: 2 }, children: "\u5DF2\u5B58\u5728\u5176\u4ED6 Hahachat \u63D0\u4F9B\u5546\uFF0C\u65E0\u6CD5\u5C06\u6B64\u63D0\u4F9B\u5546\u8BBE\u7F6E\u4E3A Hahachat" })), _jsx(IconUploadHandler, {}), _jsxs(Box, { sx: { mb: 2, display: 'flex', alignItems: 'center', gap: 2 }, children: [_jsxs(Box, { children: [_jsx("input", { accept: "image/png,image/jpeg,image/jpg,image/svg+xml", style: { display: 'none' }, id: "icon-upload-button", type: "file", onChange: handleIconUpload, disabled: uploading }), _jsx("label", { htmlFor: "icon-upload-button", children: _jsx(Button, { variant: "outlined", component: "span", disabled: uploading, children: uploading ? '上传中...' : '上传图标' }) })] }), _jsx(Box, { sx: {
                                minWidth: 100,
                                minHeight: 100,
                                maxWidth: 100,
                                maxHeight: 100,
                                border: '1px solid #e0e0e0',
                                borderRadius: 1,
                                padding: 1,
                                backgroundColor: '#f5f5f5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }, children: (currentIconUrl || displayRecord?.iconUrl) ? (_jsx(Box, { component: "img", src: currentIconUrl || displayRecord?.iconUrl, alt: "\u63D0\u4F9B\u5546\u56FE\u6807", onError: (e) => {
                                    console.error('图标加载失败:', currentIconUrl || displayRecord?.iconUrl);
                                    e.target.style.display = 'none';
                                }, sx: {
                                    maxWidth: '100%',
                                    maxHeight: '100%',
                                    objectFit: 'contain',
                                } })) : (_jsx(Typography, { variant: "caption", color: "text.secondary", children: "\u6682\u65E0\u56FE\u6807" })) })] }), _jsx(TextInput, { source: "iconUrl", style: { display: 'none' } }), _jsx(TextInput, { source: "providerId", disabled: true, label: "\u63D0\u4F9B\u5546ID" }), _jsx(TextInput, { source: "providerCode", disabled: true, label: "\u63D0\u4F9B\u5546\u4EE3\u7801", helperText: "\u63D0\u4F9B\u5546\u4EE3\u7801\u521B\u5EFA\u540E\u4E0D\u53EF\u4FEE\u6539" }), _jsx(TextInput, { source: "displayName", label: "\u663E\u793A\u540D\u79F0", required: true }), _jsx(TextInput, { source: "baseUrl", label: "API \u57FA\u7840 URL", required: true, helperText: "\u63D0\u4F9B\u5546\u7684 API \u57FA\u7840\u5730\u5740" }), _jsx(TextInput, { source: "defaultModel", label: "\u9ED8\u8BA4\u6A21\u578B", required: true, helperText: "\u9ED8\u8BA4\u4F7F\u7528\u7684\u6A21\u578BID" }), canShowIsHahachatSwitch && (_jsx(BooleanInput, { source: "isHahachat", label: "\u662F\u5426\u4E3A Hahachat \u63D0\u4F9B\u5546", helperText: "\u5F00\u542F\u540E\uFF0C\u5C06\u4F7F\u7528 Hahachat \u4E13\u7528\u914D\u7F6E\uFF08\u767B\u5F55\u9875\u9762\u3001\u8BA2\u9605\u5957\u9910\u9875\u9762\uFF09\uFF0C\u5E76\u9690\u85CF\u6A21\u578B\u5217\u8868", onChange: (e) => setIsHahachat(e.target.checked) })), isHahachat && (_jsxs(_Fragment, { children: [_jsx(TextInput, { source: "loginUrl", label: "\u767B\u5F55\u9875\u9762 URL", required: true, helperText: "Hahachat \u767B\u5F55\u9875\u9762\u7684\u5B8C\u6574 URL" }), _jsx(TextInput, { source: "subscriptionUrl", label: "\u8BA2\u9605\u5957\u9910\u9875\u9762 URL", required: true, helperText: "Hahachat \u8BA2\u9605\u5957\u9910\u9875\u9762\u7684\u5B8C\u6574 URL" })] })), !isHahachat && (_jsx(ArrayInput, { source: "modelList", label: "\u6A21\u578B\u5217\u8868", required: true, children: _jsxs(SimpleFormIterator, { children: [_jsx(TextInput, { source: "modelId", label: "\u6A21\u578BID", required: true, helperText: "\u6A21\u578B\u7684\u552F\u4E00\u6807\u8BC6\u7B26" }), _jsx(TextInput, { source: "displayName", label: "\u663E\u793A\u540D\u79F0", required: true, helperText: "\u6A21\u578B\u5728\u524D\u7AEF\u663E\u793A\u7684\u540D\u79F0" })] }) })), _jsx(SelectInput, { source: "status", label: "\u72B6\u6001", choices: [
                        { id: 'active', name: '活跃' },
                        { id: 'inactive', name: '未激活' },
                    ] }), _jsx(NumberInput, { source: "sortOrder", label: "\u6392\u5E8F" })] }) }));
};
export default ClientProviderEdit;
