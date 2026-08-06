import { useCallback, useState } from 'react';
import { FileSignature } from 'lucide-react';
import { txt } from '@/lib/text';
import { formatDate } from '@/lib/utils';
import GenericTable from '@/components/shared/GenericTable';
import { MobileListCard } from '@/components/shared/MobileListCard';
import { useShallow } from 'zustand/react/shallow';
import type { HopDong } from '../core/types';
import { useHopDongStore } from '../store/useHopDongStore';
import { HopDongRowActions } from './hop-dong-row-actions';
import { ContractStatusBadge, ContractTypeBadge } from './hop-dong-badges';

interface Props {
  data: HopDong[];
  isLoading: boolean;
  onEdit: (item: HopDong) => void;
  onDelete: (id: string) => void;
  onView: (item: HopDong) => void;
  onDuplicate?: (item: HopDong) => void;
}

const HopDongList: React.FC<Props> = ({
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
  } = useHopDongStore(
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
    (columnId: string, item: HopDong) => {
      switch (columnId) {
        case 'ma_hop_dong':
          return (
            <span className="text-body-sm font-medium text-foreground truncate">
              {item.ma_hop_dong}
            </span>
          );
        case 'loai_hop_dong':
          return <ContractTypeBadge value={item.loai_hop_dong} truncate />;
        case 'ten_nhan_vien':
          return (
            <span className="text-body-sm text-foreground truncate">
              {item.ten_nhan_vien || '—'}
            </span>
          );
        case 'ten_phong_ban':
          return (
            <span className="text-body-sm text-muted-foreground truncate">
              {item.ten_phong_ban || '—'}
            </span>
          );
        case 'ngay_ky':
          return item.ngay_ky ? (
            <span className="text-body-sm text-muted-foreground tabular-nums">
              {formatDate(item.ngay_ky)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground italic">—</span>
          );
        case 'ngay_hieu_luc':
          return item.ngay_hieu_luc ? (
            <span className="text-body-sm text-muted-foreground tabular-nums">
              {formatDate(item.ngay_hieu_luc)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground italic">—</span>
          );
        case 'ngay_ket_thuc':
          return item.ngay_ket_thuc ? (
            <span className="text-body-sm text-muted-foreground tabular-nums">
              {formatDate(item.ngay_ket_thuc)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground italic">
              {txt('contract.print.field.indefinite')}
            </span>
          );
        case 'muc_luong':
          return (
            <span className="text-body-sm text-foreground truncate block" title={item.muc_luong || undefined}>
              {item.muc_luong || '—'}
            </span>
          );
        case 'trang_thai':
          return <ContractStatusBadge value={item.trang_thai} truncate />;
        case 'ten_nguoi_tao':
          return (
            <span className="text-body-sm text-muted-foreground truncate">
              {item.ten_nguoi_tao || item.nguoi_tao || '—'}
            </span>
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
            <HopDongRowActions
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
    (item: HopDong, isSelected: boolean) => (
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
            <FileSignature className="text-primary" size={22} />
          </div>
        }
        titleRow={
          <h4 className="truncate text-base font-semibold text-foreground">
            {item.ma_hop_dong}
          </h4>
        }
        subheader={
          <div className="flex items-center gap-2 min-w-0">
            <ContractTypeBadge value={item.loai_hop_dong} truncate />
            <ContractStatusBadge value={item.trang_thai} truncate />
            {item.ten_nhan_vien ? (
              <span className="truncate text-sm text-muted-foreground">
                {item.ten_nhan_vien}
              </span>
            ) : null}
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
          <HopDongRowActions
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
      loadingText={txt('contract.loading')}
      emptyTitle={txt('contract.empty')}
      emptyDescription={txt('contract.emptyHint')}
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

export default HopDongList;
