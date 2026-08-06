import React, { useId } from 'react';
import { Percent } from 'lucide-react';
import NumericFormatInput from './NumericFormatInput';
import { cn } from '@/lib/utils';
import FieldMessages, { useFieldMessageIds } from '@/components/ui/FieldMessages';

export interface PercentInputProps {
  label?: string;
  error?: string;
  /** Chú thích dưới ô — quy tắc/hệ quả. Không mất khi người dùng nhập. */
  hint?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  /** Giá trị 0–100 (hiển thị kèm %). `null`/`undefined` = để trống — không phải 0. */
  value?: number | null;
  /** `null` khi người dùng xoá trống ô — không phải 0. */
  onChange?: (value: number | null) => void;
  name?: string;
  decimalScale?: number;
  min?: number;
  max?: number;
}

/**
 * Phần trăm — lưu số 0–100, hiển thị suffix % cạnh ô nhập.
 */
const PercentInput: React.FC<PercentInputProps> = ({
  label,
  error,
  hint,
  required,
  disabled,
  className,
  placeholder,
  icon,
  value,
  onChange,
  name,
  decimalScale = 2,
  min = 0,
  max = 100,
}) => {
  const autoId = useId();
  const groupId = `pct-${autoId.replace(/:/g, '')}`;
  const { hintId, errorId } = useFieldMessageIds(groupId, { hint, error });

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label
          htmlFor={groupId}
          className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
        >
          {icon ?? <Percent className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />}
          {label}
          {required && <span className="text-destructive" aria-hidden>*</span>}
        </label>
      )}
      <div className="flex items-center gap-2">
        <NumericFormatInput
          id={groupId}
          label={undefined}
          error={undefined}
          required={false}
          disabled={disabled}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          name={name}
          decimalScale={decimalScale}
          min={min}
          max={max}
          className="flex-1 min-w-0"
        />
        <span className="text-xs text-muted-foreground shrink-0" aria-hidden>
          %
        </span>
      </div>
      <FieldMessages hint={hint} error={error} hintId={hintId} errorId={errorId} />
    </div>
  );
};

export default PercentInput;
