/**
 * Lucide / icon size scale — Design System (Phase D2).
 * Prefer these over ad-hoc size={11|13|15}.
 */

export const ICON_SIZE = {
  /** 12px — DetailField label, dense table, checkbox marks */
  micro: 12,
  /** 14px — FormSection / DetailSection title, toolbar filters, compact actions */
  compact: 14,
  /** 16px — default action, list toolbar */
  default: 16,
  /** 20px — GenericDrawer header, dialog close, empty accent */
  prominent: 20,
  /** 24px — feature empty / confirm icon well */
  feature: 24,
} as const;

export type IconSizeToken = keyof typeof ICON_SIZE;

/** Tailwind w/h pairs matching ICON_SIZE (for className on Lucide or wrappers). */
export const ICON_CLASS = {
  micro: 'h-3 w-3',
  compact: 'h-3.5 w-3.5',
  default: 'h-4 w-4',
  prominent: 'h-5 w-5',
  feature: 'h-6 w-6',
} as const;
