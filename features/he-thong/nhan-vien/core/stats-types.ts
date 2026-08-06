/**
 * Types for Employee Stats / Dashboard
 */
import type { LucideIcon } from 'lucide-react';
import type { DateRangePresetId } from './stats-constants';

export interface StatsDateRange {
  preset: DateRangePresetId;
  /** Start of range (inclusive) */
  start: Date;
  /** End of range (inclusive), "as at" date for headcount */
  end: Date;
  label: string;
}

export interface DeptChartItem {
  name: string;
  value: number;
}

export interface StatusChartItem {
  name: string;
  value: number;
  fill: string;
}

export interface HiringChartItem {
  /** Month key YYYY-MM — dùng cho drill-down theo tháng */
  key: string;
  label: string;
  count: number;
}

export interface GenderChartItem {
  /** Giá trị gioi_tinh gốc (Nam/Nữ/Khác) — dùng cho drill-down */
  key: string;
  name: string;
  value: number;
  fill: string;
}

export interface DeptSummaryRow {
  /** Department id, null = "Chưa phân bổ" (không drill-down được) */
  id: string | null;
  name: string;
  total: number;
  active: number;
  probation: number;
  inactive: number;
  rate: string;
}

export interface StatsTrends {
  totalDelta: number;
  activeDelta: number;
  hiredThisMonth: number;
  hiredPrevMonth: number;
  /** Same period last year (for YoY) */
  totalYoY?: number;
  activeYoY?: number;
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
  yoyPercent?: number | null;
}

export interface StatsMiniSummary {
  hiredThisMonth: number;
  maleCount: number;
  femaleCount: number;
  topDept: { name: string; value: number } | null;
}

export interface StatsExportMeta {
  dateRangeLabel: string;
  filterDeptLabels: string[];
  filterStatusLabels: string[];
  exportedAt: string;
}
