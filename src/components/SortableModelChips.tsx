import { Chip, Box } from '@mui/material';
import { DragIndicator as DragIcon } from '@mui/icons-material';
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

interface SortableModelChipsProps {
  selectedModels: string[];
  models: Array<{ id: string; displayName?: string; name?: string }>;
  onReorder: (newOrder: string[]) => void;
  onDelete: (modelId: string) => void;
  sortable?: boolean;
}

const SortableChip = ({
  modelId,
  label,
  onDelete,
  sortable,
}: {
  modelId: string;
  label: string;
  onDelete: () => void;
  sortable: boolean;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: modelId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const chip = (
    <Chip
      label={label}
      size="small"
      onDelete={onDelete}
      sx={{ cursor: sortable ? 'grab' : 'default' }}
      icon={sortable ? <DragIcon sx={{ fontSize: 16, cursor: 'grab' }} /> : undefined}
    />
  );

  if (sortable) {
    return (
      <Box ref={setNodeRef} style={style} {...attributes} {...listeners} sx={{ display: 'inline-flex' }}>
        {chip}
      </Box>
    );
  }
  return chip;
};

export const SortableModelChips = ({
  selectedModels,
  models,
  onReorder,
  onDelete,
  sortable = false,
}: SortableModelChipsProps) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const items = [...selectedModels];
    const oldIndex = items.indexOf(active.id as string);
    const newIndex = items.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    onReorder(reordered);
  };

  const content = (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, alignItems: 'center' }}>
      {selectedModels.map((modelId: string) => {
        const model = models.find((m: any) => m.id === modelId);
        const label = model ? (model.displayName || model.name) : modelId;
        return (
          <SortableChip
            key={modelId}
            modelId={modelId}
            label={label}
            onDelete={() => onDelete(modelId)}
            sortable={sortable && selectedModels.length > 1}
          />
        );
      })}
    </Box>
  );

  if (sortable && selectedModels.length > 1) {
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={selectedModels} strategy={verticalListSortingStrategy}>
          {content}
        </SortableContext>
      </DndContext>
    );
  }

  return content;
};
