import { useCallback, useState } from 'react';
import { ContactRound, Users, Phone, MapPin } from 'lucide-react';
import { txt } from '@/lib/text';
import { formatDate } from '@/lib/utils';
import GenericTable from '@/components/shared/GenericTable';
import { MobileListCard } from '@/components/shared/MobileListCard';
import { useShallow } from 'zustand/react/shallow';
import type { KhachHang } from '../core/types';
import { useKhachHangStore } from '../store/useKhachHangStore';
import { KhachHangGroupBadge, KhachHangStatusBadge } from './khach-hang-badges';
import { KhachHangRowActions } from './khach-hang-row-actions';

interface Props {
  data: KhachHang[];
  isLoading: boolean;
  onEdit: (item: KhachHang) => void;
  onDelete: (id: string) => void;
  onView: (item: KhachHang) => void;
  onDuplicate?: (item: KhachHang) => void;
}

const KhachHangList: React.FC<Props> = ({
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
  } = useKhachHangStore(
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
    (columnId: string, item: KhachHang) => {
      switch (columnId) {
        case 'ma_khach_hang':
          return (
            <span className="font-mono text-caption font-medium text-muted-foreground bg-background px-1.5 py-0.5 rounded-lg border border-border tabular-nums">
              {item.ma_khach_hang}
            </span>
          );
        case 'ten_khach_hang':
          return (
            <span className="text-body-sm font-medium text-foreground truncate">
              {item.ten_khach_hang}
            </span>
          );
        case 'ten_nhom':
          return <KhachHangGroupBadge value={item.ten_nhom} truncate />;
        case 'ten_trang_thai':
          return <KhachHangStatusBadge value={item.ten_trang_thai} truncate />;
        case 'so_nguoi_lien_he': {
          const count = item.so_nguoi_lien_he ?? 0;
          return (
            <span className="inline-flex items-center gap-1.5 text-body-sm tabular-nums text-muted-foreground">
              <ContactRound size={14} className="shrink-0 text-primary/70" aria-hidden />
              <span className="font-medium text-foreground">{count}</span>
            </span>
          );
        }
        case 'so_dien_thoai':
          return (
            <span className="text-body-sm text-muted-foreground tabular-nums truncate">
              {item.so_dien_thoai || '—'}
            </span>
          );
        case 'dia_chi':
          return (
            <span className="text-body-sm text-muted-foreground truncate">
              {item.dia_chi || '—'}
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
            <KhachHangRowActions
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
    (item: KhachHang, isSelected: boolean) => (
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
            <Users className="text-primary" size={22} />
          </div>
        }
        titleRow={
          <div className="flex items-center gap-2 min-w-0">
            <h4 className="truncate text-base font-semibold text-foreground">
              {item.ten_khach_hang}
            </h4>
            <span className="font-mono text-[11px] text-muted-foreground shrink-0">
              {item.ma_khach_hang}
            </span>
          </div>
        }
        subheader={
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {item.ten_nhom && (
                <KhachHangGroupBadge value={item.ten_nhom} truncate />
              )}
              {item.ten_trang_thai && (
                <KhachHangStatusBadge value={item.ten_trang_thai} truncate />
              )}
              <span className="inline-flex items-center gap-1 text-xs tabular-nums text-muted-foreground">
                <ContactRound size={12} className="shrink-0" aria-hidden />
                {item.so_nguoi_lien_he ?? 0}
              </span>
            </div>
            {item.so_dien_thoai && (
              <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                <Phone size={12} className="shrink-0" />
                {item.so_dien_thoai}
              </p>
            )}
            {item.dia_chi && (
              <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                <MapPin size={12} className="shrink-0" />
                {item.dia_chi}
              </p>
            )}
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
          <KhachHangRowActions
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
      loadingText={txt('customer.loading')}
      emptyTitle={txt('customer.empty')}
      emptyDescription={txt('customer.emptyHint')}
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

export default KhachHangList;
