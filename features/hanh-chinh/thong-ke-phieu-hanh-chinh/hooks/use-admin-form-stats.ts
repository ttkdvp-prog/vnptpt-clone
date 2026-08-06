import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  FileText,
  FileType2,
  CalendarDays,
  Hourglass,
  XCircle,
} from 'lucide-react';
import { listQueryOptions } from '@/lib/query/query-config';
import { queryKeys } from '@/lib/query-keys';
import { isAllStatsDateRange } from '@/lib/stats-date-range';
import { txt } from '@/lib/text';
import { getMonthKeysEndingAt } from '@/features/he-thong/nhan-vien/utils/stats-date-range';
import {
  DEFAULT_KPI_IDS,
  STATUS_COLORS,
  STATUS_LABELS,
  TYPE_COLORS,
} from '../core/stats-constants';
import type { KpiItem, StatsDateRange, TypeSummaryRow } from '../core/stats-types';
import {
  getAdminFormStatsAggregates,
  getAdminFormStatsDrillPage,
} from '../services/admin-form-stats-service';

interface UseAdminFormStatsParams {
  filterType: string[];
  filterStatus: string[];
  filterDepartment: string[];
  filterEmployee: string[];
  dateRange: StatsDateRange;
  visibleKpiIds?: string[];
  drillDown?:
    | { kind: 'type'; typeId: string }
    | { kind: 'status'; status: string }
    | { kind: 'department'; departmentId: string | null }
    | null;
}

export function useAdminFormStats({
  filterType,
  filterStatus,
  filterDepartment = [],
  filterEmployee = [],
  dateRange,
  visibleKpiIds = [...DEFAULT_KPI_IDS],
  drillDown = null,
}: UseAdminFormStatsParams) {
  const applyRange = !isAllStatsDateRange(dateRange.preset);

  const aggregateParams = useMemo(
    () => ({
      ma_phieu: filterType.length ? filterType : undefined,
      trang_thai: filterStatus.length ? filterStatus : undefined,
      id_phong_ban: filterDepartment.length ? filterDepartment : undefined,
      id_nhan_vien: filterEmployee.length ? filterEmployee : undefined,
      from: applyRange ? dateRange.start.toISOString() : undefined,
      to: applyRange ? dateRange.end.toISOString() : undefined,
    }),
    [
      filterType,
      filterStatus,
      filterDepartment,
      filterEmployee,
      applyRange,
      dateRange.start,
      dateRange.end,
    ],
  );

  const { data: aggregates, isLoading } = useQuery({
    queryKey: queryKeys.adminForms.statsAggregates(aggregateParams),
    queryFn: () => getAdminFormStatsAggregates(aggregateParams),
    ...listQueryOptions,
  });

  const drillParams = useMemo(() => {
    if (!drillDown) return null;
    return {
      limit: 100,
      offset: 0,
      ma_phieu:
        drillDown.kind === 'type'
          ? [drillDown.typeId]
          : filterType.length
            ? filterType
            : undefined,
      trang_thai:
        drillDown.kind === 'status'
          ? [drillDown.status]
          : filterStatus.length
            ? filterStatus
            : undefined,
      id_phong_ban:
        drillDown.kind === 'department'
          ? drillDown.departmentId
            ? [drillDown.departmentId]
            : undefined
          : filterDepartment.length
            ? filterDepartment
            : undefined,
      id_nhan_vien: filterEmployee.length ? filterEmployee : undefined,
      from: applyRange ? dateRange.start.toISOString() : undefined,
      to: applyRange ? dateRange.end.toISOString() : undefined,
    };
  }, [
    drillDown,
    filterType,
    filterStatus,
    filterDepartment,
    filterEmployee,
    applyRange,
    dateRange.start,
    dateRange.end,
  ]);

  const { data: drillPage } = useQuery({
    queryKey: ['admin-forms', 'stats-drilldown', drillParams] as const,
    queryFn: () => getAdminFormStatsDrillPage(drillParams!),
    enabled: Boolean(drillParams),
    ...listQueryOptions,
  });

  const total = aggregates?.kpis.total ?? 0;
  const pct = useCallback(
    (n: number) => (total > 0 ? `${((n / total) * 100).toFixed(1)}%` : '0%'),
    [total],
  );

  const allKpis = useMemo((): KpiItem[] => {
    const k = aggregates?.kpis;
    return [
      {
        id: 'total',
        label: txt('adminFormStats.kpiTotal'),
        value: k?.total ?? 0,
        icon: FileText,
        color: 'text-primary',
        bg: 'bg-primary/10',
        pct: null,
        delta: (k?.createdThisMonth ?? 0) - (k?.createdPrevMonth ?? 0),
      },
      {
        id: 'da_duyet',
        label: txt('adminFormStats.kpiApproved'),
        value: k?.da_duyet ?? 0,
        icon: CheckCircle2,
        color: 'text-emerald-600',
        bg: 'bg-emerald-500/10',
        pct: pct(k?.da_duyet ?? 0),
        delta: null,
      },
      {
        id: 'cho_duyet',
        label: txt('adminFormStats.kpiPending'),
        value: k?.cho_duyet ?? 0,
        icon: Hourglass,
        color: 'text-amber-600',
        bg: 'bg-amber-500/10',
        pct: pct(k?.cho_duyet ?? 0),
        delta: null,
      },
      {
        id: 'tu_choi',
        label: txt('adminFormStats.kpiRejected'),
        value: k?.tu_choi ?? 0,
        icon: XCircle,
        color: 'text-rose-600',
        bg: 'bg-rose-500/10',
        pct: pct(k?.tu_choi ?? 0),
        delta: null,
      },
      {
        id: 'tong_ngay',
        label: txt('adminFormStats.kpiDays'),
        value: k?.tong_ngay ?? 0,
        icon: CalendarDays,
        color: 'text-sky-600',
        bg: 'bg-sky-500/10',
        pct: null,
        delta: null,
      },
      {
        id: 'typeCount',
        label: txt('adminFormStats.kpiTypes'),
        value: k?.typeCount ?? 0,
        icon: FileType2,
        color: 'text-indigo-600',
        bg: 'bg-indigo-500/10',
        pct: null,
        delta: null,
      },
    ];
  }, [aggregates, pct]);

  const kpis = useMemo(
    () => allKpis.filter((k) => visibleKpiIds.includes(k.id)),
    [allKpis, visibleKpiIds],
  );

  const typeData = useMemo(
    () =>
      (aggregates?.byType ?? []).map((t, i) => ({
        id: t.id,
        name: t.name,
        value: t.count,
        fill: TYPE_COLORS[i % TYPE_COLORS.length]!,
      })),
    [aggregates],
  );

  const statusData = useMemo(
    () =>
      (Object.keys(STATUS_LABELS) as Array<keyof typeof STATUS_LABELS>).map((key) => ({
        key,
        name: STATUS_LABELS[key],
        value: aggregates?.byStatus.find((s) => s.key === key)?.count ?? 0,
        fill: STATUS_COLORS[key] ?? '#94a3b8',
      })),
    [aggregates],
  );

  const monthKeys = useMemo(
    () => getMonthKeysEndingAt(dateRange.end, 12),
    [dateRange.end],
  );

  const trendData = useMemo(
    () =>
      monthKeys.map(({ key, label }) => ({
        label,
        count: aggregates?.byMonth.find((h) => h.month === key)?.count ?? 0,
      })),
    [aggregates, monthKeys],
  );

  const departmentData = useMemo(
    () =>
      (aggregates?.byDepartment ?? []).slice(0, 8).map((c) => ({
        id: c.id,
        name: c.name,
        value: c.count,
      })),
    [aggregates],
  );

  const typeSummary = useMemo((): TypeSummaryRow[] => {
    return (aggregates?.typeSummary ?? []).map((row) => ({
      ...row,
      avgLabel: String(row.avg_ngay),
    }));
  }, [aggregates]);

  return {
    isLoading,
    kpis,
    allKpis,
    typeData,
    statusData,
    trendData,
    departmentData,
    typeSummary,
    drillItems: drillPage?.items ?? [],
    TYPE_COLORS,
  };
}
