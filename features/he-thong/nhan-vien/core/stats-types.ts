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

export interface StatusChartItem {
  name: string;
  value: number;
  fill: string;
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

export interface StatsExportMeta {
  dateRangeLabel: string;
  filterStatusLabels: string[];
  exportedAt: string;
}
