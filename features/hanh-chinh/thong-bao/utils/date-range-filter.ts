import { formatDateForInput } from '@/lib/utils';
import { isAllStatsDateRange } from '@/lib/stats-date-range';
import { getDateRangeFromPreset } from '@/features/he-thong/nhan-vien/utils/stats-date-range';
import type { DateRangePresetId } from '@/features/hanh-chinh/thong-ke-phieu-hanh-chinh/core/stats-constants';

/** True when `tg_dang` falls within the selected date range (date-only). */
export function matchesThongBaoDateFilter(
  tgDang: string,
  datePreset: string,
  customStart: string,
  customEnd: string,
): boolean {
  if (isAllStatsDateRange(datePreset)) return true;

  const day = tgDang?.slice(0, 10);
  if (!day) return false;

  const range = getDateRangeFromPreset(
    datePreset as DateRangePresetId,
    customStart ? new Date(customStart) : undefined,
    customEnd ? new Date(customEnd) : undefined,
  );
  const start = formatDateForInput(range.start);
  const end = formatDateForInput(range.end);
  return day >= start && day <= end;
}
