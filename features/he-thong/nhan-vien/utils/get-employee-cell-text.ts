import type { Employee } from '../core/types';

/** Text thuần của 1 ô (không phải JSX) — dùng cho copy hàng (chuột phải) và in danh sách. */
export function getEmployeeCellText(colId: string, item: Employee): string {
  const value = item[colId as keyof Employee];
  return value == null ? '' : String(value);
}
