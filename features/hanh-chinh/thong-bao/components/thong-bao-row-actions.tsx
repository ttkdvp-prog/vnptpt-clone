import { Copy, Edit, Trash2 } from 'lucide-react';
import { txt } from '@/lib/text';
import {
  DataTableRowActions,
  TableRowIconButton,
  type RowOverflowMenuItem,
} from '@/components/shared/row-actions';
import { useCan } from '@/hooks/use-can';
import { useCanOnRecord } from '@/hooks/use-can-on-record';
import type { ThongBao } from '../core/types';

interface Props {
  item: ThongBao;
  menuOpenId: string | null;
  onMenuOpenChange: (id: string | null) => void;
  onEdit: (item: ThongBao) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (item: ThongBao) => void;
  compact?: boolean;
}

export function ThongBaoRowActions({
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
  const canEdit = useCanOnRecord('edit', 'announcements', recordCtx);
  const canDelete = useCanOnRecord('delete', 'announcements', recordCtx);
  const canCreate = useCan('create', 'announcements');

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
