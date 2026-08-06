import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, FileType2, Tag, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import DateRangePicker from '@/components/ui/DateRangePicker';
import DashboardToolbar from '@/components/shared/DashboardToolbar';
import FilterChipMultiSelect from '@/components/shared/FilterChipMultiSelect';
import LoadingSpinnerWithText from '@/components/shared/LoadingSpinnerWithText';
import StatsKpiGrid from '@/components/shared/stats/StatsKpiGrid';
import StatsDataGrid from '@/components/shared/stats/StatsDataGrid';
import StatsDrillDownDialog from '@/components/shared/stats/StatsDrillDownDialog';
import type { StatsDataGridColumn } from '@/components/shared/stats/types';
import StatsExportDropdown, {
  type StatsExportFormat,
} from '@/features/he-thong/nhan-vien/components/StatsExportDropdown';
import { PhieuHanhChinhStatusBadge } from '@/features/hanh-chinh/phieu-hanh-chinh/components/phieu-hanh-chinh-badges';
import PhieuHanhChinhDetail from '@/features/hanh-chinh/phieu-hanh-chinh/components/phieu-hanh-chinh-detail';
import type { PhieuHanhChinh } from '@/features/hanh-chinh/phieu-hanh-chinh/core/types';
import { PHIEU_HANH_CHINH_STATUS_OPTIONS } from '@/features/hanh-chinh/phieu-hanh-chinh/core/types';
import { computeSoNgay } from '@/features/hanh-chinh/phieu-hanh-chinh/utils/compute-so-ngay';
import {
  useDeletePhieuHanhChinh,
  usePhieuHanhChinh,
} from '@/features/hanh-chinh/phieu-hanh-chinh/hooks/use-phieu-hanh-chinh';
import { getTenLoaiPhieu, loaiPhieuFilterOptions } from '@/features/hanh-chinh/phieu-hanh-chinh/core/loai-phieu';
import { useDepartments } from '@/features/he-thong/phong-ban/hooks/use-phong-ban';
import { getDateRangeFromPreset } from '@/features/he-thong/nhan-vien/utils/stats-date-range';
import { useCan } from '@/hooks/use-can';
import { useMediaQuery } from '@/hooks/use-media-query';
import { isAllStatsDateRange } from '@/lib/stats-date-range';
import { txt } from '@/lib/text';
import { formatDate, formatDateTime } from '@/lib/utils';
import { usePrimaryColor } from '@/lib/theme-utils';
import {
  DATE_RANGE_PRESETS,
  DEFAULT_KPI_IDS,
  DEFAULT_STATS_DATE_PRESET_ID,
  STATS_CHART_HEIGHT,
  STATS_CHART_HEIGHT_MOBILE,
  STATS_KPI_STORAGE_KEY,
  type DateRangePresetId,
} from '../core/stats-constants';
import type { TypeSummaryRow } from '../core/stats-types';
import { useAdminFormStats } from '../hooks/use-admin-form-stats';
import {
  exportAdminFormStatsToExcel,
  exportAdminFormStatsToPdf,
} from '../utils/export-stats-report';
import StatsKpiConfigPopover from './StatsKpiConfigPopover';

const AdminFormStatsCharts = lazy(() => import('./AdminFormStatsCharts'));

const ChartsFallback = () => (
  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
    {[1, 2, 3, 4].map((i) => (
      <div
        key={i}
        className="h-[250px] animate-pulse rounded-xl border border-border bg-card p-3.5"
      >
        <div className="mb-3 h-4 w-32 rounded bg-muted" />
        <div className="h-[200px] rounded-lg bg-muted/30" />
      </div>
    ))}
  </div>
);

type DrillDownState =
  | { kind: 'type'; typeId: string; label: string }
  | { kind: 'status'; status: string; label: string }
  | { kind: 'department'; departmentId: string | null; label: string };

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

const ThongKePhieuHanhChinhPage: React.FC = () => {
  const { data: items = [] } = usePhieuHanhChinh();
  const { data: departments = [] } = useDepartments();
  const canExport = useCan('export', 'adminForms');
  const { hex: primaryHex } = usePrimaryColor();
  const isMdUp = useMediaQuery('(min-width: 768px)');
  const chartHeight = isMdUp ? STATS_CHART_HEIGHT : STATS_CHART_HEIGHT_MOBILE;
  const deleteMutation = useDeletePhieuHanhChinh();

  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterDepartment, setFilterDepartment] = useState<string[]>([]);
  const [filterEmployee, setFilterEmployee] = useState<string[]>([]);
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePresetId>(
    DEFAULT_STATS_DATE_PRESET_ID,
  );
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [chartsVisible, setChartsVisible] = useState(false);
  const [visibleKpiIds, setVisibleKpiIds] = useState<string[]>(loadVisibleKpiIds);
  const [drillDown, setDrillDown] = useState<DrillDownState | null>(null);
  const [viewing, setViewing] = useState<PhieuHanhChinh | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setChartsVisible(true), 80);
    return () => window.clearTimeout(t);
  }, []);

  const dateRange = useMemo(
    () =>
      getDateRangeFromPreset(
        dateRangePreset,
        customStart ? new Date(customStart) : undefined,
        customEnd ? new Date(customEnd) : undefined,
      ),
    [dateRangePreset, customStart, customEnd],
  );

  const {
    isLoading,
    kpis,
    typeData,
    statusData,
    trendData,
    departmentData,
    typeSummary,
    drillItems,
  } = useAdminFormStats({
    filterType,
    filterStatus,
    filterDepartment,
    filterEmployee,
    dateRange,
    visibleKpiIds,
    drillDown: drillDown
      ? drillDown.kind === 'type'
        ? { kind: 'type', typeId: drillDown.typeId }
        : drillDown.kind === 'status'
          ? { kind: 'status', status: drillDown.status }
          : { kind: 'department', departmentId: drillDown.departmentId }
      : null,
  });

  const activeFilterCount =
    (filterType.length > 0 ? 1 : 0) +
    (filterStatus.length > 0 ? 1 : 0) +
    (filterDepartment.length > 0 ? 1 : 0) +
    (filterEmployee.length > 0 ? 1 : 0) +
    (isAllStatsDateRange(dateRangePreset) ? 0 : 1);

  const typeOptions = useMemo(() => loaiPhieuFilterOptions(), []);

  const departmentOptions = useMemo(
    () =>
      departments.map((d) => ({
        value: d.id,
        label: d.ten_phong_ban,
      })),
    [departments],
  );

  const employeeOptions = useMemo(() => {
    const labels = new Map<string, string>();
    for (const item of items) {
      if (!labels.has(item.id_nhan_vien)) {
        labels.set(
          item.id_nhan_vien,
          item.ten_nhan_vien?.trim() || item.id_nhan_vien,
        );
      }
    }
    return [...labels.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }, [items]);

  const handleToggleKpi = (id: string) => {
    const next = visibleKpiIds.includes(id)
      ? visibleKpiIds.filter((k) => k !== id)
      : [...visibleKpiIds, id];
    if (next.length === 0) return;
    setVisibleKpiIds(next);
    localStorage.setItem(STATS_KPI_STORAGE_KEY, JSON.stringify(next));
  };

  const handleExportReport = useCallback(
    async (format: StatsExportFormat) => {
      const meta = {
        dateRangeLabel: isAllStatsDateRange(dateRangePreset)
          ? txt('employee.stats.preset.all')
          : dateRange.label,
        filterTypeLabels: typeOptions
          .filter((o) => filterType.includes(o.value))
          .map((o) => o.label),
        filterStatusLabels: PHIEU_HANH_CHINH_STATUS_OPTIONS.filter((o) =>
          filterStatus.includes(o.value),
        ).map((o) => o.label),
        filterDeptLabels: departmentOptions
          .filter((o) => filterDepartment.includes(o.value))
          .map((o) => o.label),
        filterEmployeeLabels: employeeOptions
          .filter((o) => filterEmployee.includes(o.value))
          .map((o) => o.label),
        exportedAt: formatDateTime(new Date().toISOString()),
      };
      try {
        if (format === 'excel') {
          await exportAdminFormStatsToExcel(meta, kpis, typeSummary);
        } else {
          await exportAdminFormStatsToPdf(meta, kpis, typeSummary);
        }
      } catch {
        toast.error(txt('adminFormStats.exportError'));
      }
    },
    [
      dateRange.label,
      dateRangePreset,
      filterStatus,
      filterType,
      filterDepartment,
      filterEmployee,
      departmentOptions,
      employeeOptions,
      kpis,
      typeOptions,
      typeSummary,
    ],
  );

  const typeStatsColumns = useMemo((): StatsDataGridColumn<TypeSummaryRow>[] => {
    return [
      {
        id: 'name',
        label: txt('adminFormStats.typeCol'),
        align: 'left',
        minWidth: 160,
        sticky: true,
        sortable: true,
        getSortValue: (row) => row.name,
      },
      {
        id: 'total',
        label: txt('adminFormStats.totalCol'),
        align: 'center',
        sortable: true,
        getSortValue: (row) => row.total,
      },
      {
        id: 'da_duyet',
        label: txt('adminFormStats.approvedCol'),
        align: 'center',
        sortable: true,
        getSortValue: (row) => row.da_duyet,
      },
      {
        id: 'cho_duyet',
        label: txt('adminFormStats.pendingCol'),
        align: 'center',
        sortable: true,
        getSortValue: (row) => row.cho_duyet,
      },
      {
        id: 'tu_choi',
        label: txt('adminFormStats.rejectedCol'),
        align: 'center',
        sortable: true,
        getSortValue: (row) => row.tu_choi,
      },
      {
        id: 'tong_ngay',
        label: txt('adminFormStats.daysCol'),
        align: 'center',
        sortable: true,
        getSortValue: (row) => row.tong_ngay,
      },
      {
        id: 'avg_ngay',
        label: txt('adminFormStats.avgDaysCol'),
        align: 'center',
        sortable: true,
        getSortValue: (row) => row.avg_ngay,
      },
    ];
  }, []);

  const renderTypeStatsCell = useCallback((colId: string, row: TypeSummaryRow) => {
    switch (colId) {
      case 'name':
        return (
          <span className="max-w-[14rem] truncate font-medium sm:max-w-none" title={row.name}>
            {row.name}
          </span>
        );
      case 'total':
        return <span className="font-semibold tabular-nums">{row.total}</span>;
      case 'da_duyet':
        return (
          <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
            {row.da_duyet}
          </span>
        );
      case 'cho_duyet':
        return (
          <span className="font-medium tabular-nums text-amber-600 dark:text-amber-400">
            {row.cho_duyet}
          </span>
        );
      case 'tu_choi':
        return <span className="tabular-nums text-rose-600 dark:text-rose-400">{row.tu_choi}</span>;
      case 'tong_ngay':
        return <span className="font-medium tabular-nums">{row.tong_ngay}</span>;
      case 'avg_ngay':
        return <span className="tabular-nums text-muted-foreground">{row.avgLabel}</span>;
      default:
        return null;
    }
  }, []);

  const drillDownColumns = useMemo((): StatsDataGridColumn<PhieuHanhChinh>[] => {
    return [
      {
        id: 'ten_loai_phieu',
        label: txt('adminForm.store.typeCol'),
        align: 'left',
        minWidth: 140,
        sticky: true,
        sortable: true,
        getSortValue: (row) => row.ten_loai_phieu ?? '',
      },
      {
        id: 'ten_nhan_vien',
        label: txt('adminForm.store.employeeCol'),
        align: 'left',
        minWidth: 120,
        sortable: true,
        getSortValue: (row) => row.ten_nhan_vien ?? '',
      },
      {
        id: 'ten_phong_ban',
        label: txt('adminForm.filterDepartment'),
        align: 'left',
        minWidth: 120,
        sortable: true,
        getSortValue: (row) => row.ten_phong_ban ?? '',
      },
      {
        id: 'tu_ngay',
        label: txt('adminForm.form.fromDate'),
        align: 'center',
        sortable: true,
        getSortValue: (row) => row.tu_ngay,
      },
      {
        id: 'den_ngay',
        label: txt('adminForm.form.toDate'),
        align: 'center',
        sortable: true,
        getSortValue: (row) => row.den_ngay,
      },
      {
        id: 'so_ngay',
        label: txt('adminFormStats.daysCol'),
        align: 'center',
        sortable: true,
        getSortValue: (row) => computeSoNgay(row.tu_ngay, row.den_ngay),
      },
      {
        id: 'trang_thai',
        label: txt('adminForm.store.statusCol'),
        align: 'center',
        sortable: true,
        getSortValue: (row) => row.trang_thai,
      },
    ];
  }, []);

  const renderDrillDownCell = useCallback((colId: string, row: PhieuHanhChinh) => {
    switch (colId) {
      case 'ten_loai_phieu':
        return (
          <span className="font-medium truncate max-w-[14rem]" title={row.ten_loai_phieu ?? ''}>
            {row.ten_loai_phieu || '—'}
          </span>
        );
      case 'ten_nhan_vien':
        return <span className="text-muted-foreground">{row.ten_nhan_vien || '—'}</span>;
      case 'ten_phong_ban':
        return <span className="text-muted-foreground">{row.ten_phong_ban || '—'}</span>;
      case 'tu_ngay':
        return (
          <span className="tabular-nums text-muted-foreground">
            {row.tu_ngay ? formatDate(row.tu_ngay) : '—'}
          </span>
        );
      case 'den_ngay':
        return (
          <span className="tabular-nums text-muted-foreground">
            {row.den_ngay ? formatDate(row.den_ngay) : '—'}
          </span>
        );
      case 'so_ngay':
        return (
          <span className="font-medium tabular-nums">
            {computeSoNgay(row.tu_ngay, row.den_ngay)}
          </span>
        );
      case 'trang_thai':
        return <PhieuHanhChinhStatusBadge value={row.trang_thai} truncate />;
      default:
        return null;
    }
  }, []);

  const resolvedViewing = useMemo(() => {
    if (!viewing) return null;
    return drillItems.find((d) => d.id === viewing.id) ?? viewing;
  }, [drillItems, viewing]);

  if (isLoading && !typeSummary.length) {
    return <LoadingSpinnerWithText text={txt('adminFormStats.loading')} />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <DashboardToolbar
        activeFilterCount={activeFilterCount}
        onClearFilters={() => {
          setFilterType([]);
          setFilterStatus([]);
          setFilterDepartment([]);
          setFilterEmployee([]);
          setDateRangePreset(DEFAULT_STATS_DATE_PRESET_ID);
          setCustomStart('');
          setCustomEnd('');
        }}
        filters={
          <>
            <DateRangePicker
              presets={DATE_RANGE_PRESETS.map((p) => ({ id: p.id, label: p.label }))}
              value={{ preset: dateRangePreset, customStart, customEnd }}
              onChange={(v) => {
                setDateRangePreset(v.preset as DateRangePresetId);
                setCustomStart(v.customStart);
                setCustomEnd(v.customEnd);
              }}
              displayLabel={
                isAllStatsDateRange(dateRangePreset) ? undefined : dateRange.label
              }
              placeholder={txt('employee.stats.dateRangePlaceholder')}
            />
            <FilterChipMultiSelect
              options={typeOptions}
              value={filterType}
              onChange={setFilterType}
              icon={FileType2}
              placeholder={txt('adminFormStats.filterType')}
              className="w-[160px]"
            />
            <FilterChipMultiSelect
              options={PHIEU_HANH_CHINH_STATUS_OPTIONS}
              value={filterStatus}
              onChange={setFilterStatus}
              icon={Tag}
              placeholder={txt('adminFormStats.filterStatus')}
              className="w-[140px]"
            />
            <FilterChipMultiSelect
              options={departmentOptions}
              value={filterDepartment}
              onChange={setFilterDepartment}
              icon={Building2}
              placeholder={txt('adminFormStats.filterDepartment')}
              className="w-[148px]"
            />
            <FilterChipMultiSelect
              options={employeeOptions}
              value={filterEmployee}
              onChange={setFilterEmployee}
              icon={UserRound}
              placeholder={txt('adminFormStats.filterEmployee')}
              className="w-[148px]"
            />
          </>
        }
        actions={
          <>
            <StatsKpiConfigPopover
              visibleKpiIds={visibleKpiIds}
              onToggle={handleToggleKpi}
            />
            {canExport ? (
              <StatsExportDropdown onExport={handleExportReport} compact={!isMdUp} />
            ) : null}
          </>
        }
      />

      <StatsKpiGrid items={kpis} columns={3} />

      <Suspense fallback={<ChartsFallback />}>
        <AdminFormStatsCharts
          chartsVisible={chartsVisible}
          chartHeight={chartHeight}
          isMdUp={isMdUp}
          primaryHex={primaryHex}
          typeData={typeData}
          statusData={statusData}
          trendData={trendData}
          departmentData={departmentData}
          onTypeDrillDown={(typeId) => {
            const label = getTenLoaiPhieu(typeId) ?? typeId;
            setDrillDown({ kind: 'type', typeId, label });
          }}
          onStatusDrillDown={(status) => {
            const label =
              PHIEU_HANH_CHINH_STATUS_OPTIONS.find((s) => s.value === status)?.label ??
              status;
            setDrillDown({ kind: 'status', status, label });
          }}
          onDepartmentDrillDown={(departmentId) => {
            const label =
              departmentData.find((c) => c.id === departmentId)?.name ??
              departmentId ??
              '—';
            setDrillDown({ kind: 'department', departmentId, label });
          }}
        />
      </Suspense>

      <StatsDataGrid
        title={txt('adminFormStats.typeTable')}
        columns={typeStatsColumns}
        rows={typeSummary}
        getRowKey={(row) => row.id}
        renderCell={renderTypeStatsCell}
        onRowClick={(row) =>
          setDrillDown({ kind: 'type', typeId: row.id, label: row.name })
        }
      />

      <StatsDrillDownDialog
        open={!!drillDown}
        onClose={() => setDrillDown(null)}
        title={txt('adminFormStats.drillTitle')}
        subtitle={
          drillDown
            ? txt('stats.drillDown.subtitle', {
                count: drillItems.length,
                label: drillDown.label,
              })
            : undefined
        }
        columns={drillDownColumns}
        rows={drillItems}
        getRowKey={(row) => row.id}
        renderCell={renderDrillDownCell}
        onRowClick={(row) => setViewing(row)}
      />

      {resolvedViewing && (
        <PhieuHanhChinhDetail
          data={resolvedViewing}
          onClose={() => setViewing(null)}
          onEdit={() => setViewing(null)}
          onDelete={(id) => {
            deleteMutation.mutate([id], {
              onSuccess: () => setViewing(null),
            });
          }}
          stackLevel={1}
        />
      )}
    </div>
  );
};

export default ThongKePhieuHanhChinhPage;
