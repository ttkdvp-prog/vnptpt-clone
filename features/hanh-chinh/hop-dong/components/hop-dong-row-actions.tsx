import { Copy, Edit, Printer, Trash2 } from 'lucide-react';
import { txt } from '@/lib/text';
import {
  DataTableRowActions,
  TableRowIconButton,
  type RowOverflowMenuItem,
} from '@/components/shared/row-actions';
import { useCan } from '@/hooks/use-can';
import { useCanOnRecord } from '@/hooks/use-can-on-record';
import type { HopDong } from '../core/types';
import { openContractPrintTab } from '../utils/open-contract-print';

interface Props {
  item: HopDong;
  menuOpenId: string | null;
  onMenuOpenChange: (id: string | null) => void;
  onEdit: (item: HopDong) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (item: HopDong) => void;
  compact?: boolean;
}

export function HopDongRowActions({
  item,
  menuOpenId,
  onMenuOpenChange,
  onEdit,
  onDelete,
  onDuplicate,
  compact = false,
}: Props) {
  const close = () => onMenuOpenChange(null);
  const recordCtx = { nguoi_tao: item.nguoi_tao };
  const canEdit = useCanOnRecord('edit', 'contracts', recordCtx);
  const canDelete = useCanOnRecord('delete', 'contracts', recordCtx);
  const canCreate = useCan('create', 'contracts');

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

  overflowItems.push({
    key: 'print',
    label: txt('contract.detail.print'),
    icon: <Printer size={14} />,
    onClick: () => {
      openContractPrintTab(item.id);
      close();
    },
  });

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
