/** Postgres Int[]/String[] columns → 1 cell, comma-joined (không có kiểu mảng thật trong Sheets). */

export function encodeArray(values: Array<string | number> | null | undefined): string {
  if (!values || values.length === 0) return '';
  return values.join(',');
}

export function decodeArrayNumber(cell: string | null | undefined): number[] {
  if (!cell) return [];
  return cell
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

export function decodeArrayString(cell: string | null | undefined): string[] {
  if (!cell) return [];
  return cell
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}
