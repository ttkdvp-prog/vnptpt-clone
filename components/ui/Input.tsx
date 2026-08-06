import React, { useId } from 'react';
import { cn } from '@/lib/utils';
import FieldMessages, { useFieldMessageIds } from '@/components/ui/FieldMessages';
import { FORM_CONTROL_BASE, FORM_CONTROL_PLACEHOLDER, FORM_CONTROL_ERROR } from '@/lib/constants/form-control';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  required?: boolean;
  /** Chú thích dưới ô — quy tắc/hệ quả. Khác `placeholder` ở chỗ không mất khi gõ. */
  hint?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, icon, required, hint, id: externalId, ...props }, ref) => {
    const autoId = useId();
    const inputId = externalId || autoId;
    const { hintId, errorId, describedBy } = useFieldMessageIds(inputId, { hint, error });

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 mb-1.5 flex items-center gap-1.5 text-muted-foreground">
            {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
            {label}
            {required && <span className="text-destructive font-sans not-italic" aria-hidden="true" style={{ fontFamily: 'Arial, Helvetica, sans-serif' }}>*</span>}
          </label>
        )}
        <div className="relative">
          <input
            id={inputId}
            type={type}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={cn(
              FORM_CONTROL_BASE,
              'file:border-0 file:bg-transparent file:text-xs file:font-medium',
              FORM_CONTROL_PLACEHOLDER,
              error ? FORM_CONTROL_ERROR : '',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        <FieldMessages hint={hint} error={error} hintId={hintId} errorId={errorId} />
      </div>
    );
  }
);
Input.displayName = "Input";

export default Input;
