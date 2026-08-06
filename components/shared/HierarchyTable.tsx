import React, { memo, useCallback, useMemo, useRef, useState } from 'react';
import { txt } from '@/lib/text';
import { Edit, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Checkbox from '@/components/ui/Checkbox';
import type { ColumnConfig } from '@/store/createGenericStore';
import { getColumnCellStyle, resolveColumnWidth } from '@/store/createGenericStore';
import { getTableDensity, type TableDensity } from '@/lib/table-density';
import { TableLoadingRow, TableEmptyRow } from '@/components/shared/TableStateRows';
import { useIsTablet } from '@/hooks/use-is-tablet';

const CHECKBOX_COL_WIDTH = 44;

export interface HierarchyTableProps<T> {
  /** Dữ liệu đã flatten + đã paginate (một trang) */
  data: T[];
  /** Cột hiển thị (đã filter visible, sort order) */
  columns: ColumnConfig[];
  selectedIds: Set<string>;
  getId: (item: T) => string;
  /** Level/cấp (1 = root) để style hàng */
  getLevel: (item: T) => number;
  /** Render ô theo cột */
  renderCell: (item: T, col: ColumnConfig) => React.ReactNode;
  onToggleSelection: (id: string) => void;
  onToggleAllSelection: (ids: string[]) => void;
  /** Không truyền = ẩn nút tương ứng (phân quyền). Bỏ qua khi dùng `renderActions`. */
  onEdit?: (item: T) => void;
  onDelete?: (id: string) => void;
  onView?: (item: T) => void;
  /**
   * Cột thao tác tùy chỉnh (vd. Sửa + RowActionsOverflowMenu).
   * Khi có, không dùng nút Sửa/Xóa mặc định.
   */
  renderActions?: (item: T) => React.ReactNode;
  /** Label cột "Thao tác" */
  actionsColumnLabel?: string;
  /** Class cho container scroll */
  className?: string;
  /** Phụ kiện header cột (lọc/tìm/sắp xếp) — giống GenericTable */
  renderColumnHeaderAccessory?: (col: ColumnConfig) => React.ReactNode;
  /** Mặc định true — hàng không selectable sẽ ẩn checkbox và không click onView */
  isRowSelectable?: (item: T) => boolean;
  /** Trả về true để dòng này render full-width (colspan toàn bảng) như section header */
  isFullSpanRow?: (item: T) => boolean;
  /** Nội dung tuỳ biến cho full-span row (chỉ áp dụng khi `isFullSpanRow` trả về true) */
  renderFullSpanRow?: (item: T) => React.ReactNode;
  density?: TableDensity;
  isLoading?: boolean;
  loadingText?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  /** Cho phép kéo resize cột (giống GenericTable) — cần `<colgroup>`+table-layout:fixed. */
  onResizeColumn?: (id: string, width: number) => void;
}

/**
 * Bảng desktop hiển thị danh sách dạng cây: cột checkbox, các cột data (renderCell),
 * cột thao tác. Hàng root (level 1) có nền khác, click hàng = onView.
 */
export function HierarchyTable<T>({
  data,
  columns: columnsProp,
  selectedIds,
  getId,
  getLevel,
  renderCell,
  onToggleSelection,
  onToggleAllSelection,
  onEdit,
  onDelete,
  onView,
  renderActions,
  actionsColumnLabel,
  className,
  renderColumnHeaderAccessory,
  isRowSelectable,
  isFullSpanRow,
  renderFullSpanRow,
  density = 'default',
  isLoading = false,
  loadingText,
  emptyTitle,
  emptyDescription,
  onResizeColumn,
}: HierarchyTableProps<T>) {
  const isTablet = useIsTablet();
  /** Ẩn bớt cột priority 3 ở tablet (768–1024px), giữ nguyên priority 1-2. */
  const columns = useMemo(
    () => (isTablet ? columnsProp.filter((c) => (c.priority ?? 1) <= 2) : columnsProp),
    [columnsProp, isTablet]
  );
  const selectableOnPage = data.filter((item) => !isRowSelectable || isRowSelectable(item));
  const selectablePageIds = selectableOnPage.map(getId);
  const isAllSelected =
    selectablePageIds.length > 0 && selectablePageIds.every((id) => selectedIds.has(id));
  const isIndeterminate =
    selectablePageIds.some((id) => selectedIds.has(id)) && !isAllSelected;
  const actionsLabel = actionsColumnLabel ?? txt('common.actions');
  const showActionsCol = Boolean(renderActions || onEdit || onDelete);
  const actionsColWidthClass = renderActions ? 'w-[92px] min-w-[92px]' : 'w-20 min-w-[80px]';
  const densityTokens = getTableDensity(density);
  const colSpanAll = columns.length + 1 + (showActionsCol ? 1 : 0);

  const columnWidths = useMemo(
    () => columns.map((c) => resolveColumnWidth(c)),
    [columns]
  );

  // Column resize — cùng cơ chế RAF-throttle + visual feedback như GenericTable.
  const resizingRef = useRef<{ colId: string; startX: number; startW: number } | null>(null);
  const resizeRafRef = useRef<number | null>(null);
  const [resizingState, setResizingState] = useState<{ colId: string; width: number } | null>(null);

  const handleResizeStart = useCallback((e: React.MouseEvent, colId: string, currentWidth: number) => {
    e.preventDefault();
    e.stopPropagation();
    resizingRef.current = { colId, startX: e.clientX, startW: currentWidth };
    setResizingState({ colId, width: currentWidth });

    const flush = (width: number) => {
      resizeRafRef.current = null;
      if (!resizingRef.current) return;
      onResizeColumn?.(resizingRef.current.colId, width);
      setResizingState({ colId: resizingRef.current.colId, width });
    };
    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const delta = ev.clientX - resizingRef.current.startX;
      const newW = resizingRef.current.startW + delta;
      if (resizeRafRef.current != null) cancelAnimationFrame(resizeRafRef.current);
      resizeRafRef.current = requestAnimationFrame(() => flush(newW));
    };
    const onUp = () => {
      if (resizeRafRef.current != null) {
        cancelAnimationFrame(resizeRafRef.current);
        resizeRafRef.current = null;
      }
      resizingRef.current = null;
      setResizingState(null);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [onResizeColumn]);

  return (
    <div
      className={cn(
        'flex-1 min-h-0 overflow-auto custom-scrollbar',
        className
      )}
      style={{ overscrollBehavior: 'contain' }}
    >
      <table
        className="w-full text-body-sm text-left border-separate border-spacing-0"
        style={onResizeColumn ? { tableLayout: 'fixed' } : undefined}
      >
        {onResizeColumn && (
          <colgroup>
            <col style={{ width: CHECKBOX_COL_WIDTH }} />
            {columns.map((col, index) => (
              <col key={col.id} style={{ width: columnWidths[index] }} />
            ))}
          </colgroup>
        )}
        <thead className="sticky top-0 z-[2]">
          <tr className="bg-muted border-b border-border align-middle">
            <th
              className={cn('sticky left-0 z-[3] w-11 px-3 bg-muted border-b border-r border-border text-center', densityTokens.headerPy)}
              style={{ minWidth: 44, maxWidth: 44 }}
            >
              <Checkbox
                checked={isAllSelected}
                indeterminate={isIndeterminate}
                onChange={() => onToggleAllSelection(selectablePageIds)}
                onClick={(e) => e.stopPropagation()}
                aria-label={txt('common.selectAll')}
              />
            </th>
            {columns.map((col) => {
              const accessory = renderColumnHeaderAccessory?.(col);
              return (
                <th
                  key={col.id}
                  className={cn('px-4 text-left text-xs font-semibold text-muted-foreground border-b border-border whitespace-nowrap min-w-0 relative', densityTokens.headerPy)}
                  style={getColumnCellStyle(col)}
                  onMouseDown={(e) => {
                    if ((e.target as HTMLElement).closest('[data-column-header-accessory]')) {
                      e.stopPropagation();
                    }
                  }}
                >
                  <div className="flex min-w-0 items-center justify-between gap-1">
                    <div className="flex min-w-0 flex-1 items-center gap-1">
                      <span className="truncate">{col.label}</span>
                    </div>
                    {accessory ? (
                      <div className="shrink-0" data-column-header-accessory>
                        {accessory}
                      </div>
                    ) : null}
                  </div>
                  {onResizeColumn && (
                    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- column resize drag handle
                    <div
                      role="separator"
                      aria-orientation="vertical"
                      onMouseDown={(e) => {
                        const th = e.currentTarget.parentElement;
                        handleResizeStart(e, col.id, th?.offsetWidth ?? resolveColumnWidth(col));
                      }}
                      className={cn(
                        "absolute right-0 top-0 bottom-0 w-[5px] cursor-col-resize z-10 group/handle hover:bg-primary/30 active:bg-primary/50 transition-colors",
                        resizingState?.colId === col.id && "bg-primary/50"
                      )}
                    >
                      <div className={cn(
                        "absolute right-[2px] top-1/2 -translate-y-1/2 w-[1px] h-3.5 bg-border group-hover/handle:bg-primary/60 transition-colors",
                        resizingState?.colId === col.id && "bg-primary/60"
                      )} />
                      {resizingState?.colId === col.id && (
                        <div className="absolute -top-6 right-0 px-1.5 py-0.5 rounded bg-foreground text-background text-[10px] font-medium tabular-nums whitespace-nowrap shadow-sm pointer-events-none">
                          {Math.round(resizingState.width)}px
                        </div>
                      )}
                    </div>
                  )}
                </th>
              );
            })}
            {showActionsCol && (
            <th
              className={cn(
                'sticky right-0 z-[3] px-3 py-1.5 bg-muted border-b border-l border-border text-center text-xs font-semibold text-muted-foreground',
                actionsColWidthClass,
              )}
            >
              {actionsLabel}
            </th>
            )}
          </tr>
        </thead>
        <tbody className="[&>tr>td]:border-b [&>tr>td]:border-border">
          {isLoading ? (
            <TableLoadingRow colSpan={colSpanAll} text={loadingText} />
          ) : data.length === 0 ? (
            <TableEmptyRow colSpan={colSpanAll} title={emptyTitle} description={emptyDescription} />
          ) : data.map((item) => {
            const id = getId(item);
            const level = getLevel(item);
            const isRoot = level === 1;
            const isSelected = selectedIds.has(id);
            const selectable = !isRowSelectable || isRowSelectable(item);
            const fullSpan = isFullSpanRow?.(item) ?? false;
            if (fullSpan && renderFullSpanRow) {
              const fullSpanActions = showActionsCol ? renderActions?.(item) : null;
              return (
                <tr key={id} className="bg-muted/60">
                  <td
                    className="sticky left-0 z-[1] w-11 px-3 py-1.5 text-center border-r border-b border-border bg-muted/60"
                    style={{ minWidth: 44, maxWidth: 44 }}
                  />
                  <td
                    colSpan={columns.length}
                    className="p-0 border-b border-border bg-muted/60"
                  >
                    <div className="sticky left-0 z-[1] w-fit max-w-full">
                      {renderFullSpanRow(item)}
                    </div>
                  </td>
                  {showActionsCol && (
                    <td
                      className={cn(
                        'sticky right-0 z-[1] px-2 py-1.5 border-l border-b border-border text-center bg-muted/60',
                        actionsColWidthClass,
                      )}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {fullSpanActions}
                    </td>
                  )}
                </tr>
              );
            }
            return (
              <tr
                key={id}
                role={selectable ? 'button' : undefined}
                tabIndex={selectable ? 0 : undefined}
                onClick={() => selectable && onView?.(item)}
                onKeyDown={(e) => selectable && e.key === 'Enter' && onView?.(item)}
                className={cn(
                  'group align-middle transition-colors',
                  selectable ? 'hover:bg-muted/80 cursor-pointer' : 'cursor-default',
                  isRoot ? 'bg-muted/40' : 'bg-card',
                  isSelected && 'bg-primary/5'
                )}
              >
                <td
                  className={cn(
                    'sticky left-0 z-[1] w-11 px-3 py-3 text-center border-r border-border transition-colors',
                    isRoot ? 'bg-muted/40' : 'bg-card',
                    isSelected && 'bg-primary/5',
                    selectable && 'group-hover:bg-muted/80'
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  {selectable ? (
                    <Checkbox
                      checked={isSelected}
                      onChange={() => onToggleSelection(id)}
                      aria-label={txt('common.select')}
                    />
                  ) : null}
                </td>
                {columns.map((col) => renderCell(item, col))}
                {showActionsCol && (
                <td
                  className={cn(
                    'sticky right-0 z-[1] px-2 py-1.5 border-l border-border text-center transition-colors',
                    actionsColWidthClass,
                    isRoot ? 'bg-muted/40' : 'bg-card',
                    isSelected && 'bg-primary/5',
                    'group-hover:bg-muted/80'
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  {renderActions ? (
                    renderActions(item)
                  ) : (
                    <div className="flex items-center justify-center gap-0.5">
                      {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(item)}
                        className="p-2 text-primary hover:bg-primary/10 rounded-md transition-colors active:scale-95"
                        title={txt('common.edit')}
                      >
                        <Edit size={15} />
                      </button>
                      )}
                      {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors active:scale-95"
                        title={txt('common.delete')}
                      >
                        <Trash2 size={15} />
                      </button>
                      )}
                    </div>
                  )}
                </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default memo(HierarchyTable) as typeof HierarchyTable;
