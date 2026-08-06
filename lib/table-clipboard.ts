import type { ColumnConfig } from '@/store/createGenericStore';

/**
 * Chuyển 1 hàng thành chuỗi TSV (Tab-separated) — dán thẳng được vào Excel/Sheets.
 * `getCellText` nhận `(colId, item)` trả về text hiển thị của ô (không phải JSX).
 */
export function rowToTsv<T>(
  columns: ColumnConfig[],
  item: T,
  getCellText: (colId: string, item: T) => string
): string {
  return columns
    .filter((c) => c.visible && c.id !== 'actions')
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((c) => getCellText(c.id, item).replace(/\t/g, ' ').replace(/\n/g, ' '))
    .join('\t');
}
