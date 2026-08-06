import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { FolderCog, Tag, UserRound } from 'lucide-react';
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
import { DocumentStatusBadge } from '@/features/hanh-chinh/danh-sach-tai-lieu/components/document-badges';
import DanhSachTaiLieuDetail from '@/features/hanh-chinh/danh-sach-tai-lieu/components/danh-sach-tai-lieu-detail';
import type { DanhSachTaiLieu } from '@/features/hanh-chinh/danh-sach-tai-lieu/core/types';
import { DOCUMENT_STATUS_OPTIONS } from '@/features/hanh-chinh/danh-sach-tai-lieu/core/types';
import { useLoaiTaiLieu } from '@/features/hanh-chinh/thiet-lap-tai-lieu/loai-tai-lieu/hooks/use-loai-tai-lieu';
import {
  useDanhSachTaiLieu,
  useDeleteDanhSachTaiLieu,
} from '@/features/hanh-chinh/danh-sach-tai-lieu/hooks/use-danh-sach-tai-lieu';
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
import { useDocumentStats } from '../hooks/use-document-stats';
import {
  exportDocumentStatsToExcel,
  exportDocumentStatsToPdf,
} from '../utils/export-stats-report';
import StatsKpiConfigPopover from './StatsKpiConfigPopover';

const DocumentStatsCharts = lazy(() => import('./DocumentStatsCharts'));

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
  | { kind: 'creator'; creatorId: string | null; label: string };

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

const ThongKeTaiLieuPage: React.FC = () => {
  const { data: types = [] } = useLoaiTaiLieu();
  const { data: documents = [] } = useDanhSachTaiLieu();
  const canExport = useCan('export', 'documentList');
  const { hex: primaryHex } = usePrimaryColor();
  const isMdUp = useMediaQuery('(min-width: 768px)');
  const chartHeight = isMdUp ? STATS_CHART_HEIGHT : STATS_CHART_HEIGHT_MOBILE;
  const deleteMutation = useDeleteDanhSachTaiLieu();

  const [filterType, setFilterType] = useState<string[]>([]);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterCreator, setFilterCreator] = useState<string[]>([]);
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePresetId>(
    DEFAULT_STATS_DATE_PRESET_ID,
  );
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [chartsVisible, setChartsVisible] = useState(false);
  const [visibleKpiIds, setVisibleKpiIds] = useState<string[]>(loadVisibleKpiIds);
  const [drillDown, setDrillDown] = useState<DrillDownState | null>(null);
  const [viewing, setViewing] = useState<DanhSachTaiLieu | null>(null);

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
    creatorData,
    typeSummary,
    drillItems,
  } = useDocumentStats({
    filterType,
    filterStatus,
    filterCreator,
    dateRange,
    visibleKpiIds,
    drillDown: drillDown
      ? drillDown.kind === 'type'
        ? { kind: 'type', typeId: drillDown.typeId }
        : drillDown.kind === 'status'
          ? { kind: 'status', status: drillDown.status }
          : { kind: 'creator', creatorId: drillDown.creatorId }
      : null,
  });

  const activeFilterCount =
    (filterType.length > 0 ? 1 : 0) +
    (filterStatus.length > 0 ? 1 : 0) +
    (filterCreator.length > 0 ? 1 : 0) +
    (isAllStatsDateRange(dateRangePreset) ? 0 : 1);

  const typeOptions = useMemo(
    () => types.map((t) => ({ value: t.id, label: t.ten_loai_tai_lieu })),
    [types],
  );

  const creatorOptions = useMemo(() => {
    const labels = new Map<string, string>();
    for (const item of documents) {
      if (!item.nguoi_tao) continue;
      if (!labels.has(item.nguoi_tao)) {
        labels.set(item.nguoi_tao, item.ten_nguoi_tao?.trim() || item.nguoi_tao);
      }
    }
    return [...labels.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }, [documents]);

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
        filterStatusLabels: DOCUMENT_STATUS_OPTIONS.filter((o) =>
          filterStatus.includes(o.value),
        ).map((o) => o.label),
        filterCreatorLabels: creatorOptions
          .filter((o) => filterCreator.includes(o.value))
          .map((o) => o.label),
        exportedAt: formatDateTime(new Date().toISOString()),
      };
      try {
        if (format === 'excel') {
          await exportDocumentStatsToExcel(meta, kpis, typeSummary);
        } else {
          await exportDocumentStatsToPdf(meta, kpis, typeSummary);
        }
      } catch {
        toast.error(txt('documentStats.exportError'));
      }
    },
    [
      dateRange.label,
      dateRangePreset,
      filterStatus,
      filterType,
      filterCreator,
      creatorOptions,
      kpis,
      typeOptions,
      typeSummary,
    ],
  );

  const typeStatsColumns = useMemo((): StatsDataGridColumn<TypeSummaryRow>[] => {
    return [
      {
        id: 'name',
        label: txt('documentStats.typeCol'),
        align: 'left',
        minWidth: 160,
        sticky: true,
        sortable: true,
        getSortValue: (row) => row.name,
      },
      {
        id: 'total',
        label: txt('documentStats.totalCol'),
        align: 'center',
        sortable: true,
        getSortValue: (row) => row.total,
      },
      {
        id: 'du_thao',
        label: txt('documentStats.draftCol'),
        align: 'center',
        sortable: true,
        getSortValue: (row) => row.du_thao,
      },
      {
        id: 'hieu_luc',
        label: txt('documentStats.activeCol'),
        align: 'center',
        sortable: true,
        getSortValue: (row) => row.hieu_luc,
      },
      {
        id: 'cho_sua',
        label: txt('documentStats.pendingCol'),
        align: 'center',
        sortable: true,
        getSortValue: (row) => row.cho_sua,
      },
      {
        id: 'loi_thoi',
        label: txt('documentStats.obsoleteCol'),
        align: 'center',
        sortable: true,
        getSortValue: (row) => row.loi_thoi,
      },
      {
        id: 'rate',
        label: txt('documentStats.rateCol'),
        align: 'center',
        sortable: true,
        getSortValue: (row) => parseFloat(row.rate) || 0,
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
      case 'du_thao':
        return <span className="tabular-nums text-muted-foreground">{row.du_thao}</span>;
      case 'hieu_luc':
        return (
          <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
            {row.hieu_luc}
          </span>
        );
      case 'cho_sua':
        return (
          <span className="font-medium tabular-nums text-amber-600 dark:text-amber-400">
            {row.cho_sua}
          </span>
        );
      case 'loi_thoi':
        return <span className="tabular-nums text-rose-600 dark:text-rose-400">{row.loi_thoi}</span>;
      case 'rate':
        return (
          <div className="flex items-center justify-center gap-1.5">
            <div className="h-1.5 w-14 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary" style={{ width: row.rate }} />
            </div>
            <span className="font-medium tabular-nums text-muted-foreground">{row.rate}</span>
          </div>
        );
      default:
        return null;
    }
  }, []);

  const drillDownColumns = useMemo((): StatsDataGridColumn<DanhSachTaiLieu>[] => {
    return [
      {
        id: 'ten_tai_lieu',
        label: txt('document.store.nameCol'),
        align: 'left',
        minWidth: 180,
        sticky: true,
        sortable: true,
        getSortValue: (row) => row.ten_tai_lieu,
      },
      {
        id: 'ten_loai_tai_lieu',
        label: txt('document.store.typeCol'),
        align: 'left',
        minWidth: 120,
        sortable: true,
        getSortValue: (row) => row.ten_loai_tai_lieu ?? '',
      },
      {
        id: 'trang_thai',
        label: txt('document.store.statusCol'),
        align: 'center',
        sortable: true,
        getSortValue: (row) => row.trang_thai,
      },
      {
        id: 'ten_nguoi_tao',
        label: txt('document.store.creatorCol'),
        align: 'left',
        minWidth: 120,
        sortable: true,
        getSortValue: (row) => row.ten_nguoi_tao ?? row.nguoi_tao ?? '',
      },
      {
        id: 'tg_tao',
        label: txt('document.store.createdCol'),
        align: 'center',
        sortable: true,
        getSortValue: (row) => row.tg_tao,
      },
    ];
  }, []);

  const renderDrillDownCell = useCallback((colId: string, row: DanhSachTaiLieu) => {
    switch (colId) {
      case 'ten_tai_lieu':
        return (
          <span className="font-medium truncate max-w-[14rem]" title={row.ten_tai_lieu}>
            {row.ten_tai_lieu}
          </span>
        );
      case 'ten_loai_tai_lieu':
        return <span className="text-muted-foreground">{row.ten_loai_tai_lieu || '—'}</span>;
      case 'trang_thai':
        return <DocumentStatusBadge value={row.trang_thai} truncate />;
      case 'ten_nguoi_tao':
        return (
          <span className="text-muted-foreground">
            {row.ten_nguoi_tao || row.nguoi_tao || '—'}
          </span>
        );
      case 'tg_tao':
        return (
          <span className="tabular-nums text-muted-foreground">
            {row.tg_tao ? formatDate(row.tg_tao) : '—'}
          </span>
        );
      default:
        return null;
    }
  }, []);

  const resolvedViewing = useMemo(() => {
    if (!viewing) return null;
    return drillItems.find((d) => d.id === viewing.id) ?? viewing;
  }, [drillItems, viewing]);

  if (isLoading && !typeSummary.length) {
    return <LoadingSpinnerWithText text={txt('documentStats.loading')} />;
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3">
      <DashboardToolbar
        activeFilterCount={activeFilterCount}
        onClearFilters={() => {
          setFilterType([]);
          setFilterStatus([]);
          setFilterCreator([]);
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
              icon={FolderCog}
              placeholder={txt('documentStats.filterType')}
              className="w-[160px]"
            />
            <FilterChipMultiSelect
              options={DOCUMENT_STATUS_OPTIONS}
              value={filterStatus}
              onChange={setFilterStatus}
              icon={Tag}
              placeholder={txt('documentStats.filterStatus')}
              className="w-[140px]"
            />
            <FilterChipMultiSelect
              options={creatorOptions}
              value={filterCreator}
              onChange={setFilterCreator}
              icon={UserRound}
              placeholder={txt('documentStats.filterCreator')}
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
        <DocumentStatsCharts
          chartsVisible={chartsVisible}
          chartHeight={chartHeight}
          isMdUp={isMdUp}
          primaryHex={primaryHex}
          typeData={typeData}
          statusData={statusData}
          trendData={trendData}
          creatorData={creatorData}
          onTypeDrillDown={(typeId) => {
            const label =
              types.find((t) => t.id === typeId)?.ten_loai_tai_lieu ?? typeId;
            setDrillDown({ kind: 'type', typeId, label });
          }}
          onStatusDrillDown={(status) => {
            const label =
              DOCUMENT_STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status;
            setDrillDown({ kind: 'status', status, label });
          }}
          onCreatorDrillDown={(creatorId) => {
            const label =
              creatorData.find((c) => c.id === creatorId)?.name ??
              creatorId ??
              '—';
            setDrillDown({ kind: 'creator', creatorId, label });
          }}
        />
      </Suspense>

      <StatsDataGrid
        title={txt('documentStats.typeTable')}
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
        title={txt('documentStats.drillTitle')}
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
        <DanhSachTaiLieuDetail
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

export default ThongKeTaiLieuPage;
