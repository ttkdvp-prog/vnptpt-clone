export const NGUOI_LIEN_HE_SEARCHABLE_KEYS = [
  'ho_ten',
  'chuc_vu',
  'so_dien_thoai',
  'email',
  'dia_chi',
  'ghi_chu',
  'ten_khach_hang',
  'ma_khach_hang',
  'ten_nguoi_tao',
] as const;

/** Hiển thị ngày sinh: YYYY hoặc YYYY-MM-DD. */
export function formatNgaySinh(value: string | null | undefined): string {
  if (!value) return '—';
  if (/^\d{4}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-');
    return `${d}/${m}/${y}`;
  }
  return value;
}

export function isYearOnlyNgaySinh(value: string | null | undefined): boolean {
  return !!value && /^\d{4}$/.test(value);
}
