import React, { useRef } from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> {
  /** Trạng thái "chưa chọn hết" — vd header chọn tất cả khi chỉ vài dòng được tick. */
  indeterminate?: boolean;
  label?: React.ReactNode;
}

/**
 * Checkbox dùng chung — thay 26 chỗ `<input type="checkbox">` thô lặp lại cùng
 * class string (`GenericTable.tsx`, `HierarchyTable.tsx`, các mobile card
 * footerStart của 13 module, `PositionPermissionPicker.tsx`, ...).
 *
 * Merge ref: caller vẫn truyền được `ref` riêng (vd để focus), trong khi
 * component tự set `.indeterminate` qua callback ref nội bộ — xoá hẳn kiểu
 * `ref={input => { if (input) input.indeterminate = isIndeterminate; }}` lặp
 * ở GenericTable/HierarchyTable.
 */
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, indeterminate = false, label, id, ...props }, forwardedRef) => {
    const localRef = useRef<HTMLInputElement>(null);

    const setRefs = (node: HTMLInputElement | null) => {
      localRef.current = node;
      if (node) node.indeterminate = indeterminate;
      if (typeof forwardedRef === 'function') forwardedRef(node);
      else if (forwardedRef) forwardedRef.current = node;
    };

    const input = (
      <input
        ref={setRefs}
        type="checkbox"
        id={id}
        className={cn(
          'w-4 h-4 rounded border-border text-primary accent-primary cursor-pointer',
          'focus:ring-primary focus:ring-offset-0 transition-colors',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        {...props}
      />
    );

    if (!label) return input;

    return (
      <label htmlFor={id} className="inline-flex items-center gap-2 cursor-pointer select-none">
        {input}
        <span className="text-xs text-foreground">{label}</span>
      </label>
    );
  },
);

Checkbox.displayName = 'Checkbox';

export default Checkbox;
