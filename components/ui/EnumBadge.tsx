import React from 'react';
import { cn } from '@/lib/utils';

/* ------------------------------------------------------------------ */
/*  Color palette – semantic tokens + legacy aliases (D2)             */
/* ------------------------------------------------------------------ */

const SEMANTIC_COLOR_CLASSES = {
  primary: 'bg-primary/10 text-primary border-primary/20',
  success:
    'bg-success/10 text-success border-success/20 dark:bg-success/15 dark:text-success dark:border-success/30',
  warning:
    'bg-warning/10 text-warning border-warning/20 dark:bg-warning/15 dark:text-warning dark:border-warning/30',
  info: 'bg-info/10 text-info border-info/20 dark:bg-info/15 dark:text-info dark:border-info/30',
  destructive:
    'bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/15 dark:text-destructive dark:border-destructive/30',
  slate: 'bg-muted text-muted-foreground border-border',
} as const;

/** Legacy Tailwind palette names → semantic (backward compatible). */
const LEGACY_COLOR_ALIASES: Record<string, keyof typeof SEMANTIC_COLOR_CLASSES> = {
  emerald: 'success',
  amber: 'warning',
  sky: 'info',
  rose: 'destructive',
  blue: 'info',
  indigo: 'primary',
  pink: 'destructive',
  violet: 'primary',
  cyan: 'info',
};

const COLOR_CLASSES: Record<string, string> = {
  ...SEMANTIC_COLOR_CLASSES,
  // Keep legacy keys resolving to same class strings as semantic
  emerald: SEMANTIC_COLOR_CLASSES.success,
  amber: SEMANTIC_COLOR_CLASSES.warning,
  sky: SEMANTIC_COLOR_CLASSES.info,
  rose: SEMANTIC_COLOR_CLASSES.destructive,
  blue: SEMANTIC_COLOR_CLASSES.info,
  indigo: SEMANTIC_COLOR_CLASSES.primary,
  pink: SEMANTIC_COLOR_CLASSES.destructive,
  violet: SEMANTIC_COLOR_CLASSES.primary,
  cyan: SEMANTIC_COLOR_CLASSES.info,
};

export type BadgeColor = keyof typeof COLOR_CLASSES;

/* ------------------------------------------------------------------ */
/*  Config type – dùng khi khai báo badge config cho từng enum         */
/* ------------------------------------------------------------------ */

export interface BadgeConfigItem {
  label: string;
  color: BadgeColor;
  icon?: React.ReactNode;
}

export type BadgeConfig<T extends string | number = string | number> = Record<T, BadgeConfigItem>;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export type EnumBadgeShape = 'pill' | 'rounded';

export interface EnumBadgeProps {
  /** Giá trị enum hiện tại */
  value: string | number | undefined | null;
  /** Config map: value → { label, color, icon? } */
  config: BadgeConfig<string | number>;
  /** Label hiển thị khi value không có trong config */
  fallbackLabel?: string;
  /** Class bổ sung */
  className?: string;
  /**
   * `pill` — viền tròn (rounded-full), phù hợp trạng thái.
   * `rounded` — viền vuông nhẹ (rounded-lg), phù hợp cấp/level.
   */
  shape?: EnumBadgeShape;
  /**
   * Một dòng trong ô bảng hẹp: không xuống dòng; quá dài thì ellipsis (…).
   * Nên bật trong cell có maxWidth; kèm `title` để xem đủ khi hover.
   */
  truncate?: boolean;
  /** Cho phép label xuống dòng thay vì ellipsis/tràn — dùng khi cột hẹp nhưng không muốn mất chữ. Bỏ qua `truncate` nếu cả hai cùng bật. */
  wrap?: boolean;
}

/**
 * EnumBadge – badge tái sử dụng cho mọi trường enum.
 * Mặc định pill (rounded-full); `shape="rounded"` cho badge dạng ô vuông nhẹ.
 */
const EnumBadge: React.FC<EnumBadgeProps> = ({
  value,
  config,
  fallbackLabel = '—',
  className,
  shape = 'pill',
  truncate = false,
  wrap = false,
}) => {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const item = config[value];
  const label = item?.label ?? fallbackLabel;
  const rawColor = item?.color;
  const resolved =
    rawColor && LEGACY_COLOR_ALIASES[rawColor]
      ? LEGACY_COLOR_ALIASES[rawColor]
      : (rawColor as keyof typeof SEMANTIC_COLOR_CLASSES | undefined);
  const colorClasses =
    (rawColor && COLOR_CLASSES[rawColor]) ||
    (resolved && SEMANTIC_COLOR_CLASSES[resolved]) ||
    COLOR_CLASSES.slate;
  const labelStr = String(label);

  return (
    <span
      title={truncate && !wrap ? labelStr : undefined}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium border transition-colors',
        shape === 'pill' ? 'rounded-full' : 'rounded-lg',
        truncate && !wrap && 'max-w-full min-w-0',
        colorClasses,
        className,
      )}
    >
      {item?.icon != null && <span className="shrink-0">{item.icon}</span>}
      {/* whitespace-nowrap: badge luôn 1 dòng — cột hẹp thì truncate/ellipsis, không xuống dòng. `wrap` bỏ qua để không mất chữ. */}
      <span className={cn(wrap ? 'whitespace-normal break-words' : 'whitespace-nowrap', truncate && !wrap && 'min-w-0 truncate')}>
        {labelStr}
      </span>
    </span>
  );
};

export default EnumBadge;
