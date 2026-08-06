import React from 'react';
import { Copy, Edit, Trash2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { BTN_CLOSE, BTN_DELETE, BTN_DUPLICATE, BTN_EDIT } from '@/lib/button-labels';

export interface DetailFooterActionsProps {
  onClose: () => void;
  /** Chỉ truyền khi có quyền — nút ẩn khi handler là undefined. */
  onDuplicate?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  /** Nút bổ sung chèn trước nhóm bên phải (vd. In, Đổi trạng thái). */
  extraActions?: React.ReactNode;
}

/**
 * Footer chuẩn cho drawer detail (mọi module):
 * Đóng bên trái — [extra?] Sao chép → Sửa → Xóa bên phải.
 * Xem quy ước `DETAIL_FOOTER_ORDER` trong `lib/button-labels.ts`.
 */
export function DetailFooterActions({
  onClose,
  onDuplicate,
  onEdit,
  onDelete,
  extraActions,
}: DetailFooterActionsProps) {
  const hasRight = !!(onDuplicate || onEdit || onDelete || extraActions);

  return (
    <div className="flex items-center justify-between w-full gap-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground border border-border"
      >
        {BTN_CLOSE()}
      </Button>
      {hasRight && (
        <div className="flex items-center gap-2">
          {extraActions}
          {onDuplicate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDuplicate}
              className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground border border-border"
            >
              <Copy className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              {BTN_DUPLICATE()}
            </Button>
          )}
          {onEdit && (
            <Button
              size="sm"
              onClick={onEdit}
              className="h-8 px-3 text-xs bg-primary text-white shadow-sm hover:bg-primary/90"
            >
              <Edit className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              {BTN_EDIT()}
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDelete}
              className="h-8 px-3 text-xs text-rose-600 hover:bg-rose-50 border border-rose-200"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />
              {BTN_DELETE()}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default DetailFooterActions;
