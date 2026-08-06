import { txt } from '@/lib/text';
import {
  DEFAULT_STATS_DATE_PRESET_ID,
  STANDARD_STATS_DATE_PRESET_IDS,
  type StandardStatsDatePresetId,
} from '@/lib/stats-date-range';
import { DOCUMENT_STATUS, DOCUMENT_STATUS_LABELS } from '@/features/hanh-chinh/danh-sach-tai-lieu/core/types';

export type DateRangePresetId = StandardStatsDatePresetId;

export { DEFAULT_STATS_DATE_PRESET_ID };

const PRESET_LABEL_KEYS: Record<Exclude<DateRangePresetId, 'custom'>, string> = {
  all: 'employee.stats.preset.all',
  this_week: 'employee.stats.preset.thisWeek',
  last_week: 'employee.stats.preset.lastWeek',
  last_7_days: 'employee.stats.preset.last7Days',
  this_month: 'employee.stats.preset.thisMonth',
  last_month: 'employee.stats.preset.lastMonth',
  last_30_days: 'employee.stats.preset.last30Days',
  this_quarter: 'employee.stats.preset.thisQuarter',
  last_quarter: 'employee.stats.preset.lastQuarter',
  last_6_months: 'employee.stats.preset.last6Months',
  this_year: 'employee.stats.preset.thisYear',
  last_year: 'employee.stats.preset.lastYear',
};

export const DATE_RANGE_PRESETS: { id: DateRangePresetId; label: string }[] = [
  ...STANDARD_STATS_DATE_PRESET_IDS.map((id) => ({
    id,
    get label() {
      return txt(PRESET_LABEL_KEYS[id]);
    },
  })),
  {
    id: 'custom',
    get label() {
      return txt('employee.stats.preset.custom');
    },
  },
];

export const TYPE_COLORS = [
  '#6366f1',
  '#06b6d4',
  '#f59e0b',
  '#ef4444',
  '#10b981',
  '#8b5cf6',
  '#ec4899',
  '#14b8a6',
  '#f97316',
];

export const STATUS_COLORS: Record<string, string> = {
  [DOCUMENT_STATUS.DU_THAO]: '#94a3b8',
  [DOCUMENT_STATUS.HIEU_LUC]: '#10b981',
  [DOCUMENT_STATUS.LOI_THOI]: '#f43f5e',
  [DOCUMENT_STATUS.CHO_SUA]: '#f59e0b',
};

export const STATUS_LABELS = DOCUMENT_STATUS_LABELS;

export const DEFAULT_KPI_IDS = [
  'total',
  'hieu_luc',
  'du_thao',
  'cho_sua',
  'loi_thoi',
  'typeCount',
] as const;

export const STATS_KPI_STORAGE_KEY = 'document-stats-kpi';

export const STATS_CHART_HEIGHT = 220;
export const STATS_CHART_HEIGHT_MOBILE = 200;
