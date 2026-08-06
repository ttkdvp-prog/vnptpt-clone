
import React, { useState, useEffect, useCallback, useId } from 'react';
import { cn, getLocale } from '@/lib/utils';
import FieldMessages, { useFieldMessageIds } from '@/components/ui/FieldMessages';
import { FORM_CONTROL_BASE, FORM_CONTROL_PLACEHOLDER, FORM_CONTROL_ERROR } from '@/lib/constants/form-control';

export interface CurrencyInputProps {
  label?: string;
  error?: string;
  /** Chú thích dưới ô — quy tắc/hệ quả. Không mất khi người dùng nhập. */
  hint?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  suffix?: string;
  icon?: React.ReactNode;
  className?: string;
  /** Giá trị số thực (không format). `null`/`undefined` = để trống — không phải 0. */
  value?: number | string | null;
  /** Callback khi giá trị thay đổi. `null` khi người dùng xoá trống ô — không phải 0. */
  onChange?: (value: number | null) => void;
  /** Tên field cho react-hook-form (dùng với register) */
  name?: string;
}

/**
 * CurrencyInput – trường nhập số tiền có tự động format dấu phân cách hàng nghìn.
 */
const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      label,
      error,
      hint,
      required,
      disabled = false,
      placeholder = '0',
      suffix = 'VND',
      icon,
      className,
      value,
      onChange,
      name,
    },
    ref
  ) => {
    // Format number with dot separator (vi-VN style)
    const formatNumber = useCallback((num: number | string | null | undefined): string => {
      if (num == null) return '';
      const n = typeof num === 'string' ? parseFloat(num) : num;
      if (isNaN(n) || n === 0) return '';
      return new Intl.NumberFormat(getLocale()).format(n);
    }, []);

    const [displayValue, setDisplayValue] = useState(() => formatNumber(value));

    // Sync external value changes
    useEffect(() => {
      const formatted = formatNumber(value);
      queueMicrotask(() => setDisplayValue(formatted));
    }, [value, formatNumber]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      // Only allow digits, dots and commas
      const cleaned = raw.replace(/[^\d]/g, '');
      if (cleaned === '') {
        // Để trống là để trống — không phải 0 (trước đây `parseFloat('') || 0`
        // luôn gọi onChange(0), nên xoá ô tiền lưu ra 0 thay vì null).
        setDisplayValue('');
        onChange?.(null);
        return;
      }
      const num = parseFloat(cleaned) || 0;
      setDisplayValue(num === 0 ? '' : new Intl.NumberFormat(getLocale()).format(num));
      onChange?.(num);
    };

    const autoId = useId();
    const inputId = `currency-${autoId.replace(/:/g, '')}`;
    const { hintId, errorId, describedBy } = useFieldMessageIds(inputId, { hint, error });

    return (
      <div className="w-full">
        {label && (
          <label className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-2 flex items-center gap-1.5 text-muted-foreground">
            {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
            {label}
            {required && <span className="text-destructive ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            type="text"
            inputMode="numeric"
            name={name}
            disabled={disabled}
            id={inputId}
            placeholder={placeholder}
            value={displayValue}
            onChange={handleChange}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              FORM_CONTROL_BASE,
              'transition-colors',
              FORM_CONTROL_PLACEHOLDER,
              icon ? 'pl-10' : 'pl-3',
              suffix ? 'pr-14' : 'pr-3',
              error ? FORM_CONTROL_ERROR : '',
              className
            )}
          />
          {suffix && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium pointer-events-none select-none">
              {suffix}
            </div>
          )}
        </div>
        <FieldMessages hint={hint} error={error} hintId={hintId} errorId={errorId} />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';

export default CurrencyInput;
