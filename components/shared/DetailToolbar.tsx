import React from 'react';
import { cn } from '@/lib/utils';
import { ICON_SIZE } from '@/lib/icon-sizes';

export interface DetailToolbarAction {
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    variant?: 'default' | 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'warning' | 'info' | 'violet';
    disabled?: boolean;
}

interface DetailToolbarProps {
    actions: DetailToolbarAction[];
    /** Số cột: 2 cho sidebar hẹp, mặc định 3 (mobile) / 6 (desktop) */
    columns?: 2 | 3 | 6;
    className?: string;
}

const VARIANT_ICON: Record<string, string> = {
    primary: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground',
    danger: 'bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive hover:text-destructive-foreground',
    success: 'bg-success/10 text-success border-success/20 hover:bg-success hover:text-success-foreground',
    warning: 'bg-warning/10 text-warning border-warning/20 hover:bg-warning hover:text-warning-foreground',
    info: 'bg-info/10 text-info border-info/20 hover:bg-info hover:text-info-foreground',
    violet: 'bg-primary/10 text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground',
    secondary: 'bg-muted text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground',
    ghost: 'bg-transparent text-muted-foreground border-transparent hover:bg-muted',
    default: 'bg-muted/80 text-muted-foreground border-border hover:bg-muted hover:text-foreground',
};

const VARIANT_LABEL: Record<string, string> = {
    primary: 'text-primary',
    danger: 'text-destructive',
    success: 'text-success',
    warning: 'text-warning',
    info: 'text-info',
    violet: 'text-primary',
    secondary: 'text-muted-foreground',
    ghost: 'text-muted-foreground',
    default: 'text-muted-foreground',
};

/**
 * Toolbar hiển thị các hành động trong màn detail
 * Action được thiết kế hình tròn với text ở dưới
 */
const DetailToolbar: React.FC<DetailToolbarProps> = ({ actions, columns, className }) => {
    if (!actions || actions.length === 0) return null;

    const gridColsClass =
        columns === 2 ? "grid-cols-2" :
        columns === 6 ? "grid-cols-3 sm:grid-cols-6" :
        "grid-cols-3 sm:grid-cols-6";

    return (
        <div className={cn("grid gap-3 p-3.5 min-w-0", gridColsClass, className)}>
            {actions.map((action, index) => {
                const variant = action.variant ?? 'default';
                return (
                <button
                    key={index}
                    type="button"
                    onClick={action.onClick}
                    disabled={action.disabled}
                    className={cn(
                        "flex flex-col items-center gap-1.5 transition-[transform,colors] duration-150 outline-none min-w-0 w-full",
                        action.disabled ? "opacity-40 cursor-not-allowed" : "hover:-translate-y-0.5 active:scale-95"
                    )}
                >
                    <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-[transform,colors,background-color,border-color] duration-150 shadow-sm border",
                        VARIANT_ICON[variant] ?? VARIANT_ICON.default,
                    )}>
                        {React.isValidElement(action.icon)
                            ? React.cloneElement(
                                action.icon as React.ReactElement<{ size?: number; strokeWidth?: number }>,
                                { size: ICON_SIZE.default, strokeWidth: 2 },
                              )
                            : action.icon}
                    </div>
                    <span className={cn(
                        "text-xs font-medium text-center transition-colors break-words w-full px-1 leading-tight",
                        VARIANT_LABEL[variant] ?? VARIANT_LABEL.default,
                    )}>
                        {action.label}
                    </span>
                </button>
                );
            })}
        </div>
    );
};

export default DetailToolbar;
