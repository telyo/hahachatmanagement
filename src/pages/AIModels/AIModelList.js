import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { List, EditButton, ShowButton, CreateButton, Filter, TextInput, SelectInput, TopToolbar, Button, usePermissions, useListContext, BulkDeleteButton, BulkActionsToolbar, } from 'react-admin';
import { Table, TableHead, TableRow, TableCell, TableBody, Checkbox } from '@mui/material';
import { useNotify, useRedirect } from 'react-admin';
import { hasPermission } from '../../utils/permissions';
import { authUtils } from '../../utils/auth';
import apiClient from '../../services/api';
import { ContentCopy as CopyIcon, ImportExport as ImportExportIcon, DragIndicator as DragIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy, } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRef } from 'react';
const AIModelFilter = (props) => (_jsxs(Filter, { ...props, children: [_jsx(TextInput, { source: "search", label: "\u641C\u7D22\u6A21\u578BID\u6216\u540D\u79F0" }), _jsx(SelectInput, { source: "status", label: "\u72B6\u6001", choices: [
                { id: 'active', name: '活跃' },
                { id: 'inactive', name: '未激活' },
            ] }), _jsx(SelectInput, { source: "accessCategory", label: "\u8BBF\u95EE\u7C7B\u522B", choices: [
                { id: 'common', name: '通用' },
                { id: 'exclusive', name: '专属' },
                { id: 'embedding', name: '嵌入' },
            ], alwaysOn: true })] }));
const DuplicateButton = ({ record }) => {
    const notify = useNotify();
    const redirect = useRedirect();
    const handleDuplicate = async () => {
        if (!record?.id) {
            notify('模型ID不存在', { type: 'error' });
            return;
        }
        const displayName = record.displayName || record.name;
        if (!window.confirm(`确定要复制模型 "${displayName}" 吗？`)) {
            return;
        }
        try {
            const response = await apiClient.post(`/admin/ai/models/${record.id}/duplicate`, {
                newModelId: `${record.id}-copy`,
                name: `${displayName} (副本)`,
            });
            notify('复制成功', { type: 'success' });
            redirect('show', 'ai-models', response.data.data.id);
        }
        catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message || '复制失败';
            notify(errorMessage, { type: 'error' });
        }
    };
    return (_jsx(Button, { label: "\u590D\u5236", onClick: handleDuplicate, startIcon: _jsx(CopyIcon, {}) }));
};
const CustomActions = () => {
    const navigate = useNavigate();
    const { permissions } = usePermissions();
    const adminInfo = authUtils.getAdminInfo();
    const canWrite = hasPermission(permissions, 'ai_models:write', adminInfo?.role);
    const canImportExport = hasPermission(permissions, 'ai_models:import_export', adminInfo?.role);
    return (_jsxs(TopToolbar, { children: [canWrite && _jsx(CreateButton, {}), canImportExport && (_jsx(Button, { label: "\u5BFC\u5165/\u5BFC\u51FA", onClick: () => navigate('/ai-models-import-export'), startIcon: _jsx(ImportExportIcon, {}) }))] }));
};
// 可拖拽行组件
const SortableRow = ({ record, children, id, onRowClick, selected, onToggleItem, }) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging, } = useSortable({ id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };
    return (_jsxs(TableRow, { ref: setNodeRef, style: style, ...attributes, onClick: onRowClick ? () => onRowClick(record.id) : undefined, sx: onRowClick ? { cursor: 'pointer' } : undefined, children: [_jsx(TableCell, { padding: "checkbox", onClick: (e) => e.stopPropagation(), children: _jsx(Checkbox, { checked: selected, onClick: (e) => {
                        e.stopPropagation();
                        onToggleItem?.(id, e);
                    } }) }), _jsx(TableCell, { padding: "checkbox", sx: { cursor: 'grab', width: 40 }, onClick: (e) => e.stopPropagation(), ...listeners, children: _jsx(DragIcon, { color: "action", fontSize: "small" }) }), children] }));
};
// 可拖拽排序的 AI 模型列表表格
const SortableAIModelDatagrid = () => {
    const { data, isLoading, refetch, selectedIds, onSelect, onToggleItem } = useListContext();
    const notify = useNotify();
    const navigate = useNavigate();
    const { permissions } = usePermissions();
    const canWrite = hasPermission(permissions, 'ai_models:write', authUtils.getAdminInfo()?.role);
    const dataRef = useRef([]);
    const sensors = useSensors(useSensor(PointerSensor, {
        activationConstraint: {
            distance: 8,
        },
    }), useSensor(KeyboardSensor, {
        coordinateGetter: sortableKeyboardCoordinates,
    }));
    const handleDragEnd = async (event) => {
        const { active, over } = event;
        if (!over || active.id === over.id)
            return;
        const items = [...dataRef.current];
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        if (oldIndex === -1 || newIndex === -1)
            return;
        const reordered = arrayMove(items, oldIndex, newIndex);
        const models = reordered.map((item, index) => ({
            modelId: item.id,
            sortOrder: index,
        }));
        try {
            await apiClient.put('/admin/ai/models/sort-order', { models });
            notify('排序已更新', { type: 'success' });
            refetch();
        }
        catch (error) {
            const msg = error.response?.data?.error?.message || error.message || '排序更新失败';
            notify(msg, { type: 'error' });
        }
    };
    if (isLoading || !data) {
        return null;
    }
    // 按 sortOrder 正序显示
    const sortedData = [...(data || [])].sort((a, b) => {
        const orderA = a?.display?.sortOrder ?? a?.displayConfig?.sortOrder ?? 0;
        const orderB = b?.display?.sortOrder ?? b?.displayConfig?.sortOrder ?? 0;
        return Number(orderA) - Number(orderB);
    });
    dataRef.current = sortedData;
    const ids = sortedData.map((item) => item.id);
    const selectedSet = new Set(selectedIds || []);
    const allSelected = sortedData.length > 0 && sortedData.every((r) => selectedSet.has(r.id));
    const someSelected = sortedData.some((r) => selectedSet.has(r.id));
    const handleSelectAll = (e) => {
        e.stopPropagation();
        if (allSelected) {
            onSelect?.([]);
        }
        else {
            onSelect?.(ids);
        }
    };
    return (_jsxs(_Fragment, { children: [_jsx(BulkActionsToolbar, { children: _jsx(BulkDeleteButton, { mutationMode: "pessimistic" }) }), _jsx(DndContext, { sensors: sensors, collisionDetection: closestCenter, onDragEnd: handleDragEnd, children: _jsxs(Table, { size: "small", children: [_jsx(TableHead, { children: _jsxs(TableRow, { children: [_jsx(TableCell, { padding: "checkbox", children: _jsx(Checkbox, { checked: allSelected, indeterminate: someSelected && !allSelected, onClick: handleSelectAll }) }), _jsx(TableCell, { padding: "checkbox", sx: { width: 40 } }), _jsx(TableCell, { children: "\u540D\u79F0" }), _jsx(TableCell, { children: "\u5206\u7C7B" }), _jsx(TableCell, { children: "\u7C7B\u578B" }), _jsx(TableCell, { children: "\u5DF2\u9009\u62E9\u63D0\u4F9B\u5546\u4E2A\u6570" }), _jsx(TableCell, { children: "\u6392\u5E8F" }), _jsx(TableCell, { children: "\u5BF9\u8BDD\u6D88\u8017\u79EF\u5206" }), _jsx(TableCell, { align: "right", children: "\u64CD\u4F5C" })] }) }), _jsx(TableBody, { children: _jsx(SortableContext, { items: ids, strategy: verticalListSortingStrategy, children: sortedData.map((record) => (_jsxs(SortableRow, { id: record.id, record: record, onRowClick: (id) => navigate(`/ai-models/${id}/show`), selected: selectedSet.has(record.id), onToggleItem: onToggleItem, children: [_jsx(TableCell, { children: record.displayName || record.name }), _jsx(TableCell, { children: record.category }), _jsx(TableCell, { children: record.type }), _jsx(TableCell, { children: record?.providers?.length ?? 0 }), _jsx(TableCell, { children: record?.display?.sortOrder ?? record?.displayConfig?.sortOrder ?? '-' }), _jsx(TableCell, { children: record?.pricing?.creditsPerRequest ?? '-' }), _jsxs(TableCell, { align: "right", padding: "none", onClick: (e) => e.stopPropagation(), children: [_jsx(ShowButton, { record: record }), canWrite && _jsx(EditButton, { record: record }), canWrite && _jsx(DuplicateButton, { record: record })] })] }, record.id))) }) })] }) })] }));
};
export const AIModelList = () => {
    const defaultFilter = { status: 'active' };
    const defaultSort = { field: 'display.sortOrder', order: 'ASC' };
    return (_jsx(List, { filters: _jsx(AIModelFilter, {}), actions: _jsx(CustomActions, {}), filterDefaultValues: defaultFilter, sort: defaultSort, children: _jsx(SortableAIModelDatagrid, {}) }));
};
