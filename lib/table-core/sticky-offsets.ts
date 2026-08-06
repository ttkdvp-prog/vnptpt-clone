import { resolveColumnWidth, type ColumnConfig } from '@/store/createGenericStore';

/**
 * Tính left-offset tích lũy (px) cho `stickyLeftCount` cột đầu tiên (sau cột checkbox),
 * theo đúng thuật toán GenericTable đã dùng đúng — dùng chung để StatsDataGrid không
 * còn tự gắn `left-0` thô cho mọi cột `sticky:true` (chỉ đúng khi có tối đa 1 cột ghim).
 */
export function computeStickyOffsets(
  columns: Pick<ColumnConfig, 'width' | 'defaultWidth' | 'minWidth'>[],
  stickyLeftCount: number,
  leftStart: number,
  defaultMinWidth: number
): number[] {
  const offsets: number[] = [];
  let acc = leftStart;
  for (let i = 0; i < stickyLeftCount && i < columns.length; i++) {
    offsets.push(acc);
    acc += resolveColumnWidth(columns[i], defaultMinWidth);
  }
  return offsets;
}
