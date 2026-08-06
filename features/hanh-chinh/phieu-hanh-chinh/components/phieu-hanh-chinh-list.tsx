import { useCallback, useState } from 'react';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';
import { txt } from '@/lib/text';
import { formatDate } from '@/lib/utils';
import GenericTable from '@/components/shared/GenericTable';
import { MobileListCard } from '@/components/shared/MobileListCard';
import { useShallow } from 'zustand/react/shallow';
import { CONFIRM_YES } from '@/lib/button-labels';
import { useConfirmStore } from '@/store/useConfirmStore';
import type { PhieuHanhChinh } from '../core/types';
import {
  useApprovePhieuHcns,
  useApprovePhieuQl,
  useCancelPhieuHanhChinh,
  useRejectPhieuHanhChinh,
} from '../hooks/use-phieu-hanh-chinh';
import { usePhieuHanhChinhStore } from '../store/usePhieuHanhChinhStore';
import {
  getApproveHcnsConfirm,
  getApproveQlConfirm,
  getCancelConfirm,
  getRejectConfirm,
} from '../utils/approve-workflow';
import { PhieuBuoiBadge, PhieuHanhChinhStatusBadge } from './phieu-hanh-chinh-badges';
import { PhieuHanhChinhRowActions } from './phieu-hanh-chinh-row-actions';

interface Props {
  data: PhieuHanhChinh[];
  isLoading: boolean;
  onEdit: (item: PhieuHanhChinh) => void;
  onDelete: (id: string) => void;
  onView: (item: PhieuHanhChinh) => void;
  onDuplicate?: (item: PhieuHanhChinh) => void;
}

const PhieuHanhChinhList: React.FC<Props> = ({
  data,
  isLoading,
  onEdit,
  onDelete,
  onView,
  onDuplicate,
}) => {
  const [rowMenuOpenId, setRowMenuOpenId] = useState<string | null>(null);
  const confirm = useConfirmStore((s) => s.confirm);
  const approveQlMutation = useApprovePhieuQl();
  const approveHcnsMutation = useApprovePhieuHcns();
  const rejectMutation = useRejectPhieuHanhChinh();
  const cancelMutation = useCancelPhieuHanhChinh();

  const handleApproveQl = useCallback(
    (item: PhieuHanhChinh) => {
      const { title, message } = getApproveQlConfirm();
      confirm({
        title,
        message,
        variant: 'info',
        confirmText: CONFIRM_YES(),
        onConfirm: async () => {
          await approveQlMutation.mutateAsync({ id: item.id });
        },
      });
    },
    [approveQlMutation, confirm],
  );

  const handleApproveHcns = useCallback(
    (item: PhieuHanhChinh) => {
      const { title, message } = getApproveHcnsConfirm();
      confirm({
        title,
        message,
        variant: 'info',
        confirmText: CONFIRM_YES(),
        onConfirm: async () => {
          await approveHcnsMutation.mutateAsync({ id: item.id });
        },
      });
    },
    [approveHcnsMutation, confirm],
  );

  const handleReject = useCallback(
    (item: PhieuHanhChinh) => {
      const { title, message } = getRejectConfirm();
      confirm({
        title,
        message,
        variant: 'danger',
        confirmText: CONFIRM_YES(),
        onConfirm: async () => {
          const reason = window.prompt(txt('adminForm.rejectReasonPrompt'));
          if (reason == null) return;
          if (!reason.trim()) {
            toast.error(txt('adminForm.rejectReasonRequired'));
            return;
          }
          await rejectMutation.mutateAsync({
            id: item.id,
            ly_do_tu_choi: reason.trim(),
          });
        },
      });
    },
    [confirm, rejectMutation],
  );

  const handleCancel = useCallback(
    (item: PhieuHanhChinh) => {
      const { title, message } = getCancelConfirm();
      confirm({
        title,
        message,
        variant: 'warning',
        confirmText: CONFIRM_YES(),
        onConfirm: async () => {
          await cancelMutation.mutateAsync(item.id);
        },
      });
    },
    [cancelMutation, confirm],
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
  } = usePhieuHanhChinhStore(
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
    (columnId: string, item: PhieuHanhChinh) => {
      switch (columnId) {
        case 'ten_loai_phieu':
          return (
            <span className="text-body-sm font-medium text-foreground truncate">
              {item.ten_loai_phieu || '—'}
            </span>
          );
        case 'ma_phieu':
          return (
            <span className="font-mono text-caption text-muted-foreground truncate">
              {item.ma_phieu || '—'}
            </span>
          );
        case 'ten_nhan_vien':
          return (
            <span className="text-body-sm text-foreground truncate">
              {item.ten_nhan_vien || '—'}
            </span>
          );
        case 'tu_ngay':
          return (
            <span className="text-body-sm text-muted-foreground tabular-nums">
              {item.tu_ngay ? formatDate(item.tu_ngay) : '—'}
            </span>
          );
        case 'den_ngay':
          return (
            <span className="text-body-sm text-muted-foreground tabular-nums">
              {item.den_ngay ? formatDate(item.den_ngay) : '—'}
            </span>
          );
        case 'buoi_bat_dau':
          return <PhieuBuoiBadge value={item.buoi_bat_dau} truncate />;
        case 'buoi_ket_thuc':
          return <PhieuBuoiBadge value={item.buoi_ket_thuc} truncate />;
        case 'trang_thai':
          return <PhieuHanhChinhStatusBadge value={item.trang_thai} truncate />;
        case 'ly_do':
          return (
            <span className="text-body-sm text-muted-foreground truncate">
              {item.ly_do || '—'}
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
            <PhieuHanhChinhRowActions
              item={item}
              menuOpenId={rowMenuOpenId}
              onMenuOpenChange={setRowMenuOpenId}
              onEdit={onEdit}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
              onApproveQl={handleApproveQl}
              onApproveHcns={handleApproveHcns}
              onReject={handleReject}
              onCancel={handleCancel}
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
      handleApproveQl,
      handleApproveHcns,
      handleReject,
      handleCancel,
      rowMenuOpenId,
    ],
  );

  const renderMobileCard = useCallback(
    (item: PhieuHanhChinh, isSelected: boolean) => (
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
            <FileText className="text-primary" size={22} />
          </div>
        }
        titleRow={
          <div className="flex items-center gap-2 min-w-0">
            <h4 className="truncate text-base font-semibold text-foreground">
              {item.ten_loai_phieu || txt('adminForm.title')}
            </h4>
            {item.ma_phieu && (
              <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                {item.ma_phieu}
              </span>
            )}
          </div>
        }
        subheader={
          <div className="flex flex-col gap-0.5 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <PhieuHanhChinhStatusBadge value={item.trang_thai} truncate />
              {item.ten_nhan_vien && (
                <span className="text-xs text-muted-foreground truncate">
                  {item.ten_nhan_vien}
                </span>
              )}
            </div>
            {item.ly_do && (
              <p className="truncate text-sm text-muted-foreground">{item.ly_do}</p>
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
          <PhieuHanhChinhRowActions
            compact
            item={item}
            menuOpenId={rowMenuOpenId}
            onMenuOpenChange={setRowMenuOpenId}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onApproveQl={handleApproveQl}
            onApproveHcns={handleApproveHcns}
            onReject={handleReject}
            onCancel={handleCancel}
          />
        }
      />
    ),
    [
      onEdit,
      onDelete,
      onDuplicate,
      onView,
      handleApproveQl,
      handleApproveHcns,
      handleReject,
      handleCancel,
      rowMenuOpenId,
      toggleSelection,
    ],
  );

  return (
    <GenericTable
      data={data}
      columns={columns}
      isLoading={isLoading}
      loadingText={txt('adminForm.loading')}
      emptyTitle={txt('adminForm.empty')}
      emptyDescription={txt('adminForm.emptyHint')}
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

export default PhieuHanhChinhList;
