import React from 'react';
import { Copy, Edit, RefreshCw, Trash2 } from 'lucide-react';
import { txt } from '@/lib/text';
import {
  DataTableRowActions,
  TableRowIconButton,
  type RowOverflowMenuItem,
} from '@/components/shared/row-actions';
import type { Employee } from '../core/types';
import { useCan } from '@/hooks/use-can';

export interface EmployeeTableRowActionsProps {
  item: Employee;
  menuOpenId: string | null;
  onMenuOpenChange: (id: string | null) => void;
  onEdit: (item: Employee) => void;
  onDelete: (id: string) => void;
  onStatusChange: (item: Employee) => void;
  onDuplicate?: (item: Employee) => void;
  /** Hàng thao tác trên card mobile (mobile list): nút touch ~44px, cùng hàng với checkbox */
  compact?: boolean;
}

export function EmployeeTableRowActions({
  item,
  menuOpenId,
  onMenuOpenChange,
  onEdit,
  onDelete,
  onStatusChange,
  onDuplicate,
  compact = false,
}: EmployeeTableRowActionsProps) {
  const close = () => onMenuOpenChange(null);

  const canEdit = useCan('edit', 'employees');
  const canDelete = useCan('delete', 'employees');
  const canCreate = useCan('create', 'employees');

  const overflowItems: RowOverflowMenuItem[] = [
    ...(canCreate && onDuplicate
      ? [
          {
            key: 'duplicate',
            label: txt('common.duplicate'),
            icon: <Copy size={14} />,
            onClick: () => {
              onDuplicate(item);
              close();
            },
          },
        ]
      : []),
    ...(canEdit
      ? [
          {
            key: 'status',
            label: txt('employee.detail.changeStatus'),
            icon: <RefreshCw size={14} />,
            onClick: () => {
              onStatusChange(item);
              close();
            },
          },
        ]
      : []),
    ...(canDelete
      ? [
          {
            key: 'delete',
            label: txt('common.delete'),
            icon: <Trash2 size={14} />,
            variant: 'destructive' as const,
            onClick: () => {
              onDelete(item.id);
              close();
            },
          },
        ]
      : []),
  ];

  const hasMenuItems = overflowItems.length > 0;

  const primary =
    canEdit ? (
      <TableRowIconButton
        icon={Edit}
        label={txt('common.edit')}
        size={compact ? 'touch' : 'default'}
        variant="primary"
        onClick={() => onEdit(item)}
      />
    ) : undefined;

  if (!primary && !hasMenuItems) {
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
      primary={primary}
      overflowItems={overflowItems}
      overflowTriggerLabel={txt('employee.rowActions.more')}
    />
  );
}
