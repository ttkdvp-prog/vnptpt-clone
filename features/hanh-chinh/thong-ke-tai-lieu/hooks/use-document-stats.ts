import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  FileEdit,
  Files,
  FolderTree,
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
  getDocumentStatsAggregates,
  getDocumentStatsDrillPage,
} from '../services/document-stats-service';

interface UseDocumentStatsParams {
  filterType: string[];
  filterStatus: string[];
  filterCreator?: string[];
  dateRange: StatsDateRange;
  visibleKpiIds?: string[];
  drillDown?:
    | { kind: 'type'; typeId: string }
    | { kind: 'status'; status: string }
    | { kind: 'creator'; creatorId: string | null }
    | null;
}

export function useDocumentStats({
  filterType,
  filterStatus,
  filterCreator = [],
  dateRange,
  visibleKpiIds = [...DEFAULT_KPI_IDS],
  drillDown = null,
}: UseDocumentStatsParams) {
  const applyRange = !isAllStatsDateRange(dateRange.preset);

  const aggregateParams = useMemo(
    () => ({
      id_loai_tai_lieu: filterType.length ? filterType : undefined,
      trang_thai: filterStatus.length ? filterStatus : undefined,
      nguoi_tao: filterCreator.length ? filterCreator : undefined,
      from: applyRange ? dateRange.start.toISOString() : undefined,
      to: applyRange ? dateRange.end.toISOString() : undefined,
    }),
    [filterType, filterStatus, filterCreator, applyRange, dateRange.start, dateRange.end],
  );

  const { data: aggregates, isLoading } = useQuery({
    queryKey: queryKeys.documents.statsAggregates(aggregateParams),
    queryFn: () => getDocumentStatsAggregates(aggregateParams),
    ...listQueryOptions,
  });

  const drillParams = useMemo(() => {
    if (!drillDown) return null;
    return {
      limit: 100,
      offset: 0,
      id_loai_tai_lieu:
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
      nguoi_tao:
        drillDown.kind === 'creator'
          ? drillDown.creatorId
            ? [drillDown.creatorId]
            : undefined
          : filterCreator.length
            ? filterCreator
            : undefined,
      from: applyRange ? dateRange.start.toISOString() : undefined,
      to: applyRange ? dateRange.end.toISOString() : undefined,
    };
  }, [
    drillDown,
    filterType,
    filterStatus,
    filterCreator,
    applyRange,
    dateRange.start,
    dateRange.end,
  ]);

  const { data: drillPage } = useQuery({
    queryKey: ['documents', 'stats-drilldown', drillParams] as const,
    queryFn: () => getDocumentStatsDrillPage(drillParams!),
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
        label: txt('documentStats.kpiTotal'),
        value: k?.total ?? 0,
        icon: Files,
        color: 'text-primary',
        bg: 'bg-primary/10',
        pct: null,
        delta: (k?.createdThisMonth ?? 0) - (k?.createdPrevMonth ?? 0),
      },
      {
        id: 'hieu_luc',
        label: txt('documentStats.kpiActive'),
        value: k?.hieu_luc ?? 0,
        icon: CheckCircle2,
        color: 'text-emerald-600',
        bg: 'bg-emerald-500/10',
        pct: pct(k?.hieu_luc ?? 0),
        delta: null,
      },
      {
        id: 'du_thao',
        label: txt('documentStats.kpiDraft'),
        value: k?.du_thao ?? 0,
        icon: FileEdit,
        color: 'text-slate-600',
        bg: 'bg-slate-500/10',
        pct: pct(k?.du_thao ?? 0),
        delta: null,
      },
      {
        id: 'cho_sua',
        label: txt('documentStats.kpiPending'),
        value: k?.cho_sua ?? 0,
        icon: Hourglass,
        color: 'text-amber-600',
        bg: 'bg-amber-500/10',
        pct: pct(k?.cho_sua ?? 0),
        delta: null,
      },
      {
        id: 'loi_thoi',
        label: txt('documentStats.kpiObsolete'),
        value: k?.loi_thoi ?? 0,
        icon: XCircle,
        color: 'text-rose-600',
        bg: 'bg-rose-500/10',
        pct: pct(k?.loi_thoi ?? 0),
        delta: null,
      },
      {
        id: 'typeCount',
        label: txt('documentStats.kpiTypes'),
        value: k?.typeCount ?? 0,
        icon: FolderTree,
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
        count: aggregates?.createdByMonth.find((h) => h.month === key)?.count ?? 0,
      })),
    [aggregates, monthKeys],
  );

  const creatorData = useMemo(
    () =>
      (aggregates?.byCreator ?? []).slice(0, 8).map((c) => ({
        id: c.id,
        name: c.name,
        value: c.count,
      })),
    [aggregates],
  );

  const typeSummary = useMemo((): TypeSummaryRow[] => {
    return (aggregates?.typeSummary ?? []).map((row) => ({
      ...row,
      rate:
        row.total > 0 ? `${((row.hieu_luc / row.total) * 100).toFixed(1)}%` : '0%',
    }));
  }, [aggregates]);

  return {
    isLoading,
    kpis,
    allKpis,
    typeData,
    statusData,
    trendData,
    creatorData,
    typeSummary,
    drillItems: drillPage?.items ?? [],
    TYPE_COLORS,
  };
}
