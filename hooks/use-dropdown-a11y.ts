import { useEffect, useRef } from 'react';

interface UseDropdownA11yOptions {
  open: boolean;
  onClose: () => void;
  /** Container chứa nội dung dropdown (để trap Tab + tìm phần tử focusable đầu tiên). */
  containerRef: React.RefObject<HTMLElement | null>;
}

/**
 * Focus-trap + Escape-to-close + trả focus về phần tử đã kích hoạt dropdown khi đóng —
 * theo đúng pattern đã có ở `components/shared/AppDialog.tsx`, dùng chung cho các
 * popover/dropdown khác (ColumnManager, SavedViewsManager...) vốn trước đây chỉ có
 * click-outside, thiếu Escape/focus trap/return-focus.
 */
export function useDropdownA11y({ open, onClose, containerRef }: UseDropdownA11yOptions): void {
  const onCloseRef = useRef(onClose);
  const triggerElRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    triggerElRef.current = document.activeElement as HTMLElement | null;

    const focusable = () =>
      containerRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
    const first = focusable()?.[0];
    first?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      if (e.key === 'Tab') {
        const items = focusable();
        if (!items || items.length === 0) return;
        const firstItem = items[0];
        const lastItem = items[items.length - 1];
        if (e.shiftKey && document.activeElement === firstItem) {
          e.preventDefault();
          lastItem.focus();
        } else if (!e.shiftKey && document.activeElement === lastItem) {
          e.preventDefault();
          firstItem.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      triggerElRef.current?.focus();
    };
  }, [open, containerRef]);
}
