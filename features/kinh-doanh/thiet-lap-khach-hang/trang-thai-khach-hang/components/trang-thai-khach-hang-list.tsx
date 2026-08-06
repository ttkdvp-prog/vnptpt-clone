import { useCallback, useState } from 'react';
import { Tag } from 'lucide-react';
import { txt } from '@/lib/text';
import { formatDate } from '@/lib/utils';
import GenericTable from '@/components/shared/GenericTable';
import { MobileListCard } from '@/components/shared/MobileListCard';
import { useShallow } from 'zustand/react/shallow';
import type { TrangThaiKhachHang } from '../core/types';
import { useTrangThaiKhachHangStore } from '../store/useTrangThaiKhachHangStore';
import { TrangThaiKhachHangRowActions } from './trang-thai-khach-hang-row-actions';

interface Props {
  data: TrangThaiKhachHang[];
  isLoading: boolean;
  onEdit: (item: TrangThaiKhachHang) => void;
  onDelete: (id: string) => void;
  onView: (item: TrangThaiKhachHang) => void;
  onDuplicate?: (item: TrangThaiKhachHang) => void;
}

const TrangThaiKhachHangList: React.FC<Props> = ({
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
  } = useTrangThaiKhachHangStore(
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
    (columnId: string, item: TrangThaiKhachHang) => {
      switch (columnId) {
        case 'ten_trang_thai':
          return (
            <span className="text-body-sm font-medium text-foreground truncate">
              {item.ten_trang_thai}
            </span>
          );
        case 'mo_ta':
          return (
            <span className="text-body-sm text-muted-foreground truncate">
              {item.mo_ta || '—'}
            </span>
          );
        case 'ten_nguoi_tao':
          return (
            <span className="text-body-sm text-muted-foreground truncate">
              {item.ten_nguoi_tao || item.nguoi_tao || '—'}
            </span>
          );
        case 'tg_tao':
          return item.tg_tao ? (
            <span className="text-body-sm text-muted-foreground tabular-nums">
              {formatDate(item.tg_tao)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground italic">—</span>
          );
        case 'tg_cap_nhat':
          return item.tg_cap_nhat ? (
            <span className="text-body-sm text-muted-foreground tabular-nums">
              {formatDate(item.tg_cap_nhat)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground italic">—</span>
          );
        case 'actions':
          return (
            <TrangThaiKhachHangRowActions
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
    (item: TrangThaiKhachHang, isSelected: boolean) => (
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
            <Tag className="text-primary" size={22} />
          </div>
        }
        titleRow={
          <h4 className="truncate text-base font-semibold text-foreground">{item.ten_trang_thai}</h4>
        }
        subheader={
          item.mo_ta ? (
            <p className="truncate text-sm text-muted-foreground">{item.mo_ta}</p>
          ) : null
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
          <TrangThaiKhachHangRowActions
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
      loadingText={txt('customerSettings.trangThai.loading')}
      emptyTitle={txt('customerSettings.trangThai.empty')}
      emptyDescription={txt('customerSettings.trangThai.emptyHint')}
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

export default TrangThaiKhachHangList;
