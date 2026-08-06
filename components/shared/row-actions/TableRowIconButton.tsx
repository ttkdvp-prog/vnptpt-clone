import React, { forwardRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export type TableRowIconButtonVariant = 'primary' | 'muted' | 'danger';
/** `touch` — mobile list card (~44px hit target). `compact` — dense desktop/hierarchy. */
export type TableRowIconButtonSize = 'compact' | 'default' | 'touch';

export interface TableRowIconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  icon: LucideIcon;
  label: string;
  size?: TableRowIconButtonSize;
  variant?: TableRowIconButtonVariant;
  iconSize?: number;
  iconStrokeWidth?: number;
}

const sizeClass: Record<TableRowIconButtonSize, string> = {
  compact: 'h-6 w-6 inline-flex items-center justify-center rounded transition-all',
  default: 'p-1.5 rounded-md transition-all',
  touch:
    'h-10 w-10 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg transition-all active:scale-95',
};

const defaultIconSize: Record<TableRowIconButtonSize, number> = {
  compact: 12,
  default: 15,
  touch: 18,
};

const variantClass: Record<TableRowIconButtonVariant, string> = {
  primary: 'text-primary hover:bg-primary/10',
  muted: 'text-muted-foreground hover:text-foreground hover:bg-muted',
  danger: 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30',
};

export const TableRowIconButton = forwardRef<HTMLButtonElement, TableRowIconButtonProps>(
  function TableRowIconButton(
    {
      icon: Icon,
      label,
      size = 'default',
      variant = 'primary',
      iconSize,
      iconStrokeWidth = 2.25,
      className,
      type = 'button',
      onClick,
      ...rest
    },
    ref,
  ) {
    const resolvedIconSize = iconSize ?? defaultIconSize[size];

    return (
      <button
        ref={ref}
        type={type}
        title={label}
        aria-label={label}
        className={cn(sizeClass[size], variantClass[variant], className)}
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(e);
        }}
        {...rest}
      >
        <Icon size={resolvedIconSize} strokeWidth={iconStrokeWidth} />
      </button>
    );
  },
);
