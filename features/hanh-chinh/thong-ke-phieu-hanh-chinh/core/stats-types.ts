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
  da_duyet: number;
  cho_duyet: number;
  tu_choi: number;
  tong_ngay: number;
  avg_ngay: number;
  avgLabel: string;
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
  filterDeptLabels: string[];
  filterEmployeeLabels: string[];
  exportedAt: string;
}

export type AdminFormStatsAggregates = {
  kpis: {
    total: number;
    da_duyet: number;
    cho_duyet: number;
    tu_choi: number;
    tong_ngay: number;
    typeCount: number;
    createdThisMonth: number;
    createdPrevMonth: number;
  };
  byType: Array<{ id: string; name: string; count: number }>;
  byStatus: Array<{ key: string; count: number }>;
  byDepartment: Array<{ id: string | null; name: string; count: number }>;
  byMonth: Array<{ month: string; count: number }>;
  typeSummary: Array<{
    id: string;
    name: string;
    total: number;
    da_duyet: number;
    cho_duyet: number;
    tu_choi: number;
    tong_ngay: number;
    avg_ngay: number;
  }>;
};
