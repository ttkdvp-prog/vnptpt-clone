import { CheckCircle2, Copy, Edit, PauseCircle, Trash2 } from 'lucide-react';
import { txt } from '@/lib/text';
import {
  DataTableRowActions,
  TableRowIconButton,
  type RowOverflowMenuItem,
} from '@/components/shared/row-actions';
import { useCan } from '@/hooks/use-can';
import { useCanOnRecord } from '@/hooks/use-can-on-record';
import { MARKET_IN_STATUS, type MarketIn } from '../core/types';
import {
  canApproveMarketIn,
  getMarketInApproveActionLabel,
} from '../utils/approve-workflow';

interface Props {
  item: MarketIn;
  menuOpenId: string | null;
  onMenuOpenChange: (id: string | null) => void;
  onEdit: (item: MarketIn) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (item: MarketIn) => void;
  onApprove?: (item: MarketIn) => void;
  onSuspend?: (item: MarketIn) => void;
  compact?: boolean;
}

export function MarketInRowActions({
  item,
  menuOpenId,
  onMenuOpenChange,
  onEdit,
  onDelete,
  onDuplicate,
  onApprove,
  onSuspend,
  compact = false,
}: Props) {
  const close = () => onMenuOpenChange(null);
  const recordCtx = { nguoi_tao: item.nguoi_tao };
  const canEdit = useCanOnRecord('edit', 'printMarkets', recordCtx);
  const canDelete = useCanOnRecord('delete', 'printMarkets', recordCtx);
  const canCreate = useCan('create', 'printMarkets');

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

  if (canEdit && canApproveMarketIn(item.trang_thai) && onApprove) {
    overflowItems.push({
      key: 'approve',
      label: getMarketInApproveActionLabel(item.trang_thai),
      icon: <CheckCircle2 size={14} />,
      onClick: () => {
        onApprove(item);
        close();
      },
    });
  }

  if (
    canEdit &&
    item.trang_thai !== MARKET_IN_STATUS.NGUNG_AP_DUNG &&
    onSuspend
  ) {
    overflowItems.push({
      key: 'suspend',
      label: txt('printMarket.suspendAction'),
      icon: <PauseCircle size={14} />,
      onClick: () => {
        onSuspend(item);
        close();
      },
    });
  }

  if (canDelete) {
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

  if (!canEdit && overflowItems.length === 0) {
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
        canEdit ? (
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
