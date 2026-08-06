import { useState, type ReactNode } from 'react';
import { Controller, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { txt } from '@/lib/text';
import DatePicker from '@/components/ui/DatePicker';
import MonthYearPicker from '@/components/ui/MonthYearPicker';
import { cn } from '@/lib/utils';
import { isYearOnlyNgaySinh } from '../utils/search-keys';

interface Props<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  icon?: ReactNode;
  className?: string;
}

/** Toggle ngày đầy đủ ↔ chỉ năm cho trường ngay_sinh. */
export function NgaySinhField<T extends FieldValues>({ control, name, icon, className }: Props<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <NgaySinhInput
          className={className}
          icon={icon}
          value={(field.value as string | null | undefined) ?? null}
          onChange={(v) => field.onChange(v)}
          error={fieldState.error?.message}
        />
      )}
    />
  );
}

function NgaySinhInput({
  value,
  onChange,
  error,
  icon,
  className,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
  error?: string;
  icon?: ReactNode;
  className?: string;
}) {
  const [yearOnly, setYearOnly] = useState(() => isYearOnlyNgaySinh(value));
  const display = value ?? '';

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
          {txt('contact.form.birthDate')}
        </span>
        <button
          type="button"
          className="text-xs font-medium text-primary hover:underline"
          onClick={() => {
            const next = !yearOnly;
            setYearOnly(next);
            if (next) {
              const year = display.slice(0, 4);
              onChange(/^\d{4}/.test(year) ? year : null);
            } else if (/^\d{4}$/.test(display)) {
              onChange(null);
            }
          }}
        >
          {yearOnly ? txt('contact.form.birthFullDate') : txt('contact.form.birthYearOnly')}
        </button>
      </div>
      {yearOnly ? (
        <MonthYearPicker
          yearOnly
          value={display}
          onChange={(v) => onChange(v || null)}
          error={error}
          minYear={1900}
          maxYear={new Date().getFullYear()}
        />
      ) : (
        <DatePicker
          value={display}
          onChange={(v) => onChange(v || null)}
          error={error}
        />
      )}
    </div>
  );
}
