import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck, Clock, UserX } from 'lucide-react';
import { txt } from '@/lib/text';
import type { Employee } from '../core/types';
import {
  DEPT_COLORS,
  STATUS_COLORS,
  STATUS_LABELS,
  GENDER_COLORS,
  GENDER_LABELS,
  DEFAULT_KPI_IDS,
} from '../core/stats-constants';
import type { StatsDateRange, KpiItem, StatsTrends, StatsMiniSummary } from '../core/stats-types';
import { shouldApplyStatsAsAtFilter, getMonthKeysEndingAt } from '../utils/stats-date-range';
import { employeeStatsAggregatesQueryOptions } from '../queries/employees';
import { getEmployeesPage } from '../services/nhan-vien-service';

interface UseEmployeeStatsParams {
  filterDept: string[];
  filterStatus: string[];
  dateRange: StatsDateRange;
  visibleKpiIds?: string[];
  /** When set, fetch matching rows for drill-down (not used for KPIs). */
  drillDown?:
    | { kind: 'dept'; deptId: string }
    | { kind: 'status'; status: string }
    | { kind: 'gender'; gender: string }
    | { kind: 'month'; monthKey: string }
    | null;
}

/** First/last day (ISO date) of a YYYY-MM month key, for tg_tao range filters. */
function monthKeyToRange(monthKey: string): { dateFrom: string; dateTo: string } {
  const [y, m] = monthKey.split('-').map(Number);
  const lastDay = new Date(y!, m!, 0).getDate();
  const mm = String(m).padStart(2, '0');
  return {
    dateFrom: `${y}-${mm}-01`,
    dateTo: `${y}-${mm}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function useEmployeeStats({
  filterDept,
  filterStatus,
  dateRange,
  visibleKpiIds = [...DEFAULT_KPI_IDS],
  drillDown = null,
}: UseEmployeeStatsParams) {
  const applyAsAt = shouldApplyStatsAsAtFilter(dateRange.preset);
  const aggregateParams = useMemo(
    () => ({
      phong_ban_id: filterDept.length ? filterDept : undefined,
      trang_thai: filterStatus.length ? filterStatus : undefined,
      asAt: applyAsAt ? dateRange.end.toISOString() : undefined,
    }),
    [filterDept, filterStatus, applyAsAt, dateRange.end],
  );

  const { data: aggregates, isLoading } = useQuery(
    employeeStatsAggregatesQueryOptions(aggregateParams),
  );

  const drillParams = useMemo(() => {
    if (!drillDown) return null;
    const monthRange = drillDown.kind === 'month' ? monthKeyToRange(drillDown.monthKey) : null;
    return {
      limit: 100,
      offset: 0,
      phong_ban_id:
        drillDown.kind === 'dept'
          ? [drillDown.deptId]
          : filterDept.length
            ? filterDept
            : undefined,
      trang_thai:
        drillDown.kind === 'status'
          ? [drillDown.status]
          : filterStatus.length
            ? filterStatus
            : undefined,
      gioi_tinh: drillDown.kind === 'gender' ? [drillDown.gender] : undefined,
      dateFrom: monthRange?.dateFrom,
      dateTo: monthRange?.dateTo,
      // dateFrom/dateTo already bound the range for month drill-downs.
      asAt: applyAsAt && !monthRange ? dateRange.end.toISOString() : undefined,
    };
  }, [drillDown, filterDept, filterStatus, applyAsAt, dateRange.end]);

  const { data: drillPage, isLoading: isDrillLoading } = useQuery({
    queryKey: ['employees', 'stats-drilldown', drillParams],
    queryFn: () => getEmployeesPage(drillParams!),
    enabled: Boolean(drillParams),
  });

  const filtered: Employee[] = drillPage?.items ?? [];

  const total = aggregates?.kpis.total ?? 0;
  const active = aggregates?.kpis.active ?? 0;
  const probation = aggregates?.kpis.probation ?? 0;
  const inactive = aggregates?.kpis.inactive ?? 0;

  const pct = useCallback(
    (n: number) => (total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '0%'),
    [total],
  );

  const trends = useMemo((): StatsTrends => {
    const hiredThisMonth = aggregates?.kpis.hiredThisMonth ?? 0;
    const hiredPrevMonth = aggregates?.kpis.hiredPrevMonth ?? 0;
    return {
      totalDelta: hiredThisMonth,
      activeDelta: hiredThisMonth - hiredPrevMonth,
      hiredThisMonth,
      hiredPrevMonth,
    };
  }, [aggregates]);

  const deptData = useMemo(
    () =>
      (aggregates?.byDept ?? []).map((d) => ({
        name: d.name,
        value: d.count,
        id: d.id,
      })),
    [aggregates],
  );

  const statusData = useMemo(
    () =>
      (Object.entries(STATUS_LABELS) as [string, string][]).map(([key, name]) => ({
        key,
        name,
        value: aggregates?.byStatus.find((s) => s.key === key)?.count ?? 0,
        fill: STATUS_COLORS[key as keyof typeof STATUS_COLORS],
      })),
    [aggregates],
  );

  const monthKeys = useMemo(
    () => getMonthKeysEndingAt(dateRange.end, 12),
    [dateRange.end],
  );

  const hiringData = useMemo(
    () =>
      monthKeys.map(({ key, label }) => ({
        key,
        label,
        count: aggregates?.hiresByMonth.find((h) => h.month === key)?.count ?? 0,
      })),
    [aggregates, monthKeys],
  );

  const genderData = useMemo(() => {
    const map: Record<string, number> = { Nam: 0, Nữ: 0, Khác: 0 };
    for (const g of aggregates?.byGender ?? []) {
      map[g.key] = (map[g.key] || 0) + g.count;
    }
    return Object.entries(map)
      .filter(([, v]) => v > 0)
      .map(([key, value]) => ({
        key,
        name: GENDER_LABELS[key] ?? key,
        value,
        fill: GENDER_COLORS[key] ?? '#94a3b8',
      }));
  }, [aggregates]);

  const deptSummary = useMemo(
    () =>
      (aggregates?.deptSummary ?? []).map((s) => ({
        id: s.id ?? null,
        name: s.name,
        total: s.total,
        active: s.active,
        probation: s.probation,
        inactive: s.inactive,
        rate: s.total > 0 ? ((s.active / s.total) * 100).toFixed(0) : '0',
      })),
    [aggregates],
  );

  const miniSummary = useMemo((): StatsMiniSummary => {
    const maleCount = aggregates?.byGender.find((g) => g.key === 'Nam')?.count ?? 0;
    const femaleCount = aggregates?.byGender.find((g) => g.key === 'Nữ')?.count ?? 0;
    const topDept = deptData[0] ? { name: deptData[0].name, value: deptData[0].value } : null;
    return {
      hiredThisMonth: trends.hiredThisMonth,
      maleCount,
      femaleCount,
      topDept,
    };
  }, [aggregates, deptData, trends.hiredThisMonth]);

  const allKpis: KpiItem[] = useMemo(
    () => [
      {
        id: 'total',
        label: txt('employee.stats.totalEmployees'),
        value: total,
        icon: Users,
        color: 'text-primary',
        bg: 'bg-primary/10',
        pct: null,
        delta: trends.totalDelta,
      },
      {
        id: 'active',
        label: txt('employee.stats.working'),
        value: active,
        icon: UserCheck,
        color: 'text-emerald-600',
        bg: 'bg-emerald-50 dark:bg-emerald-950/30',
        pct: pct(active),
        delta: trends.activeDelta,
      },
      {
        id: 'probation',
        label: txt('employee.stats.probation'),
        value: probation,
        icon: Clock,
        color: 'text-blue-600',
        bg: 'bg-blue-50 dark:bg-blue-950/30',
        pct: pct(probation),
        delta: null,
      },
      {
        id: 'inactive',
        label: txt('employee.stats.leaveResigned'),
        value: inactive,
        icon: UserX,
        color: 'text-amber-600',
        bg: 'bg-amber-50 dark:bg-amber-950/30',
        pct: pct(inactive),
        delta: null,
      },
    ],
    [total, active, probation, inactive, pct, trends],
  );

  const kpis = useMemo(
    () => allKpis.filter((k) => visibleKpiIds.includes(k.id)),
    [allKpis, visibleKpiIds],
  );

  return {
    filtered,
    isLoading,
    isDrillLoading,
    drillTotal: drillPage?.total ?? 0,
    total,
    active,
    probation,
    inactive,
    pct,
    trends,
    deptData,
    statusData,
    hiringData,
    genderData,
    deptSummary,
    miniSummary,
    kpis,
    allKpis,
    DEPT_COLORS,
  };
}
