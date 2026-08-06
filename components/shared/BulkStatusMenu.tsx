import React, { useCallback, useRef, useState } from 'react';
import { ChevronDown, Tag } from 'lucide-react';
import { txt } from '@/lib/text';
import { RowActionsOverflowMenu } from './row-actions/RowActionsOverflowMenu';
import type { RowOverflowMenuItem } from './row-actions/types';

export interface BulkStatusMenuOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'destructive';
}

export interface BulkStatusMenuProps {
  options: BulkStatusMenuOption[];
  onSelect: (value: string) => void;
  /** Nhãn nút (mặc định `common.bulkChangeStatus`). */
  label?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

/**
 * Một nút "Đổi trạng thái" mở dropdown liệt kê các trạng thái đích — dùng cho thanh
 * bulk của mọi module.
 *
 * Cố ý **không** render N nút rời: thanh bulk không phình theo số trạng thái, và các
 * module có 4-5 trạng thái (Tài liệu, Phiếu hành chính) không có cách nào hiện dạng
 * nút rời. Nhãn nút ẩn trên mobile, giữ vùng bấm 44px.
 */
const BulkStatusMenu: React.FC<BulkStatusMenuProps> = ({
  options,
  onSelect,
  label,
  icon,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const resolvedLabel = label ?? txt('common.bulkChangeStatus');

  const close = useCallback(() => setOpen(false), []);

  const items: RowOverflowMenuItem[] = options.map((option) => ({
    key: option.value,
    label: option.label,
    icon: option.icon ?? <Tag className="w-3.5 h-3.5" />,
    variant: option.variant,
    onClick: () => {
      setOpen(false);
      onSelect(option.value);
    },
  }));

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={resolvedLabel}
        onClick={() => setOpen((prev) => !prev)}
        className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 h-8 w-8 sm:w-auto sm:px-3 flex items-center justify-center sm:gap-1.5 text-primary bg-primary/10 rounded-lg border border-primary/20 active:scale-95 disabled:opacity-50 disabled:pointer-events-none sm:hover:bg-primary/15 sm:transition-all"
      >
        {icon ?? <Tag size={14} className="stroke-[2.5px] shrink-0" />}
        <span className="hidden sm:inline text-xs font-medium">{resolvedLabel}</span>
        <ChevronDown size={12} className="hidden sm:inline stroke-[2.5px] shrink-0" />
      </button>
      <RowActionsOverflowMenu
        open={open}
        onClose={close}
        anchorRef={anchorRef}
        portalEnabled
        items={items}
        minWidth={180}
      />
    </>
  );
};

export default BulkStatusMenu;
