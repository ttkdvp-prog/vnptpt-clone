import React, { useState, useEffect, useCallback, useId } from 'react';
import { cn, getLocale } from '@/lib/utils';
import FieldMessages, { useFieldMessageIds } from '@/components/ui/FieldMessages';
import { FORM_CONTROL_BASE, FORM_CONTROL_PLACEHOLDER, FORM_CONTROL_ERROR } from '@/lib/constants/form-control';

export interface NumericFormatInputProps {
  label?: string;
  error?: string;
  /** Chú thích dưới ô — quy tắc/hệ quả. Không mất khi người dùng nhập. */
  hint?: React.ReactNode;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  /** Icon hiển thị cạnh label (chuẩn form như module nhân viên) */
  icon?: React.ReactNode;
  /** Hiển thị dấu sao (*) cho trường bắt buộc */
  required?: boolean;
  /** Giá trị số (có thể có phần thập phân). `null`/`undefined` = để trống — không phải 0. */
  value?: number | string | null;
  /** Callback khi giá trị thay đổi. `null` khi người dùng xoá trống ô — không phải 0. */
  onChange?: (value: number | null) => void;
  /** Alias cho onChange, nhận (formattedValue, numberValue) - tương thích react-number-format */
  onValueChange?: (_formatted: string, values: { floatValue?: number }) => void;
  onBlur?: () => void;
  name?: string;
  /** Số chữ số thập phân tối đa khi hiển thị (mặc định 2) */
  decimalScale?: number;
  min?: number;
  max?: number;
  /** Gắn id cho `<input>` (vd. label ngoài bọc PercentInput) */
  id?: string;
}

/**
 * NumericFormatInput – nhập số có tự động format dấu phân cách hàng nghìn (vi-VN: 120.000).
 */
const NumericFormatInput = React.forwardRef<HTMLInputElement, NumericFormatInputProps>(
  (
    {
      label,
      error,
      disabled = false,
      placeholder = '0',
      className,
      icon,
      required,
      value,
      onChange,
      onValueChange,
      onBlur,
      name,
      decimalScale = 2,
      min,
      max,
      id: idProp,
      hint,
    },
    ref
  ) => {
    const autoId = useId();
    const inputId = idProp ?? `numeric-${autoId.replace(/:/g, '')}`;
    const { hintId, errorId, describedBy } = useFieldMessageIds(inputId, { hint, error });
    const formatNumber = useCallback(
      (num: number | string | null | undefined): string => {
        if (num == null) return '';
        const n = typeof num === 'string' ? parseFloat(num) : num;
        if (isNaN(n)) return '';
        if (n === 0) return '';
        const formatted = new Intl.NumberFormat(getLocale(), {
          minimumFractionDigits: 0,
          maximumFractionDigits: decimalScale,
        }).format(n);
        return formatted;
      },
      [decimalScale]
    );

    /** Parse chuỗi đã format (vi-VN: "120.000" hoặc "120.000,5") hoặc số thuần (120000). */
    const parseInput = useCallback((str: string): number => {
      const s = str.trim();
      if (!s) return 0;
      const noThousand = s.replace(/\./g, '');
      const decimal = noThousand.replace(/,/g, '.');
      const num = parseFloat(decimal);
      return isNaN(num) ? 0 : num;
    }, []);

    const [displayValue, setDisplayValue] = useState(() => formatNumber(value));

    useEffect(() => {
      const formatted = formatNumber(value);
      queueMicrotask(() => setDisplayValue(formatted));
    }, [value, formatNumber]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      if (raw === '') {
        // Để trống là để trống — không phải 0. Trước đây parseInput('') trả 0
        // và onChange(0) luôn được gọi, nên xoá một ô số lưu ra 0 thay vì null.
        setDisplayValue('');
        onChange?.(null);
        onValueChange?.('', { floatValue: undefined });
        return;
      }
      const num = parseInput(raw);
      const clamped = max != null && num > max ? max : min != null && num < min ? min : num;
      setDisplayValue(formatNumber(clamped));
      onChange?.(clamped);
      onValueChange?.(formatNumber(clamped), { floatValue: clamped });
    };

    const handleBlur = () => {
      if (displayValue === '') {
        onBlur?.();
        return;
      }
      const num = parseInput(displayValue);
      const clamped = max != null && num > max ? max : min != null && num < min ? min : num;
      setDisplayValue(num === 0 || isNaN(num) ? '' : formatNumber(clamped));
      if (num !== clamped) {
        onChange?.(clamped);
        onValueChange?.('', { floatValue: clamped });
      }
      onBlur?.();
    };

    const inputEl = (
      <input
        ref={ref}
        id={inputId}
        type="text"
        inputMode="decimal"
        name={name}
        disabled={disabled}
        placeholder={placeholder}
        value={displayValue}
        onChange={handleChange}
        onBlur={handleBlur}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          FORM_CONTROL_BASE,
          'tabular-nums transition-colors',
          FORM_CONTROL_PLACEHOLDER,
          error ? FORM_CONTROL_ERROR : '',
          className
        )}
      />
    );

    if (label) {
      return (
        <div className="w-full">
          <label htmlFor={inputId} className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1.5 flex items-center gap-1.5 text-muted-foreground">
            {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
            {label}
            {required && <span className="text-destructive" aria-hidden="true">*</span>}
          </label>
          {inputEl}
          <FieldMessages hint={hint} error={error} hintId={hintId} errorId={errorId} />
        </div>
      );
    }

    return (
      <div className="w-full">
        {inputEl}
        <FieldMessages hint={hint} error={error} hintId={hintId} errorId={errorId} />
      </div>
    );
  }
);

NumericFormatInput.displayName = 'NumericFormatInput';

export default NumericFormatInput;
