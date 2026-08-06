import React, { useId } from 'react';
import { CalendarRange } from 'lucide-react';
import { cn } from '@/lib/utils';
import FieldMessages, { useFieldMessageIds } from '@/components/ui/FieldMessages';
import { FORM_CONTROL_BASE, FORM_CONTROL_ERROR } from '@/lib/constants/form-control';

export interface MonthYearPickerProps {
  label?: string;
  error?: string;
  /** Chú thích dưới ô — quy tắc/hệ quả. Không mất khi người dùng nhập. */
  hint?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  /**
   * Tháng-năm: `YYYY-MM` (khớp `<input type="month">`).
   * Chỉ năm: đặt `yearOnly` — value là `YYYY` (four digits string).
   */
  value?: string;
  onChange: (value: string) => void;
  name?: string;
  /** Chỉ chọn năm (input number), không dùng type="month" */
  yearOnly?: boolean;
  minYear?: number;
  maxYear?: number;
}

const inputCls = (error?: string) =>
  cn(FORM_CONTROL_BASE, 'tabular-nums', error ? FORM_CONTROL_ERROR : '');

const MonthYearPicker: React.FC<MonthYearPickerProps> = ({
  label,
  error,
  hint,
  required,
  disabled,
  className,
  icon,
  value = '',
  onChange,
  name,
  yearOnly = false,
  minYear = 1990,
  maxYear = 2100,
}) => {
  const autoId = useId();
  const inputId = `my-${autoId.replace(/:/g, '')}`;
  const { hintId, errorId, describedBy } = useFieldMessageIds(inputId, { hint, error });

  const yearNum = yearOnly ? (value ? parseInt(value, 10) : '') : '';

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
        >
          {icon ?? <CalendarRange className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />}
          {label}
          {required && <span className="text-destructive" aria-hidden>*</span>}
        </label>
      )}
      {yearOnly ? (
        <input
          id={inputId}
          type="number"
          name={name}
          disabled={disabled}
          value={yearNum === '' ? '' : yearNum}
          min={minYear}
          max={maxYear}
          step={1}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === '' ? '' : String(parseInt(v, 10)));
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={inputCls(error)}
        />
      ) : (
        <input
          id={inputId}
          type="month"
          name={name}
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={inputCls(error)}
        />
      )}
      <FieldMessages hint={hint} error={error} hintId={hintId} errorId={errorId} />
    </div>
  );
};

export default MonthYearPicker;
