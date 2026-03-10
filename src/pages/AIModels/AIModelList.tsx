import {
  List,
  EditButton,
  ShowButton,
  CreateButton,
  Filter,
  TextInput,
  SelectInput,
  TopToolbar,
  Button,
  usePermissions,
  useListContext,
  BulkDeleteButton,
  BulkActionsToolbar,
} from 'react-admin';
import { Table, TableHead, TableRow, TableCell, TableBody, Checkbox } from '@mui/material';
import { useNotify, useRedirect } from 'react-admin';
import { hasPermission } from '../../utils/permissions';
import { authUtils } from '../../utils/auth';
import apiClient from '../../services/api';
import { ContentCopy as CopyIcon, ImportExport as ImportExportIcon, DragIndicator as DragIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useRef } from 'react';

const AIModelFilter = (props: any) => (
  <Filter {...props}>
    <TextInput source="search" label="搜索模型ID或名称" />
    <SelectInput
      source="status"
      label="状态"
      choices={[
        { id: 'active', name: '活跃' },
        { id: 'inactive', name: '未激活' },
      ]}
    />
    <SelectInput
      source="accessCategory"
      label="访问类别"
      choices={[
        { id: 'common', name: '通用' },
        { id: 'exclusive', name: '专属' },
        { id: 'embedding', name: '嵌入' },
      ]}
      alwaysOn
    />
  </Filter>
);

const DuplicateButton = ({ record }: any) => {
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
    } catch (error: any) {
      const errorMessage = error.response?.data?.error?.message || error.message || '复制失败';
      notify(errorMessage, { type: 'error' });
    }
  };

  return (
    <Button
      label="复制"
      onClick={handleDuplicate}
      startIcon={<CopyIcon />}
    />
  );
};

const CustomActions = () => {
  const navigate = useNavigate();
  const { permissions } = usePermissions();
  const adminInfo = authUtils.getAdminInfo();
  const canWrite = hasPermission(permissions, 'ai_models:write', adminInfo?.role);
  const canImportExport = hasPermission(permissions, 'ai_models:import_export', adminInfo?.role);

  return (
    <TopToolbar>
      {canWrite && <CreateButton />}
      {canImportExport && (
        <Button
          label="导入/导出"
          onClick={() => navigate('/ai-models-import-export')}
          startIcon={<ImportExportIcon />}
        />
      )}
    </TopToolbar>
  );
};

// 可拖拽行组件
const SortableRow = ({
  record,
  children,
  id,
  onRowClick,
  selected,
  onToggleItem,
}: {
  record: any;
  children: React.ReactNode;
  id: string;
  onRowClick?: (id: string) => void;
  selected?: boolean;
  onToggleItem?: (id: string, event: React.MouseEvent) => void;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow
      ref={setNodeRef}
      style={style}
      {...attributes}
      onClick={onRowClick ? () => onRowClick(record.id) : undefined}
      sx={onRowClick ? { cursor: 'pointer' } : undefined}
    >
      <TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={selected}
          onClick={(e) => {
            e.stopPropagation();
            onToggleItem?.(id, e);
          }}
        />
      </TableCell>
      <TableCell padding="checkbox" sx={{ cursor: 'grab', width: 40 }} onClick={(e) => e.stopPropagation()} {...listeners}>
        <DragIcon color="action" fontSize="small" />
      </TableCell>
      {children}
    </TableRow>
  );
};

// 可拖拽排序的 AI 模型列表表格
const SortableAIModelDatagrid = () => {
  const { data, isLoading, refetch, selectedIds, onSelect, onToggleItem } = useListContext();
  const notify = useNotify();
  const navigate = useNavigate();
  const { permissions } = usePermissions();
  const canWrite = hasPermission(permissions, 'ai_models:write', authUtils.getAdminInfo()?.role);
  const dataRef = useRef<any[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const items = [...dataRef.current];
    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    const models = reordered.map((item, index) => ({
      modelId: item.id,
      sortOrder: index,
    }));

    try {
      await apiClient.put('/admin/ai/models/sort-order', { models });
      notify('排序已更新', { type: 'success' });
      refetch();
    } catch (error: any) {
      const msg = error.response?.data?.error?.message || error.message || '排序更新失败';
      notify(msg, { type: 'error' });
    }
  };

  if (isLoading || !data) {
    return null;
  }

  // 按 sortOrder 正序显示
  const sortedData = [...(data || [])].sort((a: any, b: any) => {
    const orderA = a?.display?.sortOrder ?? a?.displayConfig?.sortOrder ?? 0;
    const orderB = b?.display?.sortOrder ?? b?.displayConfig?.sortOrder ?? 0;
    return Number(orderA) - Number(orderB);
  });
  dataRef.current = sortedData;
  const ids = sortedData.map((item: any) => item.id);
  const selectedSet = new Set(selectedIds || []);
  const allSelected = sortedData.length > 0 && sortedData.every((r: any) => selectedSet.has(r.id));
  const someSelected = sortedData.some((r: any) => selectedSet.has(r.id));

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (allSelected) {
      onSelect?.([]);
    } else {
      onSelect?.(ids);
    }
  };

  return (
    <>
      <BulkActionsToolbar>
        <BulkDeleteButton mutationMode="pessimistic" />
      </BulkActionsToolbar>
      <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Checkbox
                checked={allSelected}
                indeterminate={someSelected && !allSelected}
                onClick={handleSelectAll}
              />
            </TableCell>
            <TableCell padding="checkbox" sx={{ width: 40 }} />
            <TableCell>名称</TableCell>
            <TableCell>分类</TableCell>
            <TableCell>类型</TableCell>
            <TableCell>已选择提供商个数</TableCell>
            <TableCell>排序</TableCell>
            <TableCell>对话消耗积分</TableCell>
            <TableCell align="right">操作</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {sortedData.map((record: any) => (
              <SortableRow
                key={record.id}
                id={record.id}
                record={record}
                onRowClick={(id) => navigate(`/ai-models/${id}/show`)}
                selected={selectedSet.has(record.id)}
                onToggleItem={onToggleItem}
              >
                <TableCell>
                  {record.displayName || record.name}
                </TableCell>
                <TableCell>{record.category}</TableCell>
                <TableCell>{record.type}</TableCell>
                <TableCell>{record?.providers?.length ?? 0}</TableCell>
                <TableCell>{record?.display?.sortOrder ?? record?.displayConfig?.sortOrder ?? '-'}</TableCell>
                <TableCell>{record?.pricing?.creditsPerRequest ?? '-'}</TableCell>
                <TableCell align="right" padding="none" onClick={(e) => e.stopPropagation()}>
                  <ShowButton record={record} />
                  {canWrite && <EditButton record={record} />}
                  {canWrite && <DuplicateButton record={record} />}
                </TableCell>
              </SortableRow>
            ))}
          </SortableContext>
        </TableBody>
      </Table>
    </DndContext>
    </>
  );
};

export const AIModelList = () => {
  const defaultFilter = { status: 'active' };
  const defaultSort = { field: 'display.sortOrder', order: 'ASC' as const };

  return (
    <List
      filters={<AIModelFilter />}
      actions={<CustomActions />}
      filterDefaultValues={defaultFilter}
      sort={defaultSort}
    >
      <SortableAIModelDatagrid />
    </List>
  );
};
