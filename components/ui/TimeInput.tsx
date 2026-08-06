import React, { useId } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import FieldMessages, { useFieldMessageIds } from '@/components/ui/FieldMessages';
import { FORM_CONTROL_BASE, FORM_CONTROL_ERROR } from '@/lib/constants/form-control';

export interface TimeInputProps {
  label?: string;
  error?: string;
  /** Chú thích dưới ô — quy tắc/hệ quả. Không mất khi người dùng nhập. */
  hint?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  /** HH:mm (24h) hoặc '' */
  value?: string;
  onChange: (value: string) => void;
  name?: string;
}

const inputCls = (error?: string) =>
  cn(FORM_CONTROL_BASE, 'tabular-nums', error ? FORM_CONTROL_ERROR : '');

const TimeInput: React.FC<TimeInputProps> = ({
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
}) => {
  const autoId = useId();
  const inputId = `time-${autoId.replace(/:/g, '')}`;
  const { hintId, errorId, describedBy } = useFieldMessageIds(inputId, { hint, error });

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
        >
          {icon ?? <Clock className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />}
          {label}
          {required && <span className="text-destructive" aria-hidden>*</span>}
        </label>
      )}
      <input
        id={inputId}
        type="time"
        name={name}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={inputCls(error)}
      />
      <FieldMessages hint={hint} error={error} hintId={hintId} errorId={errorId} />
    </div>
  );
};

export default TimeInput;
