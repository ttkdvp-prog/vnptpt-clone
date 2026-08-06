import { useCallback, useState } from 'react';
import { Bell } from 'lucide-react';
import { txt } from '@/lib/text';
import { formatDateTime } from '@/lib/utils';
import GenericTable from '@/components/shared/GenericTable';
import { MobileListCard } from '@/components/shared/MobileListCard';
import { useShallow } from 'zustand/react/shallow';
import type { ThongBao } from '../core/types';
import { useThongBaoStore } from '../store/useThongBaoStore';
import { ThongBaoRowActions } from './thong-bao-row-actions';

interface Props {
  data: ThongBao[];
  isLoading: boolean;
  onEdit: (item: ThongBao) => void;
  onDelete: (id: string) => void;
  onView: (item: ThongBao) => void;
  onDuplicate?: (item: ThongBao) => void;
}

function positionsLabel(item: ThongBao): string {
  if (!item.id_chuc_vu?.length) return txt('announcement.allPositions');
  if (item.ten_chuc_vu?.length) return item.ten_chuc_vu.join(', ');
  return item.id_chuc_vu.join(', ');
}

const ThongBaoList: React.FC<Props> = ({
  data,
  isLoading,
  onEdit,
  onDelete,
  onView,
  onDuplicate,
}) => {
  const [rowMenuOpenId, setRowMenuOpenId] = useState<string | null>(null);

  const {
    columns,
    pagination,
    setPage,
    setPageSize,
    selectedIds,
    toggleSelection,
    toggleAllSelection,
    sort,
    setSort,
    resizeColumn,
    density,
  } = useThongBaoStore(
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

  const renderCell = useCallback(
    (columnId: string, item: ThongBao) => {
      switch (columnId) {
        case 'tg_dang':
          return item.tg_dang ? (
            <span className="text-body-sm text-muted-foreground tabular-nums">
              {formatDateTime(item.tg_dang)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground italic">—</span>
          );
        case 'tieu_de':
          return (
            <span className="text-body-sm font-medium text-foreground truncate">
              {item.tieu_de}
            </span>
          );
        case 'ten_chuc_vu':
          return (
            <span className="text-body-sm text-muted-foreground truncate">
              {positionsLabel(item)}
            </span>
          );
        case 'ten_nguoi_tao':
          return (
            <span className="text-body-sm text-muted-foreground truncate">
              {item.ten_nguoi_tao || item.nguoi_tao || '—'}
            </span>
          );
        case 'tg_cap_nhat':
          return item.tg_cap_nhat ? (
            <span className="text-body-sm text-muted-foreground tabular-nums">
              {formatDateTime(item.tg_cap_nhat)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground italic">—</span>
          );
        case 'actions':
          return (
            <ThongBaoRowActions
              item={item}
              menuOpenId={rowMenuOpenId}
              onMenuOpenChange={setRowMenuOpenId}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
            />
          );
        default:
          return null;
      }
    },
    [onEdit, onDelete, onDuplicate, rowMenuOpenId],
  );

  const renderMobileCard = useCallback(
    (item: ThongBao, isSelected: boolean) => (
      <MobileListCard
        selected={isSelected}
        onBodyClick={() => onView(item)}
        onBodyKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onView(item);
          }
        }}
        leading={
          <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Bell className="text-primary" size={22} />
          </div>
        }
        titleRow={
          <h4 className="truncate text-base font-semibold text-foreground">{item.tieu_de}</h4>
        }
        subheader={
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate text-sm text-muted-foreground tabular-nums">
              {item.tg_dang ? formatDateTime(item.tg_dang) : '—'}
            </span>
          </div>
        }
        footerStart={
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
        }
        footerEnd={
          <ThongBaoRowActions
            compact
            item={item}
            menuOpenId={rowMenuOpenId}
            onMenuOpenChange={setRowMenuOpenId}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
          />
        }
      />
    ),
    [onEdit, onDelete, onDuplicate, onView, rowMenuOpenId, toggleSelection],
  );

  return (
    <GenericTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      loadingText={txt('announcement.loading')}
      emptyTitle={txt('announcement.empty')}
      emptyDescription={txt('announcement.emptyHint')}
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
    />
  );
};

export default ThongBaoList;
