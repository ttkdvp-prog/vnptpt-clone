/**
 * Entity types for this module.
 * Replace `TemplateEntity` with the real name after copying `_template`.
 */
export interface TemplateEntity {
  id: string;
  /** Add business fields here */
  tg_tao?: string;
  tg_cap_nhat?: string;
  nguoi_tao?: string | null;
}

export interface TemplateFilters {
  columnSearch: Record<string, string>;
}
