import React, { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react';
import { txt } from '@/lib/text';
import { Tag, Inbox, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import DateRangePicker from '@/components/ui/DateRangePicker';
import DashboardToolbar from '@/components/shared/DashboardToolbar';
import FilterChipMultiSelect from '@/components/shared/FilterChipMultiSelect';
import LoadingSpinnerWithText from '@/components/shared/LoadingSpinnerWithText';
import StatsKpiGrid from '@/components/shared/stats/StatsKpiGrid';
import StatsDrillDownDialog from '@/components/shared/stats/StatsDrillDownDialog';
import type { StatsDataGridColumn } from '@/components/shared/stats/types';
import EnumBadge from '@/components/ui/EnumBadge';
import { useCan } from '@/hooks/use-can';
import { Employee } from '../core/types';
import { STATUS_OPTIONS, STATUS_BADGE_CONFIG } from '../core/constants';
import {
  DATE_RANGE_PRESETS,
  DEFAULT_KPI_IDS,
  DEFAULT_STATS_DATE_PRESET_ID,
  STATS_KPI_STORAGE_KEY,
  STATS_CHART_HEIGHT,
  STATS_CHART_HEIGHT_MOBILE,
  type DateRangePresetId,
} from '../core/stats-constants';
import { useMediaQuery } from '@/hooks/use-media-query';
import { getDateRangeFromPreset } from '../utils/stats-date-range';
import { isAllStatsDateRange } from '@/lib/stats-date-range';
import { clampDateRangeForRole, canExportStats } from '../utils/stats-permissions';
import { useAuthStore } from '@/store/useStore';
import { useEmployeeStats } from '../hooks/use-employee-stats';
import { exportStatsToExcel, exportStatsToPdf } from '../utils/export-stats-report';
import { formatDateTime } from '@/lib/utils';
import StatsExportDropdown from './StatsExportDropdown';
import StatsKpiConfigPopover from './StatsKpiConfigPopover';

const EmployeeStatsCharts = lazy(() => import('./EmployeeStatsCharts'));

const ChartsFallback = () => (
  <div className="grid grid-cols-1 gap-3">
    <div className="bg-card rounded-xl border border-border p-3.5 h-[250px] animate-pulse">
      <div className="h-4 w-32 bg-muted rounded mb-3" />
      <div className="h-[200px] bg-muted/30 rounded-lg" />
    </div>
  </div>
);

interface EmployeeStatsProps {
  /** Unused — KPIs come from server aggregates (kept for factory prop shape). */
  employees?: Employee[];
  isLoading?: boolean;
  onViewItem?: (item: Employee) => void;
}

type DrillDownState = { kind: 'status'; status: string; label: string };

function loadVisibleKpiIds(): string[] {
  try {
    const raw = localStorage.getItem(STATS_KPI_STORAGE_KEY);
    if (!raw) return [...DEFAULT_KPI_IDS];
    const parsed = JSON.parse(raw) as string[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : [...DEFAULT_KPI_IDS];
  } catch {
    return [...DEFAULT_KPI_IDS];
  }
}

const EmployeeStats: React.FC<EmployeeStatsProps> = ({
  isLoading: _listLoading,
  onViewItem,
}) => {
  const userRole = useAuthStore((s) => s.user?.role);
  const canExport = useCan('export', 'employees');
  const isMdUp = useMediaQuery('(min-width: 768px)');
  const chartHeight = isMdUp ? STATS_CHART_HEIGHT : STATS_CHART_HEIGHT_MOBILE;

  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePresetId>(DEFAULT_STATS_DATE_PRESET_ID);
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  const [chartsVisible, setChartsVisible] = useState(false);
  const [visibleKpiIds, setVisibleKpiIds] = useState<string[]>(loadVisibleKpiIds);
  const [drillDown, setDrillDown] = useState<DrillDownState | null>(null);

  const dateRange = useMemo(() => {
    const range = getDateRangeFromPreset(
      dateRangePreset,
      customStart ? new Date(customStart) : undefined,
      customEnd ? new Date(customEnd) : undefined
    );
    return clampDateRangeForRole(range, userRole);
  }, [dateRangePreset, customStart, customEnd, userRole]);

  const hookDrillDown = useMemo(() => {
    if (!drillDown) return null;
    return { kind: 'status' as const, status: drillDown.status };
  }, [drillDown]);

  const {
    filtered,
    isLoading,
    isDrillLoading,
    drillTotal,
    statusData,
    kpis,
    allKpis,
    total,
  } = useEmployeeStats({
    filterStatus,
    dateRange,
    visibleKpiIds,
    drillDown: hookDrillDown,
  });

  useEffect(() => {
    const timer = setTimeout(() => setChartsVisible(true), 80);
    return () => clearTimeout(timer);
  }, []);

  const statusOptions = STATUS_OPTIONS.map((s) => ({ label: s.label, value: String(s.value) }));
  const statsActiveFilterCount =
    (filterStatus.length > 0 ? 1 : 0) + (!isAllStatsDateRange(dateRangePreset) ? 1 : 0);
  const handleClearStatsFilters = () => {
    setFilterStatus([]);
    setDateRangePreset(DEFAULT_STATS_DATE_PRESET_ID);
    setCustomStart('');
    setCustomEnd('');
  };

  const statsFilterGroups = useMemo(
    () => [
      {
        key: 'time',
        label: txt('employee.stats.dateRangePlaceholder'),
        icon: Calendar,
        mode: 'single' as const,
        options: DATE_RANGE_PRESETS.filter((p) => p.id !== 'custom' && p.id !== 'all').map(
          (p) => ({ label: p.label, value: p.id }),
        ),
        value: isAllStatsDateRange(dateRangePreset) ? [] : [dateRangePreset],
        onChange: (val: string[]) => {
          setDateRangePreset((val[0] as DateRangePresetId) ?? DEFAULT_STATS_DATE_PRESET_ID);
          setCustomStart('');
          setCustomEnd('');
        },
      },
      {
        key: 'status',
        label: txt('employee.stats.status'),
        icon: Tag,
        options: statusOptions,
        value: filterStatus,
        onChange: (val: string[]) => setFilterStatus(val),
      },
    ],
    [statusOptions, filterStatus, dateRangePreset]
  );

  const handleExportReport = useCallback(
    async (format: 'excel' | 'pdf') => {
      if (!canExportStats(canExport)) return;
      const exportedAt = formatDateTime(new Date());
      const filterStatusLabels = filterStatus.map(
        (v) => STATUS_OPTIONS.find((s) => String(s.value) === v)?.label ?? v
      );
      const meta = {
        dateRangeLabel: dateRange.label,
        filterStatusLabels,
        exportedAt,
      };
      try {
        if (format === 'excel') {
          await exportStatsToExcel(meta, allKpis);
        } else {
          await exportStatsToPdf(meta, allKpis);
        }
        toast.success(
          txt(format === 'excel' ? 'employee.stats.exportSuccessExcel' : 'employee.stats.exportSuccessPdf'),
          { description: txt('employee.stats.exportSuccessDesc') },
        );
      } catch (err) {
        console.error('[stats-export]', err);
        toast.error(txt('employee.stats.exportError'));
      }
    },
    [canExport, filterStatus, dateRange.label, allKpis]
  );

  const handleToggleKpi = (id: string) => {
    const next = visibleKpiIds.includes(id)
      ? visibleKpiIds.filter((k) => k !== id)
      : [...visibleKpiIds, id];
    if (next.length === 0) return;
    setVisibleKpiIds(next);
    localStorage.setItem(STATS_KPI_STORAGE_KEY, JSON.stringify(next));
  };

  const openStatusDrillDown = useCallback((status: string) => {
    const label = STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
    setDrillDown({ kind: 'status', status, label });
  }, []);

  const drillDownRows = filtered;

  const drillDownSubtitle = useMemo(() => {
    if (!drillDown) return undefined;
    const base = txt('stats.drillDown.subtitle', { count: drillTotal, label: drillDown.label });
    if (drillTotal > drillDownRows.length && drillDownRows.length > 0) {
      return `${base} · ${txt('stats.drillDown.showingFirst', { count: drillDownRows.length })}`;
    }
    return base;
  }, [drillDown, drillTotal, drillDownRows.length]);

  const drillDownColumns = useMemo((): StatsDataGridColumn<Employee>[] => [
    {
      id: 'id',
      label: 'ID',
      align: 'left',
      minWidth: 72,
      sticky: true,
      sortable: true,
      getSortValue: (row) => row.id,
    },
    {
      id: 'ho_ten',
      label: txt('employee.name'),
      align: 'left',
      minWidth: 160,
      sortable: true,
      getSortValue: (row) => row.ho_ten,
    },
    {
      id: 'trang_thai',
      label: txt('employee.status'),
      align: 'center',
      sortable: true,
      getSortValue: (row) => row.trang_thai,
    },
  ], []);

  const renderDrillDownCell = useCallback((colId: string, row: Employee) => {
    switch (colId) {
      case 'id':
        return <span className="font-medium tabular-nums font-mono text-xs">{row.id}</span>;
      case 'ho_ten':
        return (
          <span className="font-medium max-w-[12rem] truncate sm:max-w-none sm:whitespace-normal" title={row.ho_ten}>
            {row.ho_ten}
          </span>
        );
      case 'trang_thai':
        return <EnumBadge value={row.trang_thai} config={STATUS_BADGE_CONFIG} truncate />;
      default:
        return null;
    }
  }, []);

  const handleDrillDownRowClick = useCallback(
    (row: Employee) => {
      if (onViewItem) onViewItem(row);
    },
    [onViewItem],
  );

  const dateRangePickerPresets = DATE_RANGE_PRESETS.map((p) => ({ id: p.id, label: p.label }));

  const renderFilters = (
    <>
      <DateRangePicker
        presets={dateRangePickerPresets}
        value={{ preset: dateRangePreset, customStart, customEnd }}
        onChange={(v) => {
          setDateRangePreset(v.preset as DateRangePresetId);
          setCustomStart(v.customStart);
          setCustomEnd(v.customEnd);
        }}
        displayLabel={isAllStatsDateRange(dateRangePreset) ? undefined : dateRange.label}
        placeholder={txt('employee.stats.dateRangePlaceholder')}
      />
      <FilterChipMultiSelect
        options={statusOptions}
        value={filterStatus}
        onChange={setFilterStatus}
        icon={Tag}
        placeholder={txt('employee.stats.status')}
        className="w-[140px]"
      />
    </>
  );

  const renderExportAction = canExportStats(canExport) ? (
    <StatsExportDropdown onExport={handleExportReport} compact={false} />
  ) : null;

  const renderMobileExportAction = canExportStats(canExport) ? (
    <StatsExportDropdown onExport={handleExportReport} compact />
  ) : null;

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col overflow-y-auto">
        <div className="shrink-0 py-3 px-3 sm:px-4 border-b border-border/50 bg-muted/20">
          <LoadingSpinnerWithText text={txt('employee.stats.loading')} centered />
        </div>
        <div className="flex-1 p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-card rounded-lg border border-border p-2.5 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3 w-16 bg-muted/60 rounded" />
                    <div className="h-5 w-10 bg-muted rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 gap-3">
            <div className="bg-card rounded-xl border border-border p-3.5 h-[250px] animate-pulse">
              <div className="h-4 w-32 bg-muted rounded mb-3" />
              <div className="h-[200px] bg-muted/30 rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isEmpty = total === 0;

  return (
    <div className="flex h-full min-h-0 min-w-0 w-full flex-col">
      <DashboardToolbar
        filters={renderFilters}
        actions={
          <div className="flex items-center gap-2">
            <StatsKpiConfigPopover visibleKpiIds={visibleKpiIds} onToggle={handleToggleKpi} />
            {renderExportAction}
          </div>
        }
        mobileActions={renderMobileExportAction}
        filterGroups={statsFilterGroups}
        activeFilterCount={statsActiveFilterCount}
        onClearFilters={handleClearStatsFilters}
        className="static z-auto"
      />

      <div className="min-h-0 min-w-0 w-full flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="min-w-0 max-w-full space-y-3 p-3 sm:p-4 pb-4">
          {isEmpty ? (
            <div className="bg-card rounded-xl border border-border p-8 text-center">
              <Inbox size={40} className="mx-auto text-muted-foreground/60 mb-3" />
              <h3 className="text-sm font-semibold text-foreground mb-1">{txt('employee.stats.noData')}</h3>
              <p className="text-xs text-muted-foreground mb-4">
                {statsActiveFilterCount > 0
                  ? txt('employee.stats.noDataHint')
                  : txt('employee.stats.noEmployeeInPeriod')}
              </p>
              {statsActiveFilterCount > 0 && (
                <button
                  onClick={handleClearStatsFilters}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {txt('employee.stats.clearFilters')}
                </button>
              )}
            </div>
          ) : (
            <>
              <StatsKpiGrid items={kpis} />

              {chartsVisible && (
                <Suspense fallback={<ChartsFallback />}>
                  <EmployeeStatsCharts
                    chartsVisible={chartsVisible}
                    chartHeight={chartHeight}
                    isMdUp={isMdUp}
                    statusData={statusData}
                    onStatusDrillDown={openStatusDrillDown}
                  />
                </Suspense>
              )}
            </>
          )}
        </div>
      </div>

      <StatsDrillDownDialog
        open={drillDown != null}
        onClose={() => setDrillDown(null)}
        title={txt('stats.drillDown.title')}
        subtitle={drillDownSubtitle}
        icon={Users}
        rows={drillDownRows}
        columns={drillDownColumns}
        getRowKey={(row) => row.id}
        renderCell={renderDrillDownCell}
        onRowClick={onViewItem ? handleDrillDownRowClick : undefined}
        isLoading={isDrillLoading}
        tableMinWidth="min-w-[32rem]"
      />
    </div>
  );
};

export default EmployeeStats;
