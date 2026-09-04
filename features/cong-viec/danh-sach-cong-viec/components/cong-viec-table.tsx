import React, { memo, useCallback } from 'react';
import { txt } from '@/lib/text';
import { Pencil, Trash2, ListTodo, FileText } from 'lucide-react';
import { CongViec, getCongViecTrangThai } from '../core/types';
import { useCongViecStore } from '../store/useCongViecStore';
import { useShallow } from 'zustand/react/shallow';
import GenericTable from '@/components/shared/GenericTable';
import { MobileListCard } from '@/components/shared/MobileListCard';
import EnumBadge from '@/components/ui/EnumBadge';
import { CAP_BADGE_CONFIG, UU_TIEN_BADGE_CONFIG, TRANG_THAI_BADGE_CONFIG } from '../core/constants';
import { formatDate } from '@/lib/utils';
import { ColumnHeaderSortMenu } from '@/components/shared/column-header/ColumnHeaderSortMenu';

interface Props {
  data: CongViec[];
  isLoading: boolean;
  totalRecordCount?: number;
  serverPaginated?: boolean;
  onEdit: (item: CongViec) => void;
  onDelete: (id: string) => void;
  onView: (item: CongViec) => void;
  /** Map<id, ho_ten> — truyền từ wrapper để không re-render vô hạn. */
  employeeMap: Map<string, string>;
}

const CongViecTable = memo(function CongViecTable({
  data,
  isLoading,
  totalRecordCount,
  serverPaginated = false,
  onEdit,
  onDelete,
  onView,
  employeeMap,
}: Props) {
  const {
    columns, pagination, setPage, setPageSize,
    selectedIds, toggleSelection, toggleAllSelection,
    sort, setSort, resizeColumn, density,
  } = useCongViecStore(
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
    (colId: string, item: CongViec) => {
      switch (colId) {
        case 'tieu_de':
          return (
            <div className="min-w-0">
              <span className="font-semibold text-foreground text-body-sm whitespace-normal break-words block">{item.tieu_de}</span>
              <span className="text-xs text-muted-foreground">#{item.id}</span>
            </div>
          );
        case 'cap':
          return <EnumBadge value={item.cap} config={CAP_BADGE_CONFIG} truncate />;
        case 'to_ar':
          return <span className="text-body-sm text-foreground whitespace-normal break-words">{item.to_ar}</span>;
        case 'mnv_a':
          return <span className="text-body-sm text-foreground truncate">{employeeMap.get(item.mnv_a) ?? item.mnv_a}</span>;
        case 'mnv_r':
          return <span className="text-body-sm text-foreground truncate">{item.mnv_r ? (employeeMap.get(item.mnv_r) ?? item.mnv_r) : '\u2014'}</span>;
        case 'mnv_c':
          return <span className="text-body-sm text-muted-foreground truncate">{item.mnv_c ? (employeeMap.get(item.mnv_c) ?? item.mnv_c) : '\u2014'}</span>;
        case 'mo_ta':
          return (
            <span className="text-body-sm text-muted-foreground whitespace-normal break-words">
              {item.mo_ta || '—'}
            </span>
          );
        case 'ke_hoach':
          return (
            <span className="text-body-sm text-foreground tabular-nums">
              {item.ke_hoach != null ? item.ke_hoach : '—'}
            </span>
          );
        case 'thuc_hien':
          return (
            <span className="text-body-sm text-foreground tabular-nums">
              {item.thuc_hien != null ? item.thuc_hien : '—'}
            </span>
          );
        case 'ty_le': {
          if (item.ke_hoach == null || item.ke_hoach === 0) {
            return <span className="text-body-sm text-muted-foreground">—</span>;
          }
          const pct = Math.round(((item.thuc_hien ?? 0) / item.ke_hoach) * 100);
          const colorClass =
            pct >= 100 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' :
            pct >= 50  ? 'text-amber-600 dark:text-amber-400' :
                         'text-rose-600 dark:text-rose-400';
          return (
            <span className={`text-body-sm tabular-nums ${colorClass}`}>
              {pct}%
            </span>
          );
        }
        case 'uu_tien':
          return <EnumBadge value={item.uu_tien} config={UU_TIEN_BADGE_CONFIG} truncate />;
        case 'ngay_kt':
          return <span className="text-body-sm text-foreground truncate">{formatDate(item.ngay_kt)}</span>;
        case 'trang_thai':
          return <EnumBadge value={getCongViecTrangThai(item)} config={TRANG_THAI_BADGE_CONFIG} wrap />;
        case 'ngay_ht':
          return (
            <span className="text-body-sm text-foreground truncate">
              {item.ngay_ht ? formatDate(item.ngay_ht) : '—'}
            </span>
          );
        case 'ghi_chu':
          return (
            <span className="text-body-sm text-muted-foreground whitespace-pre-wrap break-words">
              {item.ghi_chu || '—'}
            </span>
          );
        case 'tep_dinh_kem':
          return item.tep_dinh_kem ? (
            <a
              href={item.tep_dinh_kem}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-body-sm text-primary hover:underline shrink-0"
            >
              <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden />
              {txt('congViec.store.tepDinhKemCol')}
            </a>
          ) : (
            <span className="text-body-sm text-muted-foreground">—</span>
          );
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
    [onEdit, onDelete, employeeMap],
  );

  const renderMobileCard = useCallback(
    (item: CongViec, isSelected: boolean) => (
      <MobileListCard
        selected={isSelected}
        leading={(
          <div className="h-11 w-11 rounded-xl border border-border bg-muted/40 flex items-center justify-center shrink-0 text-muted-foreground">
            <ListTodo size={18} />
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
            <h4 className="truncate text-base font-semibold text-foreground">{item.tieu_de}</h4>
            <div className="shrink-0">
              <EnumBadge value={item.uu_tien} config={UU_TIEN_BADGE_CONFIG} className="text-sm px-2.5 py-1" />
            </div>
          </div>
        )}
        metaLine={(
          <div className="space-y-1">
            <EnumBadge value={getCongViecTrangThai(item)} config={TRANG_THAI_BADGE_CONFIG} wrap />
            {item.mo_ta && (
              <p className="text-xs text-muted-foreground line-clamp-2">{item.mo_ta}</p>
            )}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
              <span>
                <span className="font-medium text-foreground">AR:</span>{' '}
                {employeeMap.get(item.mnv_a) ?? item.mnv_a}
              </span>
              {item.mnv_r && (
                <span>
                  <span className="font-medium text-foreground">R:</span>{' '}
                  {employeeMap.get(item.mnv_r) ?? item.mnv_r}
                </span>
              )}
              <span>
                <span className="font-medium text-foreground">Hạn:</span> {formatDate(item.ngay_kt)}
              </span>
            </div>
            {item.tep_dinh_kem && (
              <a
                href={item.tep_dinh_kem}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <FileText className="w-3.5 h-3.5 shrink-0" aria-hidden />
                {txt('congViec.store.tepDinhKemCol')}
              </a>
            )}
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
    [onEdit, onDelete, onView, toggleSelection, employeeMap],
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

export default CongViecTable;
