import React, { memo, useCallback } from 'react';
import { txt } from '@/lib/text';
import { Pencil, Trash2, FileText } from 'lucide-react';
import { TaiLieu } from '../core/types';
import { useTaiLieuStore } from '../store/useTaiLieuStore';
import { useShallow } from 'zustand/react/shallow';
import GenericTable from '@/components/shared/GenericTable';
import { MobileListCard } from '@/components/shared/MobileListCard';
import EnumBadge from '@/components/ui/EnumBadge';
import { TINH_TRANG_BADGE_CONFIG } from '../core/constants';
import { ColumnHeaderSortMenu } from '@/components/shared/column-header/ColumnHeaderSortMenu';

interface Props {
  data: TaiLieu[];
  isLoading: boolean;
  totalRecordCount?: number;
  serverPaginated?: boolean;
  onEdit: (item: TaiLieu) => void;
  onDelete: (id: string) => void;
  onView: (item: TaiLieu) => void;
}

const TaiLieuTable = memo(function TaiLieuTable({
  data,
  isLoading,
  totalRecordCount,
  serverPaginated = false,
  onEdit,
  onDelete,
  onView,
}: Props) {
  const {
    columns, pagination, setPage, setPageSize,
    selectedIds, toggleSelection, toggleAllSelection,
    sort, setSort, resizeColumn, density,
  } = useTaiLieuStore(
    useShallow((s) => ({
      columns: s.columns,
      pagination: s.pagination,
      setPage: s.setPage,
      setPageSize: s.setPageSize,
      selectedIds: s.selectedIds,
      toggleSelection: s.toggleSelection,
      toggleAllSelection: s.toggleAllSelection,
      sort: s.sort,
      setSort: s.setSort,
      resizeColumn: s.resizeColumn,
      density: s.density,
    })),
  );

  const renderColumnHeaderAccessory = useCallback(
    (col: { id: string; label: string }) => (
      <ColumnHeaderSortMenu ariaLabel={col.label} sortColumnId={col.id} sort={sort} setSort={setSort} />
    ),
    [sort, setSort],
  );

  const renderCell = useCallback(
    (colId: string, item: TaiLieu) => {
      switch (colId) {
        case 'ten_ho_so':
          return (
            <div className="min-w-0">
              <span className="font-semibold text-foreground text-body-sm truncate block">{item.ten_ho_so}</span>
              <span className="text-xs text-muted-foreground">#{item.so_ho_so}</span>
            </div>
          );
        case 'danh_muc':
          return <span className="text-body-sm text-foreground truncate">{item.danh_muc}</span>;
        case 'to':
          return <span className="text-body-sm text-foreground truncate">{item.to}</span>;
        case 'tinh_trang':
          return <EnumBadge value={item.tinh_trang} config={TINH_TRANG_BADGE_CONFIG} truncate />;
        case 'actions':
          return (
            <div className="flex items-center gap-1 justify-end">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                aria-label={txt('common.edit')}
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                className="h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                aria-label={txt('common.delete')}
              >
                <Trash2 size={14} />
              </button>
            </div>
          );
        default:
          return null;
      }
    },
    [onEdit, onDelete],
  );

  const renderMobileCard = useCallback(
    (item: TaiLieu, isSelected: boolean) => (
      <MobileListCard
        selected={isSelected}
        leading={(
          <div className="h-11 w-11 rounded-xl border border-border bg-muted/40 flex items-center justify-center shrink-0 text-muted-foreground">
            <FileText size={18} />
          </div>
        )}
        onBodyClick={() => onView(item)}
        onBodyKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onView(item);
          }
        }}
        titleRow={(
          <div className="flex min-w-0 items-center justify-between gap-2">
            <h4 className="truncate text-base font-semibold text-foreground">{item.ten_ho_so}</h4>
            <div className="shrink-0">
              <EnumBadge value={item.tinh_trang} config={TINH_TRANG_BADGE_CONFIG} className="text-sm px-2.5 py-1" />
            </div>
          </div>
        )}
        footerStart={(
          <label className="inline-flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-lg">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelection(item.id)}
              onClick={(e) => e.stopPropagation()}
              aria-label={txt('common.select')}
              className="h-4 w-4 cursor-pointer rounded border-border text-primary accent-primary"
            />
          </label>
        )}
        footerEnd={(
          <div className="flex items-center gap-1">
            <button type="button" onClick={(e) => { e.stopPropagation(); onEdit(item); }} className="h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
              <Pencil size={16} />
            </button>
            <button type="button" onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10">
              <Trash2 size={16} />
            </button>
          </div>
        )}
      />
    ),
    [onEdit, onDelete, onView, toggleSelection],
  );

  return (
    <GenericTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      loadingText={txt('common.loadingData')}
      selectedIds={selectedIds}
      onToggleSelection={toggleSelection}
      onToggleAll={toggleAllSelection}
      page={pagination.page}
      pageSize={pagination.pageSize}
      onPageChange={setPage}
      onPageSizeChange={setPageSize}
      sort={sort}
      onSort={setSort}
      renderCell={renderCell}
      renderMobileCard={renderMobileCard}
      onRowClick={onView}
      keyExtractor={(item) => item.id}
      onResizeColumn={resizeColumn}
      density={density}
      stickyLeftCount={1}
      renderColumnHeaderAccessory={renderColumnHeaderAccessory}
      hideSortOnColumnLabel
      totalRecordCount={totalRecordCount}
      serverPaginated={serverPaginated}
    />
  );
});

export default TaiLieuTable;
