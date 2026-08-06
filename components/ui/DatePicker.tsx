import React, { useId } from 'react';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import FieldMessages, { useFieldMessageIds } from '@/components/ui/FieldMessages';
import { FORM_CONTROL_BASE, FORM_CONTROL_ERROR } from '@/lib/constants/form-control';

export interface DatePickerProps {
  label?: string;
  error?: string;
  /** Chú thích dưới ô — quy tắc/hệ quả. Không mất khi người dùng nhập. */
  hint?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  /** YYYY-MM-DD hoặc '' */
  value?: string;
  onChange: (value: string) => void;
  name?: string;
  min?: string;
  max?: string;
}

const inputCls = (error?: string) =>
  cn(FORM_CONTROL_BASE, 'tabular-nums', error ? FORM_CONTROL_ERROR : '');

/**
 * Chọn một ngày — giá trị ISO ngày `YYYY-MM-DD` (khớp `<input type="date">`).
 */
const DatePicker: React.FC<DatePickerProps> = ({
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
  min,
  max,
}) => {
  const autoId = useId();
  const inputId = `date-${autoId.replace(/:/g, '')}`;
  const { hintId, errorId, describedBy } = useFieldMessageIds(inputId, { hint, error });

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1.5 flex items-center gap-1.5 text-muted-foreground"
        >
          {icon ?? <Calendar className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />}
          {label}
          {required && <span className="text-destructive" aria-hidden>*</span>}
        </label>
      )}
      <input
        id={inputId}
        type="date"
        name={name}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={inputCls(error)}
      />
      <FieldMessages hint={hint} error={error} hintId={hintId} errorId={errorId} />
    </div>
  );
};

export default DatePicker;
