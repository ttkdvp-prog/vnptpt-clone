import { lazy, Suspense, useCallback, useMemo, useState } from 'react';
import { FileSignature, ShieldOff } from 'lucide-react';
import { EmptyState, EmbeddedChildDataGrid } from '@/components/views';
import { ListToolbarAddButton } from '@/components/shared/ListToolbarActions';
import { DRAWER_Z_CONTENT_BASE, getDrawerWidthClass } from '@/lib/dialog-sizes';
import { CONFIRM_DELETE } from '@/lib/button-labels';
import { useCan } from '@/hooks/use-can';
import { useConfirmStore } from '@/store/useConfirmStore';
import { txt } from '@/lib/text';
import { cn, formatDate } from '@/lib/utils';
import {
  useDeleteHopDong,
  useHopDong,
} from '@/features/hanh-chinh/hop-dong/hooks/use-hop-dong';
import { HopDongRowActions } from '@/features/hanh-chinh/hop-dong/components/hop-dong-row-actions';
import {
  ContractStatusBadge,
  ContractTypeBadge,
} from '@/features/hanh-chinh/hop-dong/components/hop-dong-badges';
import type { HopDong } from '@/features/hanh-chinh/hop-dong/core/types';

const HopDongForm = lazy(
  () => import('@/features/hanh-chinh/hop-dong/components/hop-dong-form'),
);
const HopDongDetail = lazy(
  () => import('@/features/hanh-chinh/hop-dong/components/hop-dong-detail'),
);

const DrawerLazyFallback: React.FC = () => (
  <div
    className="fixed inset-0 flex items-center justify-center bg-black/30 pointer-events-none"
    style={{ zIndex: DRAWER_Z_CONTENT_BASE }}
  >
    <div
      className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent"
      aria-hidden
    />
  </div>
);

interface Props {
  employeeId: string;
  stackLevel?: number;
}

export function NhanVienDetailContracts({ employeeId, stackLevel = 0 }: Props) {
  const confirm = useConfirmStore((s) => s.confirm);
  const { data: allContracts = [] } = useHopDong();
  const deleteMutation = useDeleteHopDong();

  const canView = useCan('view', 'contracts');
  const canCreate = useCan('create', 'contracts');

  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<HopDong | null>(null);
  const [editing, setEditing] = useState<HopDong | null>(null);
  const [showForm, setShowForm] = useState(false);

  const contracts = useMemo(
    () => allContracts.filter((c) => c.id_nhan_vien === employeeId),
    [allContracts, employeeId],
  );

  const resolvedViewing = useMemo(() => {
    if (!viewing) return null;
    return contracts.find((c) => c.id === viewing.id) ?? viewing;
  }, [contracts, viewing]);

  const nestedStackLevel = stackLevel + 1;
  const nestedDrawerWidth = getDrawerWidthClass(nestedStackLevel);

  const handleCloseForm = useCallback(() => {
    setShowForm(false);
    setEditing(null);
  }, []);

  const handleDelete = useCallback(
    (id: string) => {
      confirm({
        title: txt('contract.deleteTitle'),
        message: txt('contract.deleteMessage'),
        variant: 'danger',
        confirmText: CONFIRM_DELETE(),
        onConfirm: async () => {
          deleteMutation.mutate([id], {
            onSuccess: () => {
              if (viewing?.id === id) setViewing(null);
            },
          });
        },
      });
    },
    [confirm, deleteMutation, viewing?.id],
  );

  if (!canView) {
    return (
      <EmptyState
        title={txt('employee.detail.contractsForbidden')}
        icon={<ShieldOff className="h-10 w-10 text-muted-foreground" />}
      />
    );
  }

  return (
    <>
      <div
        className={cn(
          'w-full bg-card p-3.5 sm:p-4 md:p-5 rounded-xl border border-border shadow-sm',
          'space-y-2.5 sm:space-y-3',
        )}
      >
        <div className="flex items-center gap-3 pb-2 sm:pb-2.5">
          <div className="flex min-w-0 items-center gap-2 shrink-0">
            <FileSignature size={14} className="shrink-0 text-primary" />
            <h4 className="text-xs font-semibold uppercase tracking-wider text-primary font-bold truncate">
              {txt('employee.detail.contractsSection')}
            </h4>
            <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium tabular-nums text-primary">
              {contracts.length}
            </span>
          </div>
          <div
            className="mx-1 h-px flex-1 self-center border-b border-dashed border-border/80"
            aria-hidden
          />
          {canCreate ? (
            <ListToolbarAddButton
              onClick={() => {
                setEditing(null);
                setShowForm(true);
              }}
              label={txt('employee.detail.contractsAdd')}
            />
          ) : null}
        </div>

        {contracts.length === 0 ? (
          <EmptyState
            title={txt('employee.detail.contractsEmpty')}
            description={txt('employee.detail.contractsEmptyHint')}
            icon={<FileSignature className="h-10 w-10 text-muted-foreground" />}
          />
        ) : (
          <EmbeddedChildDataGrid<HopDong>
            rows={contracts}
            getRowKey={(row) => row.id}
            labelColumn={{
              header: txt('contract.export.code'),
              minWidthClass: 'min-w-[120px]',
              renderCell: (row) => (
                <span className="rounded border border-border bg-muted px-2 py-0.5 font-mono text-xs text-foreground">
                  {row.ma_hop_dong}
                </span>
              ),
            }}
            columns={[
              {
                id: 'loai',
                header: txt('contract.export.type'),
                renderCell: (row) => <ContractTypeBadge value={row.loai_hop_dong} truncate />,
              },
              {
                id: 'ngay_hieu_luc',
                header: txt('contract.export.effectiveDate'),
                renderCell: (row) => (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {row.ngay_hieu_luc ? formatDate(row.ngay_hieu_luc) : '—'}
                  </span>
                ),
              },
              {
                id: 'trang_thai',
                header: txt('contract.export.status'),
                renderCell: (row) => <ContractStatusBadge value={row.trang_thai} truncate />,
              },
            ]}
            actionsColumn={{
              header: txt('common.actions'),
              widthClass: 'w-[92px] min-w-[92px]',
              headerClassName: 'px-2',
              cellClassName: 'px-2',
              renderCell: (row) => (
                <HopDongRowActions
                  item={row}
                  menuOpenId={menuOpenId}
                  onMenuOpenChange={setMenuOpenId}
                  onEdit={(item) => {
                    setEditing(item);
                    setShowForm(true);
                    setViewing(null);
                  }}
                  onDelete={handleDelete}
                />
              ),
            }}
            onRowClick={(row) => setViewing(row)}
            containerClassName="border-0 shadow-none"
          />
        )}
      </div>

      {showForm ? (
        <Suspense fallback={<DrawerLazyFallback />}>
          <HopDongForm
            initialData={editing}
            defaultNhanVienId={employeeId}
            stackLevel={nestedStackLevel}
            onClose={handleCloseForm}
          />
        </Suspense>
      ) : null}

      {resolvedViewing && !showForm ? (
        <Suspense fallback={<DrawerLazyFallback />}>
          <HopDongDetail
            data={resolvedViewing}
            maxWidthClass={nestedDrawerWidth}
            stackLevel={nestedStackLevel}
            onClose={() => setViewing(null)}
            onEdit={(item) => {
              setEditing(item);
              setShowForm(true);
              setViewing(null);
            }}
            onDelete={handleDelete}
          />
        </Suspense>
      ) : null}
    </>
  );
}
