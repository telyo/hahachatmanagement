import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { Create, SimpleForm, TextInput, SelectInput, NumberInput, ArrayInput, SimpleFormIterator, BooleanInput, useNotify, useRedirect, useGetList } from 'react-admin';
import apiClient from '../../services/api';
import { useState, useEffect } from 'react';
import { Button, Box, Alert } from '@mui/material';
export const ClientProviderCreate = () => {
    const notify = useNotify();
    const redirect = useRedirect();
    const [uploading, setUploading] = useState(false);
    const [iconFile, setIconFile] = useState(null);
    const [isHahachat, setIsHahachat] = useState(false);
    const [hasExistingHahachat, setHasExistingHahachat] = useState(false);
    // 检查是否已有 Hahachat 提供商
    const { data: providers } = useGetList('client-providers', {
        pagination: { page: 1, perPage: 1000 },
        sort: { field: 'id', order: 'ASC' },
    });
    useEffect(() => {
        if (providers) {
            const existingHahachat = providers.some((p) => p.isHahachat === true);
            setHasExistingHahachat(existingHahachat);
            if (existingHahachat) {
                setIsHahachat(false); // 如果已有 Hahachat，不允许再创建
            }
        }
    }, [providers]);
    const handleIconFileSelect = (event) => {
        const file = event.target.files?.[0];
        if (!file) {
            setIconFile(null);
            return;
        }
        // 验证文件类型
        const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
        if (!allowedTypes.includes(file.type)) {
            notify('不支持的图片格式，仅支持 PNG、JPG、SVG', { type: 'error' });
            setIconFile(null);
            return;
        }
        // 验证文件大小（最大 2MB）
        if (file.size > 2 * 1024 * 1024) {
            notify('文件大小不能超过 2MB', { type: 'error' });
            setIconFile(null);
            return;
        }
        setIconFile(file);
        notify('图标已选择，将在创建提供商后自动上传', { type: 'info' });
    };
    const handleSave = async (data) => {
        try {
            // 如果设置为 Hahachat，检查是否已有其他 Hahachat 提供商
            if (data.isHahachat === true && hasExistingHahachat) {
                notify('已存在 Hahachat 提供商，只能有一个 Hahachat 提供商', { type: 'error' });
                return;
            }
            // 如果设置为 Hahachat，清空 modelList
            if (data.isHahachat === true) {
                data.modelList = [];
            }
            else if (!data.modelList || (Array.isArray(data.modelList) && data.modelList.length === 0)) {
                notify('非 Hahachat 提供商必须提供模型列表', { type: 'error' });
                return;
            }
            // 先创建提供商
            const response = await apiClient.post('/admin/client-providers', data);
            const createdProvider = response.data?.data;
            const createdProviderId = createdProvider?.providerId || createdProvider?.id;
            if (!createdProviderId) {
                notify('创建成功，但无法获取提供商ID', { type: 'warning' });
                redirect('list', 'client-providers');
                return;
            }
            // 如果有图标文件，立即上传
            if (iconFile) {
                setUploading(true);
                try {
                    const formData = new FormData();
                    formData.append('icon', iconFile);
                    await apiClient.post(`/admin/client-providers/${createdProviderId}/icon`, formData);
                    notify('提供商创建成功，图标已上传', { type: 'success' });
                }
                catch (uploadError) {
                    const errorMessage = uploadError?.response?.data?.message || '图标上传失败';
                    notify(`提供商已创建，但图标上传失败: ${errorMessage}`, { type: 'warning' });
                }
                finally {
                    setUploading(false);
                }
            }
            else {
                notify('提供商创建成功', { type: 'success' });
            }
            redirect('list', 'client-providers');
        }
        catch (error) {
            const errorMessage = error?.response?.data?.message || '创建失败';
            notify(errorMessage, { type: 'error' });
        }
    };
    return (_jsx(Create, { children: _jsxs(SimpleForm, { onSubmit: handleSave, children: [hasExistingHahachat && (_jsx(Alert, { severity: "info", sx: { mb: 2 }, children: "\u5DF2\u5B58\u5728 Hahachat \u63D0\u4F9B\u5546\uFF0C\u65E0\u6CD5\u518D\u521B\u5EFA\u65B0\u7684 Hahachat \u63D0\u4F9B\u5546" })), _jsxs(Box, { sx: { mb: 2 }, children: [_jsx("input", { accept: "image/png,image/jpeg,image/jpg,image/svg+xml", style: { display: 'none' }, id: "icon-upload-button-create", type: "file", onChange: handleIconFileSelect, disabled: uploading }), _jsx("label", { htmlFor: "icon-upload-button-create", children: _jsx(Button, { variant: "outlined", component: "span", disabled: uploading, children: iconFile ? `已选择: ${iconFile.name}` : '选择图标' }) }), iconFile && (_jsx(Button, { variant: "text", size: "small", onClick: () => setIconFile(null), sx: { ml: 1 }, children: "\u6E05\u9664" }))] }), _jsx(TextInput, { source: "providerCode", label: "\u63D0\u4F9B\u5546\u4EE3\u7801", required: true, helperText: "\u552F\u4E00\u6807\u8BC6\u7B26\uFF0C\u5982 openai, anthropic, hahachat" }), _jsx(TextInput, { source: "displayName", label: "\u663E\u793A\u540D\u79F0", required: true }), _jsx(TextInput, { source: "baseUrl", label: "API \u57FA\u7840 URL", required: true, helperText: "\u63D0\u4F9B\u5546\u7684 API \u57FA\u7840\u5730\u5740" }), _jsx(TextInput, { source: "defaultModel", label: "\u9ED8\u8BA4\u6A21\u578B", required: true, helperText: "\u9ED8\u8BA4\u4F7F\u7528\u7684\u6A21\u578BID" }), _jsx(BooleanInput, { source: "isHahachat", label: "\u662F\u5426\u4E3A Hahachat \u63D0\u4F9B\u5546", defaultValue: false, disabled: hasExistingHahachat, helperText: hasExistingHahachat ? "已存在 Hahachat 提供商，无法再创建" : "开启后，将使用 Hahachat 专用配置（登录页面、订阅套餐页面）", onChange: (e) => setIsHahachat(e.target.checked) }), isHahachat && (_jsxs(_Fragment, { children: [_jsx(TextInput, { source: "loginUrl", label: "\u767B\u5F55\u9875\u9762 URL", required: true, helperText: "Hahachat \u767B\u5F55\u9875\u9762\u7684\u5B8C\u6574 URL" }), _jsx(TextInput, { source: "subscriptionUrl", label: "\u8BA2\u9605\u5957\u9910\u9875\u9762 URL", required: true, helperText: "Hahachat \u8BA2\u9605\u5957\u9910\u9875\u9762\u7684\u5B8C\u6574 URL" })] })), !isHahachat && (_jsx(ArrayInput, { source: "modelList", label: "\u6A21\u578B\u5217\u8868", required: true, children: _jsxs(SimpleFormIterator, { children: [_jsx(TextInput, { source: "modelId", label: "\u6A21\u578BID", required: true, helperText: "\u6A21\u578B\u7684\u552F\u4E00\u6807\u8BC6\u7B26" }), _jsx(TextInput, { source: "displayName", label: "\u663E\u793A\u540D\u79F0", required: true, helperText: "\u6A21\u578B\u5728\u524D\u7AEF\u663E\u793A\u7684\u540D\u79F0" })] }) })), _jsx(SelectInput, { source: "status", label: "\u72B6\u6001", choices: [
                        { id: 'active', name: '活跃' },
                        { id: 'inactive', name: '未激活' },
                    ], defaultValue: "active" }), _jsx(NumberInput, { source: "sortOrder", label: "\u6392\u5E8F", defaultValue: 0 })] }) }));
};
