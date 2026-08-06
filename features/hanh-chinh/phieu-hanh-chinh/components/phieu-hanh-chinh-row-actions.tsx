import { Ban, CheckCircle2, Copy, Edit, ShieldX, Trash2 } from 'lucide-react';
import { txt } from '@/lib/text';
import {
  DataTableRowActions,
  TableRowIconButton,
  type RowOverflowMenuItem,
} from '@/components/shared/row-actions';
import { useCan } from '@/hooks/use-can';
import { useCanOnRecord } from '@/hooks/use-can-on-record';
import { useAuthStore } from '@/store/useStore';
import type { PhieuHanhChinh } from '../core/types';
import { useCanManageLockedPhieuHanhChinh } from '../hooks/use-phieu-hanh-chinh-privileged';
import {
  canApproveHcns,
  canApproveQl,
  canCancelPhieu,
  canDeletePhieu,
  canEditPhieu,
  canRejectPhieu,
} from '../utils/approve-workflow';

interface Props {
  item: PhieuHanhChinh;
  menuOpenId: string | null;
  onMenuOpenChange: (id: string | null) => void;
  onEdit: (item: PhieuHanhChinh) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (item: PhieuHanhChinh) => void;
  onApproveQl?: (item: PhieuHanhChinh) => void;
  onApproveHcns?: (item: PhieuHanhChinh) => void;
  onReject?: (item: PhieuHanhChinh) => void;
  onCancel?: (item: PhieuHanhChinh) => void;
  compact?: boolean;
}

export function PhieuHanhChinhRowActions({
  item,
  menuOpenId,
  onMenuOpenChange,
  onEdit,
  onDelete,
  onDuplicate,
  onApproveQl,
  onApproveHcns,
  onReject,
  onCancel,
  compact = false,
}: Props) {
  const close = () => onMenuOpenChange(null);
  const recordCtx = { nguoi_tao: item.nguoi_tao };
  const canEdit = useCanOnRecord('edit', 'adminForms', recordCtx);
  const canDelete = useCanOnRecord('delete', 'adminForms', recordCtx);
  const canManageLocked = useCanManageLockedPhieuHanhChinh();
  const canCreate = useCan('create', 'adminForms');
  const currentEmployeeId = useAuthStore((s) => s.user?.employee_id ?? null);

  const overflowItems: RowOverflowMenuItem[] = [];

  if (canCreate && onDuplicate) {
    overflowItems.push({
      key: 'duplicate',
      label: txt('common.duplicate'),
      icon: <Copy size={14} />,
      onClick: () => {
        onDuplicate(item);
        close();
      },
    });
  }

  if (canEdit && canApproveQl(item.trang_thai) && onApproveQl) {
    overflowItems.push({
      key: 'approve-ql',
      label: txt('adminForm.approveQlAction'),
      icon: <CheckCircle2 size={14} />,
      onClick: () => {
        onApproveQl(item);
        close();
      },
    });
  }

  if (canEdit && canApproveHcns(item.trang_thai) && onApproveHcns) {
    overflowItems.push({
      key: 'approve-hcns',
      label: txt('adminForm.approveHcnsAction'),
      icon: <CheckCircle2 size={14} />,
      onClick: () => {
        onApproveHcns(item);
        close();
      },
    });
  }

  if (canEdit && canRejectPhieu(item.trang_thai) && onReject) {
    overflowItems.push({
      key: 'reject',
      label: txt('adminForm.rejectAction'),
      icon: <ShieldX size={14} />,
      variant: 'destructive',
      onClick: () => {
        onReject(item);
        close();
      },
    });
  }

  const showCancel =
    onCancel &&
    canCancelPhieu(item.trang_thai, {
      currentEmployeeId,
      id_nhan_vien: item.id_nhan_vien,
      nguoi_tao: item.nguoi_tao,
    });

  if (showCancel) {
    overflowItems.push({
      key: 'cancel',
      label: txt('adminForm.cancelAction'),
      icon: <Ban size={14} />,
      variant: 'destructive',
      onClick: () => {
        onCancel(item);
        close();
      },
    });
  }

  const showDelete =
    canDelete && canDeletePhieu(item.trang_thai, canManageLocked);

  if (showDelete) {
    overflowItems.push({
      key: 'delete',
      label: txt('common.delete'),
      icon: <Trash2 size={14} />,
      variant: 'destructive',
      onClick: () => {
        onDelete(item.id);
        close();
      },
    });
  }

  const showEdit =
    canEdit && canEditPhieu(item.trang_thai, canManageLocked);

  if (!showEdit && overflowItems.length === 0) {
    return (
      <div
        role="group"
        className="flex items-center justify-center"
        onPointerDown={(e) => e.stopPropagation()}
      />
    );
  }

  return (
    <DataTableRowActions
      rowId={item.id}
      compact={compact}
      menuOpenId={menuOpenId}
      onMenuOpenChange={onMenuOpenChange}
      primary={
        showEdit ? (
          <TableRowIconButton
            icon={Edit}
            label={txt('common.edit')}
            size={compact ? 'touch' : 'default'}
            variant="primary"
            onClick={() => onEdit(item)}
          />
        ) : undefined
      }
      overflowItems={overflowItems}
      overflowTriggerLabel={txt('common.moreRowActions')}
    />
  );
}
