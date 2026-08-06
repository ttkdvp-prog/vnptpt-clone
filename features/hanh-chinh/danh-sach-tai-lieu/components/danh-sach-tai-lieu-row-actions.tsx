import { Copy, Edit, Shield, Tag, Trash2 } from 'lucide-react';
import { txt } from '@/lib/text';
import {
  DataTableRowActions,
  TableRowIconButton,
  type RowOverflowMenuItem,
} from '@/components/shared/row-actions';
import { useCan } from '@/hooks/use-can';
import { useCanOnRecord } from '@/hooks/use-can-on-record';
import type { DanhSachTaiLieu } from '../core/types';

interface Props {
  item: DanhSachTaiLieu;
  menuOpenId: string | null;
  onMenuOpenChange: (id: string | null) => void;
  onEdit: (item: DanhSachTaiLieu) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (item: DanhSachTaiLieu) => void;
  onChangeStatus?: (item: DanhSachTaiLieu) => void;
  onChangeAccess?: (item: DanhSachTaiLieu) => void;
  compact?: boolean;
}

export function DanhSachTaiLieuRowActions({
  item,
  menuOpenId,
  onMenuOpenChange,
  onEdit,
  onDelete,
  onDuplicate,
  onChangeStatus,
  onChangeAccess,
  compact = false,
}: Props) {
  const close = () => onMenuOpenChange(null);
  const recordCtx = { nguoi_tao: item.nguoi_tao };
  const canEdit = useCanOnRecord('edit', 'documentList', recordCtx);
  const canDelete = useCanOnRecord('delete', 'documentList', recordCtx);
  const canCreate = useCan('create', 'documentList');

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

  if (canEdit && onChangeStatus) {
    overflowItems.push({
      key: 'status',
      label: txt('document.detail.changeStatus'),
      icon: <Tag size={14} />,
      onClick: () => {
        onChangeStatus(item);
        close();
      },
    });
  }

  if (canEdit && onChangeAccess) {
    overflowItems.push({
      key: 'access',
      label: txt('document.detail.changeAccess'),
      icon: <Shield size={14} />,
      onClick: () => {
        onChangeAccess(item);
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
