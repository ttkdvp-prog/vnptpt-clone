import { formatDateForInput } from '@/lib/utils';
import { isAllStatsDateRange } from '@/lib/stats-date-range';
import { getDateRangeFromPreset } from '@/features/he-thong/nhan-vien/utils/stats-date-range';
import type { DateRangePresetId } from '@/features/hanh-chinh/thong-ke-phieu-hanh-chinh/core/stats-constants';

function toDateOnly(value: string | Date | null | undefined): string {
  if (value == null || value === '') return '';
  if (typeof value === 'string') return value.slice(0, 10);
  return formatDateForInput(value);
}

/**
 * True when phiếu period [tu_ngay, den_ngay] overlaps [filterStart, filterEnd]
 * (inclusive, date-only YYYY-MM-DD).
 */
export function phieuOverlapsDateRange(
  tuNgay: string,
  denNgay: string,
  filterStart: string,
  filterEnd: string,
): boolean {
  const from = toDateOnly(tuNgay);
  const to = toDateOnly(denNgay);
  if (!from || !to || !filterStart || !filterEnd) return false;
  return from <= filterEnd && to >= filterStart;
}

export function matchesPhieuDateFilter(
  tuNgay: string,
  denNgay: string,
  datePreset: string,
  customStart: string,
  customEnd: string,
): boolean {
  if (isAllStatsDateRange(datePreset)) return true;

  const range = getDateRangeFromPreset(
    datePreset as DateRangePresetId,
    customStart ? new Date(customStart) : undefined,
    customEnd ? new Date(customEnd) : undefined,
  );
  return phieuOverlapsDateRange(
    tuNgay,
    denNgay,
    formatDateForInput(range.start),
    formatDateForInput(range.end),
  );
}
