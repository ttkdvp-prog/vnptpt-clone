import { useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, UserCheck, Clock, UserX } from 'lucide-react';
import { txt } from '@/lib/text';
import type { Employee } from '../core/types';
import { STATUS_COLORS, STATUS_LABELS, DEFAULT_KPI_IDS } from '../core/stats-constants';
import type { StatsDateRange, KpiItem, StatsTrends } from '../core/stats-types';
import { shouldApplyStatsAsAtFilter } from '../utils/stats-date-range';
import { employeeStatsAggregatesQueryOptions } from '../queries/employees';
import { getEmployeesPage } from '../services/nhan-vien-service';

interface UseEmployeeStatsParams {
  filterStatus: string[];
  dateRange: StatsDateRange;
  visibleKpiIds?: string[];
  /** When set, fetch matching rows for drill-down (not used for KPIs). */
  drillDown?: { kind: 'status'; status: string } | null;
}

export function useEmployeeStats({
  filterStatus,
  dateRange,
  visibleKpiIds = [...DEFAULT_KPI_IDS],
  drillDown = null,
}: UseEmployeeStatsParams) {
  const applyAsAt = shouldApplyStatsAsAtFilter(dateRange.preset);
  const aggregateParams = useMemo(
    () => ({
      trang_thai: filterStatus.length ? filterStatus : undefined,
      asAt: applyAsAt ? dateRange.end.toISOString() : undefined,
    }),
    [filterStatus, applyAsAt, dateRange.end],
  );

  const { data: aggregates, isLoading } = useQuery(
    employeeStatsAggregatesQueryOptions(aggregateParams),
  );

  const drillParams = useMemo(() => {
    if (!drillDown) return null;
    return {
      limit: 100,
      offset: 0,
      trang_thai: [drillDown.status],
      asAt: applyAsAt ? dateRange.end.toISOString() : undefined,
    };
  }, [drillDown, applyAsAt, dateRange.end]);

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
    statusData,
    kpis,
    allKpis,
  };
}
