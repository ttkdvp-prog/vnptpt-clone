import type { LucideIcon } from 'lucide-react';
import type { DateRangePresetId } from './stats-constants';

export interface StatsDateRange {
  preset: DateRangePresetId;
  start: Date;
  end: Date;
  label: string;
}

export interface TypeSummaryRow {
  id: string;
  name: string;
  total: number;
  du_thao: number;
  hieu_luc: number;
  loi_thoi: number;
  cho_sua: number;
  rate: string;
}

export interface KpiItem {
  id: string;
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  bg: string;
  pct: string | null;
  delta: number | null;
}

export interface StatsExportMeta {
  dateRangeLabel: string;
  filterTypeLabels: string[];
  filterStatusLabels: string[];
  filterCreatorLabels: string[];
  exportedAt: string;
}

export type DocumentStatsAggregates = {
  kpis: {
    total: number;
    du_thao: number;
    hieu_luc: number;
    loi_thoi: number;
    cho_sua: number;
    typeCount: number;
    createdThisMonth: number;
    createdPrevMonth: number;
  };
  byType: Array<{ id: string; name: string; count: number }>;
  byStatus: Array<{ key: string; count: number }>;
  byCreator: Array<{ id: string | null; name: string; count: number }>;
  createdByMonth: Array<{ month: string; count: number }>;
  typeSummary: Array<{
    id: string;
    name: string;
    total: number;
    du_thao: number;
    hieu_luc: number;
    loi_thoi: number;
    cho_sua: number;
  }>;
};
