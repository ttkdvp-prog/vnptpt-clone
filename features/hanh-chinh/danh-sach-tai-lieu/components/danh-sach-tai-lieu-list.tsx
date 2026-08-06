import { useCallback, useState } from 'react';
import { ExternalLink, Files } from 'lucide-react';
import { txt } from '@/lib/text';
import { formatDate } from '@/lib/utils';
import GenericTable from '@/components/shared/GenericTable';
import { MobileListCard } from '@/components/shared/MobileListCard';
import { useShallow } from 'zustand/react/shallow';
import type { DanhSachTaiLieu } from '../core/types';
import { useDocumentStatusChange } from '../hooks/use-document-status-change';
import { useDanhSachTaiLieuStore } from '../store/useDanhSachTaiLieuStore';
import { DanhSachTaiLieuRowActions } from './danh-sach-tai-lieu-row-actions';
import { DocumentAccessDialog } from './document-access-dialog';
import { DocumentStatusBadge } from './document-badges';

interface Props {
  data: DanhSachTaiLieu[];
  isLoading: boolean;
  onEdit: (item: DanhSachTaiLieu) => void;
  onDelete: (id: string) => void;
  onView: (item: DanhSachTaiLieu) => void;
  onDuplicate?: (item: DanhSachTaiLieu) => void;
}

const DanhSachTaiLieuList: React.FC<Props> = ({
  data,
  isLoading,
  onEdit,
  onDelete,
  onView,
  onDuplicate,
}) => {
  const [rowMenuOpenId, setRowMenuOpenId] = useState<string | null>(null);
  const [accessItem, setAccessItem] = useState<DanhSachTaiLieu | null>(null);
  const { openStatusChange } = useDocumentStatusChange();

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
  } = useDanhSachTaiLieuStore(
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

  const handleChangeStatus = useCallback(
    (item: DanhSachTaiLieu) => {
      openStatusChange(item);
    },
    [openStatusChange],
  );

  const handleChangeAccess = useCallback((item: DanhSachTaiLieu) => {
    setAccessItem(item);
  }, []);

  const renderCell = useCallback(
    (columnId: string, item: DanhSachTaiLieu) => {
      switch (columnId) {
        case 'ten_tai_lieu':
          return (
            <span className="text-body-sm font-medium text-foreground truncate">
              {item.ten_tai_lieu}
            </span>
          );
        case 'ten_loai_tai_lieu':
          return (
            <span className="text-body-sm text-muted-foreground truncate">
              {item.ten_loai_tai_lieu || '—'}
            </span>
          );
        case 'trang_thai':
          return <DocumentStatusBadge value={item.trang_thai} truncate />;
        case 'link_tai_lieu':
          return item.link_tai_lieu ? (
            <a
              href={item.link_tai_lieu}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-body-sm text-primary hover:underline truncate max-w-full"
            >
              <ExternalLink size={12} className="shrink-0" />
              <span className="truncate">{item.link_tai_lieu}</span>
            </a>
          ) : (
            <span className="text-xs text-muted-foreground italic">—</span>
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
            <DanhSachTaiLieuRowActions
              item={item}
              menuOpenId={rowMenuOpenId}
              onMenuOpenChange={setRowMenuOpenId}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onChangeStatus={handleChangeStatus}
              onChangeAccess={handleChangeAccess}
            />
          );
        default:
          return null;
      }
    },
    [
      onEdit,
      onDelete,
      onDuplicate,
      rowMenuOpenId,
      handleChangeStatus,
      handleChangeAccess,
    ],
  );

  const renderMobileCard = useCallback(
    (item: DanhSachTaiLieu, isSelected: boolean) => (
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
            <Files className="text-primary" size={22} />
          </div>
        }
        titleRow={
          <h4 className="truncate text-base font-semibold text-foreground">
            {item.ten_tai_lieu}
          </h4>
        }
        subheader={
          <div className="flex items-center gap-2 min-w-0">
            <DocumentStatusBadge value={item.trang_thai} truncate />
            {item.ten_loai_tai_lieu ? (
              <span className="truncate text-sm text-muted-foreground">
                {item.ten_loai_tai_lieu}
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
          <DanhSachTaiLieuRowActions
            compact
            item={item}
            menuOpenId={rowMenuOpenId}
            onMenuOpenChange={setRowMenuOpenId}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onChangeStatus={handleChangeStatus}
            onChangeAccess={handleChangeAccess}
          />
        }
      />
    ),
    [
      onEdit,
      onDelete,
      onDuplicate,
      onView,
      rowMenuOpenId,
      toggleSelection,
      handleChangeStatus,
      handleChangeAccess,
    ],
  );

  const resolvedAccessItem = accessItem
    ? (data.find((d) => d.id === accessItem.id) ?? accessItem)
    : null;

  return (
    <>
      <GenericTable
        data={data}
        columns={columns}
        isLoading={isLoading}
        loadingText={txt('document.loading')}
        emptyTitle={txt('document.empty')}
        emptyDescription={txt('document.emptyHint')}
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
      <DocumentAccessDialog
        open={!!accessItem}
        item={resolvedAccessItem}
        onClose={() => setAccessItem(null)}
      />
    </>
  );
};

export default DanhSachTaiLieuList;
