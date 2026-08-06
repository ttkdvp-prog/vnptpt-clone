
import React, { useCallback, useEffect, useId, useRef } from 'react';
import { cn } from '@/lib/utils';
import FieldMessages, { useFieldMessageIds } from '@/components/ui/FieldMessages';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  required?: boolean;
  icon?: React.ReactNode;
  /** Chú thích dưới ô — quy tắc/hệ quả. Khác `placeholder` ở chỗ không mất khi gõ. */
  hint?: React.ReactNode;
  /**
   * Tự mở rộng chiều cao theo nội dung (mặc định true).
   * Khi false: giữ `min-h` cố định, vẫn `resize-none`.
   */
  autoGrow?: boolean;
  /** Chiều cao tối thiểu khi autoGrow (px). Mặc định 100. */
  minHeightPx?: number;
  /** Chiều cao tối đa khi autoGrow (px). Mặc định 320 — sau đó cuộn nội bộ. */
  maxHeightPx?: number;
}

/**
 * Textarea – trường nhập nội dung dài, chuẩn hoá style với Input/Combobox.
 * Mặc định auto-grow theo nội dung (mô tả / ghi chú nhiều dòng).
 */
const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      className,
      label,
      error,
      required,
      icon,
      hint,
      id: externalId,
      autoGrow = true,
      minHeightPx = 100,
      maxHeightPx = 320,
      onChange,
      value,
      defaultValue,
      style,
      ...props
    },
    ref,
  ) => {
    const autoId = useId();
    const textareaId = externalId || autoId;
    const { hintId, errorId, describedBy } = useFieldMessageIds(textareaId, { hint, error });
    const innerRef = useRef<HTMLTextAreaElement | null>(null);

    const setRefs = useCallback(
      (node: HTMLTextAreaElement | null) => {
        innerRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      },
      [ref],
    );

    const applyGrow = useCallback(
      (el: HTMLTextAreaElement) => {
        if (!autoGrow) return;
        el.style.height = 'auto';
        const next = Math.min(Math.max(el.scrollHeight, minHeightPx), maxHeightPx);
        el.style.height = `${next}px`;
        el.style.overflowY = el.scrollHeight > maxHeightPx ? 'auto' : 'hidden';
      },
      [autoGrow, minHeightPx, maxHeightPx],
    );

    useEffect(() => {
      if (innerRef.current) applyGrow(innerRef.current);
    }, [applyGrow, value, defaultValue]);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 flex items-center gap-1.5 text-muted-foreground"
          >
            {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
            {label}
            {required && (
              <span className="text-destructive" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <textarea
          id={textareaId}
          ref={setRefs}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          value={value}
          defaultValue={defaultValue}
          onChange={(e) => {
            onChange?.(e);
            applyGrow(e.currentTarget);
          }}
          className={cn(
            'flex w-full rounded-lg border border-border bg-background px-3 py-2.5 text-xs text-foreground ring-offset-background placeholder:text-placeholder placeholder:italic transition-colors resize-none',
            !autoGrow && 'min-h-[100px]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            error ? 'border-destructive focus-visible:ring-destructive' : '',
            className,
          )}
          {...props}
          style={
            autoGrow
              ? { minHeight: minHeightPx, overflowY: 'hidden', ...style }
              : style
          }
        />
        <FieldMessages hint={hint} error={error} hintId={hintId} errorId={errorId} />
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

export default Textarea;
