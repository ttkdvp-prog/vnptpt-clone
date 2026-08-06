import { formatDate } from '@/lib/utils';
import type { Employee } from '../core/types';

/** Text thuần của 1 ô (không phải JSX) — dùng cho copy hàng (chuột phải) và in danh sách. */
export function getEmployeeCellText(colId: string, item: Employee): string {
  switch (colId) {
    case 'tg_tao': return item.tg_tao ? formatDate(item.tg_tao) : '';
    case 'tg_cap_nhat': return item.tg_cap_nhat ? formatDate(item.tg_cap_nhat) : '';
    default: {
      const value = item[colId as keyof Employee];
      return value == null ? '' : String(value);
    }
  }
}
