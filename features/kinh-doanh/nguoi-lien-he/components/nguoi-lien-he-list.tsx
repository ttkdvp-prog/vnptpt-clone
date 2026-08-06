import { useCallback, useState } from 'react';
import { ContactRound, Phone, Mail } from 'lucide-react';
import { txt } from '@/lib/text';
import { formatDate } from '@/lib/utils';
import GenericTable from '@/components/shared/GenericTable';
import { MobileListCard } from '@/components/shared/MobileListCard';
import { useShallow } from 'zustand/react/shallow';
import type { NguoiLienHe } from '../core/types';
import { useNguoiLienHeStore } from '../store/useNguoiLienHeStore';
import { formatNgaySinh } from '../utils/search-keys';
import { NguoiLienHeRowActions } from './nguoi-lien-he-row-actions';

interface Props {
  data: NguoiLienHe[];
  isLoading: boolean;
  onEdit: (item: NguoiLienHe) => void;
  onDelete: (id: string) => void;
  onView: (item: NguoiLienHe) => void;
  onDuplicate?: (item: NguoiLienHe) => void;
}

const NguoiLienHeList: React.FC<Props> = ({
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
  } = useNguoiLienHeStore(
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
    (columnId: string, item: NguoiLienHe) => {
      switch (columnId) {
        case 'ho_ten':
          return (
            <span className="text-body-sm font-medium text-foreground truncate">
              {item.ho_ten}
            </span>
          );
        case 'ten_khach_hang':
          return (
            <div className="min-w-0">
              <span className="text-body-sm text-foreground truncate block">
                {item.ten_khach_hang || '—'}
              </span>
              {item.ma_khach_hang && (
                <span className="font-mono text-[11px] text-muted-foreground">
                  {item.ma_khach_hang}
                </span>
              )}
            </div>
          );
        case 'chuc_vu':
          return (
            <span className="text-body-sm text-muted-foreground truncate">
              {item.chuc_vu || '—'}
            </span>
          );
        case 'so_dien_thoai':
          return (
            <span className="text-body-sm text-muted-foreground tabular-nums truncate">
              {item.so_dien_thoai || '—'}
            </span>
          );
        case 'email':
          return (
            <span className="text-body-sm text-muted-foreground truncate">
              {item.email || '—'}
            </span>
          );
        case 'ngay_sinh':
          return (
            <span className="text-body-sm text-muted-foreground tabular-nums">
              {formatNgaySinh(item.ngay_sinh)}
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
            <NguoiLienHeRowActions
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
    (item: NguoiLienHe, isSelected: boolean) => (
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
            <ContactRound className="text-primary" size={22} />
          </div>
        }
        titleRow={
          <h4 className="truncate text-base font-semibold text-foreground">{item.ho_ten}</h4>
        }
        subheader={
          <div className="flex flex-col gap-0.5 min-w-0">
            <p className="truncate text-sm text-muted-foreground">
              {item.ten_khach_hang || '—'}
              {item.chuc_vu ? ` · ${item.chuc_vu}` : ''}
            </p>
            {item.so_dien_thoai && (
              <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                <Phone size={12} className="shrink-0" />
                {item.so_dien_thoai}
              </p>
            )}
            {item.email && (
              <p className="flex items-center gap-1 truncate text-sm text-muted-foreground">
                <Mail size={12} className="shrink-0" />
                {item.email}
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
          <NguoiLienHeRowActions
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
      loadingText={txt('contact.loading')}
      emptyTitle={txt('contact.empty')}
      emptyDescription={txt('contact.emptyHint')}
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

export default NguoiLienHeList;
