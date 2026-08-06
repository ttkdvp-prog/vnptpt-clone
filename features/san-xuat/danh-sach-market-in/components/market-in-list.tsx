import { useCallback, useState } from 'react';
import { ExternalLink, Printer } from 'lucide-react';
import { txt } from '@/lib/text';
import { formatDate } from '@/lib/utils';
import GenericTable from '@/components/shared/GenericTable';
import { MobileListCard } from '@/components/shared/MobileListCard';
import { useShallow } from 'zustand/react/shallow';
import { CONFIRM_YES } from '@/lib/button-labels';
import { useConfirmStore } from '@/store/useConfirmStore';
import type { MarketIn } from '../core/types';
import { useApproveMarketIn, useSuspendMarketIn } from '../hooks/use-market-in';
import { useMarketInStore } from '../store/useMarketInStore';
import {
  getMarketInApproveConfirm,
  isMarketInReapply,
} from '../utils/approve-workflow';
import { MarketInStatusBadge } from './market-in-badges';
import { MarketInRowActions } from './market-in-row-actions';

interface Props {
  data: MarketIn[];
  isLoading: boolean;
  onEdit: (item: MarketIn) => void;
  onDelete: (id: string) => void;
  onView: (item: MarketIn) => void;
  onDuplicate?: (item: MarketIn) => void;
}

const MarketInList: React.FC<Props> = ({
  data,
  isLoading,
  onEdit,
  onDelete,
  onView,
  onDuplicate,
}) => {
  const [rowMenuOpenId, setRowMenuOpenId] = useState<string | null>(null);
  const confirm = useConfirmStore((s) => s.confirm);
  const approveMutation = useApproveMarketIn();
  const suspendMutation = useSuspendMarketIn();

  const handleApprove = useCallback(
    (item: MarketIn) => {
      const { title, message } = getMarketInApproveConfirm(item.trang_thai);
      const reapply = isMarketInReapply(item.trang_thai);
      confirm({
        title,
        message,
        variant: 'info',
        confirmText: CONFIRM_YES(),
        onConfirm: async () => {
          await approveMutation.mutateAsync({ id: item.id, reapply });
        },
      });
    },
    [approveMutation, confirm],
  );

  const handleSuspend = useCallback(
    (item: MarketIn) => {
      confirm({
        title: txt('printMarket.suspendTitle'),
        message: txt('printMarket.suspendMessage'),
        variant: 'warning',
        confirmText: CONFIRM_YES(),
        onConfirm: async () => {
          await suspendMutation.mutateAsync(item.id);
        },
      });
    },
    [confirm, suspendMutation],
  );

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
  } = useMarketInStore(
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
    (columnId: string, item: MarketIn) => {
      switch (columnId) {
        case 'thu_tu':
          return (
            <span className="text-body-sm tabular-nums text-muted-foreground">
              {item.thu_tu}
            </span>
          );
        case 'ma_market':
          return (
            <span className="font-mono text-caption font-medium text-muted-foreground bg-background px-1.5 py-0.5 rounded-lg border border-border tabular-nums">
              {item.ma_market}
            </span>
          );
        case 'ma_san_pham':
          return (
            <span className="font-mono text-caption text-muted-foreground truncate">
              {item.ma_san_pham}
            </span>
          );
        case 'ten_khach_hang':
          return (
            <span className="text-body-sm font-medium text-foreground truncate">
              {item.ten_khach_hang || '—'}
            </span>
          );
        case 'ma_khach_hang':
          return (
            <span className="font-mono text-caption text-muted-foreground truncate">
              {item.ma_khach_hang || '—'}
            </span>
          );
        case 'trang_thai':
          return <MarketInStatusBadge value={item.trang_thai} truncate />;
        case 'ten_nguoi_ve':
          return (
            <span className="text-body-sm text-muted-foreground truncate">
              {item.ten_nguoi_ve || '—'}
            </span>
          );
        case 'ngay_hieu_luc':
          return item.ngay_hieu_luc ? (
            <span className="text-body-sm text-muted-foreground tabular-nums">
              {formatDate(item.ngay_hieu_luc)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground italic">—</span>
          );
        case 'link_file':
          return item.link_file ? (
            <a
              href={item.link_file}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline truncate max-w-[200px]"
            >
              <ExternalLink size={12} className="shrink-0" />
              <span className="truncate">{item.link_file}</span>
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
        case 'ten_nguoi_duyet':
          return (
            <span className="text-body-sm text-muted-foreground truncate">
              {item.ten_nguoi_duyet || '—'}
            </span>
          );
        case 'tg_duyet':
          return item.tg_duyet ? (
            <span className="text-body-sm text-muted-foreground tabular-nums">
              {formatDate(item.tg_duyet)}
            </span>
          ) : (
            <span className="text-xs text-muted-foreground italic">—</span>
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
            <MarketInRowActions
              item={item}
              menuOpenId={rowMenuOpenId}
              onMenuOpenChange={setRowMenuOpenId}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onApprove={handleApprove}
              onSuspend={handleSuspend}
            />
          );
        default:
          return null;
      }
    },
    [onEdit, onDelete, onDuplicate, handleApprove, handleSuspend, rowMenuOpenId],
  );

  const renderMobileCard = useCallback(
    (item: MarketIn, isSelected: boolean) => (
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
            <Printer className="text-primary" size={22} />
          </div>
        }
        titleRow={
          <div className="flex items-center gap-2 min-w-0">
            <h4 className="truncate text-base font-semibold text-foreground">
              {item.ma_market}
            </h4>
            <span className="font-mono text-[11px] text-muted-foreground shrink-0">
              {item.ma_san_pham}
            </span>
          </div>
        }
        subheader={
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <MarketInStatusBadge value={item.trang_thai} truncate />
              {item.ten_khach_hang && (
                <span className="text-xs text-muted-foreground truncate">
                  {item.ten_khach_hang}
                </span>
              )}
            </div>
            {item.mo_ta && (
              <p className="truncate text-sm text-muted-foreground">{item.mo_ta}</p>
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
          <MarketInRowActions
            compact
            item={item}
            menuOpenId={rowMenuOpenId}
            onMenuOpenChange={setRowMenuOpenId}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onApprove={handleApprove}
            onSuspend={handleSuspend}
          />
        }
      />
    ),
    [
      onEdit,
      onDelete,
      onDuplicate,
      onView,
      handleApprove,
      handleSuspend,
      rowMenuOpenId,
      toggleSelection,
    ],
  );

  return (
    <GenericTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      loadingText={txt('printMarket.loading')}
      emptyTitle={txt('printMarket.empty')}
      emptyDescription={txt('printMarket.emptyHint')}
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

export default MarketInList;
