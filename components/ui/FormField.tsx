
import React, { useId } from 'react';
import { cn } from '@/lib/utils';
import FieldMessages, { useFieldMessageIds } from '@/components/ui/FieldMessages';

interface FormFieldProps {
  label?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  /** Chú thích dưới control — quy tắc/hệ quả. Không mất khi người dùng nhập. */
  hint?: React.ReactNode;
  /**
   * @deprecated Dùng `hint`. Tên cũ này render **trên** control nên làm lệch căn hàng
   * của `FormGrid cols={2}`; nay đã gộp vào `hint` (render dưới control).
   */
  description?: string;
}

/**
 * FormField – wrapper chuẩn hoá label + hint + error cho mọi trường form.
 * Dùng khi cần bọc component không có sẵn label (raw textarea, input đặc biệt…).
 */
const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  required,
  children,
  className,
  hint,
  description,
}) => {
  const baseId = useId();
  const resolvedHint = hint ?? description;
  const { hintId, errorId } = useFieldMessageIds(baseId, { hint: resolvedHint, error });

  return (
    <div className={cn('w-full space-y-1.5', className)}>
      {label && (
        <label className="text-xs font-medium leading-none text-muted-foreground block">
          {label}
          {required && <span className="text-destructive ml-0.5 not-italic" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>*</span>}
        </label>
      )}
      {children}
      <FieldMessages hint={resolvedHint} error={error} hintId={hintId} errorId={errorId} />
    </div>
  );
};

export default FormField;
