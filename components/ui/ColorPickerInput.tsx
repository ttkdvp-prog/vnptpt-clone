import React, { useId } from 'react';
import { Pipette } from 'lucide-react';
import { cn } from '@/lib/utils';
import FieldMessages, { useFieldMessageIds } from '@/components/ui/FieldMessages';
import { FORM_CONTROL_BASE, FORM_CONTROL_ERROR } from '@/lib/constants/form-control';

export interface ColorPickerInputProps {
  label?: string;
  error?: string;
  /** Chú thích dưới ô — quy tắc/hệ quả. Không mất khi người dùng nhập. */
  hint?: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  /** `#rrggbb` hoặc `rgb(...)` — mặc định #000000 */
  value?: string;
  onChange: (value: string) => void;
  name?: string;
}

const inputCls = (error?: string) =>
  cn(FORM_CONTROL_BASE, 'font-mono', error ? FORM_CONTROL_ERROR : '');

/**
 * Chọn màu — `type="color"` + ô hex (nhập tay).
 */
const ColorPickerInput: React.FC<ColorPickerInputProps> = ({
  label,
  error,
  hint,
  required,
  disabled,
  className,
  value = '#000000',
  onChange,
  name,
}) => {
  const autoId = useId();
  const textId = `color-txt-${autoId.replace(/:/g, '')}`;
  const { hintId, errorId, describedBy } = useFieldMessageIds(textId, { hint, error });

  const hex = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value.trim()) ? value.trim() : '#000000';

  return (
    <div className={cn('w-full', className)}>
      {label && (
        <label
          htmlFor={textId}
          className="text-xs font-medium leading-none mb-1.5 flex items-center gap-1.5 text-muted-foreground"
        >
          <Pipette className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
          {label}
          {required && <span className="text-destructive" aria-hidden>*</span>}
        </label>
      )}
      <div className="flex gap-2 items-center">
        <input
          type="color"
          name={name ? `${name}_picker` : undefined}
          disabled={disabled}
          value={hex}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-border bg-background p-1',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          aria-label={label ? `${label} — chọn màu` : 'Chọn màu'}
        />
        <input
          id={textId}
          type="text"
          disabled={disabled}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(inputCls(error), 'flex-1 min-w-0')}
        />
      </div>
      <FieldMessages hint={hint} error={error} hintId={hintId} errorId={errorId} />
    </div>
  );
};

export default ColorPickerInput;
