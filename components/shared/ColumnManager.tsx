import React from 'react';
import { txt } from '@/lib/text';
import { Check, RotateCcw, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ColumnConfig } from '@/store/createGenericStore';
import { TABLE_DENSITY_LEVELS, type TableDensity } from '@/lib/table-density';
import Tooltip from '@/components/ui/Tooltip';
import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const DENSITY_LABELS: Record<TableDensity, string> = {
  compact: txt('common.densityCompact'),
  default: txt('common.densityDefault'),
  comfortable: txt('common.densityComfortable'),
};

interface ColumnManagerProps {
  columns: ColumnConfig[];
  onToggleColumn: (id: string) => void;
  onReorderColumns: (fromIndex: number, toIndex: number) => void;
  onResetColumns: () => void;
  density?: TableDensity;
  onSetDensity?: (density: TableDensity) => void;
}

interface SortableColumnRowProps {
  col: ColumnConfig;
  onToggleColumn: (id: string) => void;
}

const SortableColumnRow: React.FC<SortableColumnRowProps> = ({ col, onToggleColumn }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: col.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center gap-2 px-2 py-1.5 rounded-lg select-none transition-colors group",
        isDragging ? "opacity-50 bg-primary/10 z-10 relative" : "hover:bg-muted/50"
      )}
    >
      {/* Drag handle */}
      <button
        type="button"
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab active:cursor-grabbing touch-none"
        aria-label={txt('common.dragToReorderColumn')}
      >
        <GripVertical size={12} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
      </button>

      {/* Visibility checkbox */}
      <button
        type="button"
        aria-pressed={col.visible}
        onClick={(e) => {
          e.stopPropagation();
          onToggleColumn(col.id);
        }}
        className={cn(
          "w-4 h-4 rounded border-2 flex items-center justify-center transition-all shrink-0 cursor-pointer",
          col.visible ? 'bg-primary border-primary text-primary-foreground' : 'border-border bg-background group-hover:border-primary/50'
        )}
      >
        {col.visible && <Check size={10} className="stroke-[3px]" />}
      </button>

      {/* Label */}
      <span className={cn(
        "text-xs flex-1 truncate",
        col.visible ? 'text-foreground font-medium' : 'text-muted-foreground'
      )}>
        {col.label}
      </span>
    </div>
  );
};

const ColumnManager: React.FC<ColumnManagerProps> = ({
  columns, onToggleColumn, onReorderColumns, onResetColumns, density, onSetDensity
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const sorted = [...columns].sort((a, b) => a.order - b.order);
  const visibleCount = sorted.filter(c => c.visible).length;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = sorted.findIndex(c => c.id === active.id);
    const toIndex = sorted.findIndex(c => c.id === over.id);
    if (fromIndex === -1 || toIndex === -1) return;
    onReorderColumns(fromIndex, toIndex);
  };

  return (
    <div className="w-64 overflow-hidden">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border bg-muted/30 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="text-xs font-medium text-muted-foreground">{txt('common.columnDisplay')}</h4>
          <span className="text-xs tabular-nums text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded-full font-medium">
            {visibleCount}/{sorted.length}
          </span>
        </div>
        <Tooltip content={txt('common.reset')} placement="bottom">
          <button
            onClick={onResetColumns}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
          >
            <RotateCcw size={12} />
          </button>
        </Tooltip>
      </div>

      {/* Density */}
      {onSetDensity && (
        <div className="px-3 py-2 border-b border-border flex items-center gap-1 bg-muted/10">
          {TABLE_DENSITY_LEVELS.map(level => (
            <button
              key={level}
              type="button"
              onClick={() => onSetDensity(level)}
              className={cn(
                "flex-1 text-xs py-1 rounded-md transition-all font-medium",
                density === level
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {DENSITY_LABELS[level]}
            </button>
          ))}
        </div>
      )}

      {/* Column List */}
      <div className="p-1.5 max-h-[320px] overflow-y-auto custom-scrollbar">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sorted.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {sorted.map((col) => (
              <SortableColumnRow key={col.id} col={col} onToggleColumn={onToggleColumn} />
            ))}
          </SortableContext>
        </DndContext>
      </div>
    </div>
  );
};

export default ColumnManager;
