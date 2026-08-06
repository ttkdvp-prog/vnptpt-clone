import { Copy, Edit, Trash2 } from 'lucide-react';
import { txt } from '@/lib/text';
import {
  DataTableRowActions,
  TableRowIconButton,
  type RowOverflowMenuItem,
} from '@/components/shared/row-actions';
import { useCan } from '@/hooks/use-can';
import { useCanOnRecord } from '@/hooks/use-can-on-record';
import type { NguoiLienHe } from '../core/types';

interface Props {
  item: NguoiLienHe;
  menuOpenId: string | null;
  onMenuOpenChange: (id: string | null) => void;
  onEdit: (item: NguoiLienHe) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (item: NguoiLienHe) => void;
  compact?: boolean;
}

export function NguoiLienHeRowActions({
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
  const canEdit = useCanOnRecord('edit', 'contacts', recordCtx);
  const canDelete = useCanOnRecord('delete', 'contacts', recordCtx);
  const canCreate = useCan('create', 'contacts');

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
