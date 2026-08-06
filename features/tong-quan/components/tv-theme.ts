/** Live TV visual tokens — dark ERP, aligned with 5F radius + primary */

export type TvToneId = 'primary' | 'success' | 'info' | 'warning' | 'muted';

export interface TvToneStyle {
  value: string;
  iconBg: string;
  iconFg: string;
  bar: string;
}

export const TV_TONES: Record<TvToneId, TvToneStyle> = {
  primary: {
    value: 'text-primary',
    iconBg: 'bg-primary/15',
    iconFg: 'text-primary',
    bar: 'bg-primary',
  },
  success: {
    value: 'text-success',
    iconBg: 'bg-success/15',
    iconFg: 'text-success',
    bar: 'bg-success',
  },
  info: {
    value: 'text-info',
    iconBg: 'bg-info/15',
    iconFg: 'text-info',
    bar: 'bg-info',
  },
  warning: {
    value: 'text-warning',
    iconBg: 'bg-warning/15',
    iconFg: 'text-warning',
    bar: 'bg-warning',
  },
  muted: {
    value: 'text-white/90',
    iconBg: 'bg-white/[0.06]',
    iconFg: 'text-white/60',
    bar: 'bg-white/40',
  },
};

/** Card / panel — rounded-xl per design system */
export const TV_SURFACE =
  'relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] shadow-sm';

/** Chip / control — rounded-lg */
export const TV_CHIP =
  'rounded-lg border border-white/10 bg-white/[0.05]';
