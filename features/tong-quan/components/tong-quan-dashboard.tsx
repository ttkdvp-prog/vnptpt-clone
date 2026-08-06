'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  Briefcase,
  Building2,
  CalendarOff,
  MonitorPlay,
  Plane,
  Tag,
  UserCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { txt } from '@/lib/text';
import { useNavigate } from '@/lib/navigation';
import { cn, getAvatarUrl } from '@/lib/utils';
import Button from '@/components/ui/Button';
import DashboardToolbar from '@/components/shared/DashboardToolbar';
import FilterChipMultiSelect from '@/components/shared/FilterChipMultiSelect';
import LoadingSpinnerWithText from '@/components/shared/LoadingSpinnerWithText';
import StatsKpiGrid from '@/components/shared/stats/StatsKpiGrid';
import StatsDataGrid from '@/components/shared/stats/StatsDataGrid';
import type { StatsDataGridColumn, StatsKpiCardItem } from '@/components/shared/stats/types';
import type { FilterGroup } from '@/components/ui/MobileFilterSheet';
import { useDepartments } from '@/features/he-thong/phong-ban/hooks/use-phong-ban';
import { useTvNhanSuData } from '@/features/tong-quan/hooks/use-tv-nhan-su-data';
import type { TvDeptBreakdownRow, TvRosterRow } from '@/features/tong-quan/core/types';
import {
  DASHBOARD_SECTIONS,
  ROSTER_STATUS_FILTER_VALUES,
  type DashboardSectionId,
} from '@/features/tong-quan/core/dashboard-sections';

type BreakdownRow = TvDeptBreakdownRow & { id: string };

function pctLabel(part: number, total: number): string {
  if (total <= 0) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}

/** Gom roster theo phòng ban / chức vụ — nghỉ phép = onLeave; còn lại (kể cả công tác) = present. */
function aggregateRosterBy(
  roster: TvRosterRow[],
  getName: (row: TvRosterRow) => string,
): BreakdownRow[] {
  const map = new Map<string, BreakdownRow>();
  for (const row of roster) {
    const name = getName(row);
    let agg = map.get(name);
    if (!agg) {
      agg = { id: name, name, workforce: 0, onLeave: 0, present: 0 };
      map.set(name, agg);
    }
    agg.workforce += 1;
    if (row.status === 'nghi') agg.onLeave += 1;
    else agg.present += 1;
  }
  return [...map.values()].sort((a, b) => b.workforce - a.workforce);
}

function StatusChip({ status }: { status: TvRosterRow['status'] }) {
  const styles =
    status === 'lam_viec'
      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
      : status === 'cong_tac'
        ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20'
        : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20';
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border',
        styles,
      )}
    >
      {txt(`overview.status.${status}`)}
    </span>
  );
}

function ComingSoonPanel({ sectionId }: { sectionId: DashboardSectionId }) {
  const section = DASHBOARD_SECTIONS.find((s) => s.id === sectionId);
  if (!section) return null;
  const Icon = section.icon;
  return (
    <div className="flex flex-col items-center justify-center text-center px-6 py-12 sm:py-16 min-h-[20rem]">
      <div className="mx-auto h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
        <Icon className="h-7 w-7 text-primary" />
      </div>
      <span className="inline-flex text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 mb-3">
        {txt('overview.comingSoon.badge')}
      </span>
      <h2 className="text-lg font-semibold text-foreground">{txt(section.titleKey)}</h2>
      <p className="text-sm text-muted-foreground mt-2 leading-relaxed max-w-md">
        {txt(section.descKey)}
      </p>
    </div>
  );
}

function SectionNavColumn({
  section,
  onSelect,
}: {
  section: DashboardSectionId;
  onSelect: (id: DashboardSectionId) => void;
}) {
  return (
    <nav
      className="flex flex-col gap-1 p-2.5 h-full min-h-0"
      aria-label={txt('overview.dashboard.sectionNav')}
    >
      <div className="flex md:flex-col gap-1 overflow-x-auto md:overflow-y-auto no-scrollbar md:custom-scrollbar min-h-0">
        {DASHBOARD_SECTIONS.map((item) => {
          const Icon = item.icon;
          const active = section === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cn(
                'flex items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left transition-colors shrink-0 md:shrink md:w-full',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-sm font-medium truncate">{txt(item.titleKey)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function NhanSuDashboardBody() {
  const navigate = useNavigate();
  const { data, isLoading } = useTvNhanSuData();
  const { data: departments = [] } = useDepartments();

  const [deptFilter, setDeptFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);

  const roster = useMemo(() => data?.roster ?? [], [data?.roster]);

  const deptOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of roster) {
      const key = r.ten_phong_ban?.trim() || '__none__';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    const fromDepts = departments
      .filter((d) => d.trang_thai !== 'Ngừng hoạt động')
      .map((d) => ({
        value: d.ten_phong_ban,
        label: d.ten_phong_ban,
        count: counts.get(d.ten_phong_ban) ?? 0,
      }));
    const noneCount = counts.get('__none__') ?? 0;
    if (noneCount > 0) {
      fromDepts.push({
        value: '__none__',
        label: txt('overview.dashboard.noDepartment'),
        count: noneCount,
      });
    }
    return fromDepts;
  }, [departments, roster]);

  const statusOptions = useMemo(
    () =>
      ROSTER_STATUS_FILTER_VALUES.map((value) => ({
        value,
        label: txt(`overview.status.${value}`),
        count: roster.filter((r) => r.status === value).length,
      })),
    [roster],
  );

  const filteredRoster = useMemo(() => {
    return roster.filter((r) => {
      if (deptFilter.length > 0) {
        const key = r.ten_phong_ban?.trim() || '__none__';
        if (!deptFilter.includes(key)) return false;
      }
      if (statusFilter.length > 0) {
        if (!statusFilter.includes(r.status)) return false;
      }
      return true;
    });
  }, [roster, deptFilter, statusFilter]);

  const filteredDeptRows = useMemo(
    () =>
      aggregateRosterBy(
        filteredRoster,
        (r) => r.ten_phong_ban?.trim() || txt('overview.dashboard.noDepartment'),
      ),
    [filteredRoster],
  );

  const filteredPosRows = useMemo(
    () =>
      aggregateRosterBy(
        filteredRoster,
        (r) => r.ten_chuc_vu?.trim() || txt('overview.dashboard.noPosition'),
      ),
    [filteredRoster],
  );

  /** KPI recount from filtered roster when filters active */
  const kpiSource = useMemo(() => {
    const useFilter = deptFilter.length > 0 || statusFilter.length > 0;
    if (!useFilter || !data) {
      return {
        workforce: data?.workforce ?? 0,
        presentToday: data?.presentToday ?? 0,
        onLeave: data?.onLeave ?? 0,
        onTrip: data?.onTrip ?? 0,
        probation: data?.probation ?? 0,
      };
    }
    const base =
      deptFilter.length > 0
        ? roster.filter((r) => {
            const key = r.ten_phong_ban?.trim() || '__none__';
            return deptFilter.includes(key);
          })
        : roster;
    return {
      workforce: base.length,
      presentToday: base.filter((r) => r.status === 'lam_viec').length,
      onLeave: base.filter((r) => r.status === 'nghi').length,
      onTrip: base.filter((r) => r.status === 'cong_tac').length,
      probation: data.probation,
    };
  }, [data, roster, deptFilter, statusFilter]);

  const kpis: StatsKpiCardItem[] = useMemo(
    () => [
      {
        id: 'workforce',
        label: txt('overview.kpi.workforce'),
        value: kpiSource.workforce,
        icon: Users,
        color: 'text-primary',
        bg: 'bg-primary/10',
        pct: kpiSource.workforce > 0 ? '100%' : '0%',
        delta: null,
      },
      {
        id: 'present',
        label: txt('overview.kpi.presentToday'),
        value: kpiSource.presentToday,
        icon: UserCheck,
        color: 'text-emerald-600',
        bg: 'bg-emerald-500/10',
        pct: pctLabel(kpiSource.presentToday, kpiSource.workforce),
        delta: null,
      },
      {
        id: 'trip',
        label: txt('overview.kpi.onTrip'),
        value: kpiSource.onTrip,
        icon: Plane,
        color: 'text-sky-600',
        bg: 'bg-sky-500/10',
        pct: pctLabel(kpiSource.onTrip, kpiSource.workforce),
        delta: null,
      },
      {
        id: 'leave',
        label: txt('overview.kpi.onLeave'),
        value: kpiSource.onLeave,
        icon: CalendarOff,
        color: 'text-amber-600',
        bg: 'bg-amber-500/10',
        pct: pctLabel(kpiSource.onLeave, kpiSource.workforce),
        delta: null,
      },
      {
        id: 'probation',
        label: txt('overview.kpi.probation'),
        value: kpiSource.probation,
        icon: UserPlus,
        color: 'text-slate-600',
        bg: 'bg-slate-500/10',
        pct: pctLabel(kpiSource.probation, data?.workforce ?? 0),
        delta: null,
      },
    ],
    [kpiSource, data?.workforce],
  );

  const rosterColumns = useMemo((): StatsDataGridColumn<TvRosterRow>[] => {
    return [
      {
        id: 'stt',
        label: txt('overview.table.stt'),
        align: 'center',
        minWidth: 56,
      },
      {
        id: 'ho_ten',
        label: txt('overview.table.name'),
        align: 'left',
        minWidth: 200,
        sticky: true,
        sortable: true,
        getSortValue: (row) => row.ho_ten,
      },
      {
        id: 'ten_chuc_vu',
        label: txt('overview.table.position'),
        align: 'left',
        minWidth: 140,
        sortable: true,
        getSortValue: (row) => row.ten_chuc_vu ?? '',
      },
      {
        id: 'ten_phong_ban',
        label: txt('overview.table.department'),
        align: 'left',
        minWidth: 140,
        sortable: true,
        getSortValue: (row) => row.ten_phong_ban ?? '',
      },
      {
        id: 'status',
        label: txt('overview.table.status'),
        align: 'center',
        minWidth: 130,
        sortable: true,
        getSortValue: (row) => row.status,
      },
      {
        id: 'ghi_chu',
        label: txt('overview.table.note'),
        align: 'left',
        minWidth: 140,
        sortable: true,
        getSortValue: (row) => row.ghi_chu ?? '',
      },
    ];
  }, []);

  const rosterIndex = useMemo(() => {
    const map = new Map<string, number>();
    filteredRoster.forEach((r, i) => map.set(r.id, i + 1));
    return map;
  }, [filteredRoster]);

  const renderRosterCell = useCallback(
    (colId: string, row: TvRosterRow) => {
      switch (colId) {
        case 'stt':
          return (
            <span className="text-xs tabular-nums text-muted-foreground font-medium">
              {rosterIndex.get(row.id) ?? '—'}
            </span>
          );
        case 'ho_ten':
          return (
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={row.anh_dai_dien || getAvatarUrl(row.ho_ten)}
                alt=""
                className="h-8 w-8 rounded-lg object-cover shrink-0 bg-muted ring-1 ring-border"
              />
              <span className="font-medium text-foreground truncate" title={row.ho_ten}>
                {row.ho_ten}
              </span>
            </div>
          );
        case 'ten_chuc_vu':
          return (
            <span className="text-muted-foreground truncate">{row.ten_chuc_vu || '—'}</span>
          );
        case 'ten_phong_ban':
          return (
            <span className="text-muted-foreground truncate">{row.ten_phong_ban || '—'}</span>
          );
        case 'status':
          return <StatusChip status={row.status} />;
        case 'ghi_chu':
          return <span className="text-muted-foreground truncate">{row.ghi_chu || '—'}</span>;
        default:
          return null;
      }
    },
    [rosterIndex],
  );

  const breakdownMetricColumns = useMemo(
    (): StatsDataGridColumn<BreakdownRow>[] => [
      {
        id: 'workforce',
        label: txt('overview.dashboard.colTotal'),
        align: 'center',
        sortable: true,
        getSortValue: (row) => row.workforce,
      },
      {
        id: 'present',
        label: txt('overview.dashboard.colPresent'),
        align: 'center',
        sortable: true,
        getSortValue: (row) => row.present,
      },
      {
        id: 'onLeave',
        label: txt('overview.dashboard.colLeave'),
        align: 'center',
        sortable: true,
        getSortValue: (row) => row.onLeave,
      },
      {
        id: 'rate',
        label: txt('overview.dashboard.colPresentRate'),
        align: 'center',
        sortable: true,
        getSortValue: (row) => (row.workforce > 0 ? row.present / row.workforce : 0),
      },
    ],
    [],
  );

  const deptColumns = useMemo(
    (): StatsDataGridColumn<BreakdownRow>[] => [
      {
        id: 'name',
        label: txt('overview.dashboard.colDepartment'),
        align: 'left',
        sticky: true,
        minWidth: 180,
        sortable: true,
        getSortValue: (row) => row.name,
      },
      ...breakdownMetricColumns,
    ],
    [breakdownMetricColumns],
  );

  const posColumns = useMemo(
    (): StatsDataGridColumn<BreakdownRow>[] => [
      {
        id: 'name',
        label: txt('overview.dashboard.colPosition'),
        align: 'left',
        sticky: true,
        minWidth: 180,
        sortable: true,
        getSortValue: (row) => row.name,
      },
      ...breakdownMetricColumns,
    ],
    [breakdownMetricColumns],
  );

  const renderBreakdownCell = useCallback((colId: string, row: BreakdownRow) => {
    switch (colId) {
      case 'name':
        return <span className="font-medium text-foreground">{row.name}</span>;
      case 'workforce':
        return <span className="tabular-nums font-semibold">{row.workforce}</span>;
      case 'present':
        return (
          <span className="tabular-nums font-semibold text-emerald-600">{row.present}</span>
        );
      case 'onLeave':
        return <span className="tabular-nums font-semibold text-amber-600">{row.onLeave}</span>;
      case 'rate':
        return (
          <span className="tabular-nums text-muted-foreground">
            {pctLabel(row.present, row.workforce)}
          </span>
        );
      default:
        return null;
    }
  }, []);

  const activeFilterCount = deptFilter.length + statusFilter.length;

  const clearFilters = useCallback(() => {
    setDeptFilter([]);
    setStatusFilter([]);
  }, []);

  const filterGroups: FilterGroup[] = useMemo(
    () => [
      {
        key: 'dept',
        label: txt('overview.dashboard.filterDepartment'),
        icon: Building2,
        options: deptOptions.map((o) => ({
          value: o.value,
          label: o.label,
          count: o.count,
        })),
        value: deptFilter,
        onChange: setDeptFilter,
      },
      {
        key: 'status',
        label: txt('overview.dashboard.filterStatus'),
        icon: Tag,
        options: statusOptions.map((o) => ({
          value: o.value,
          label: o.label,
          count: o.count,
        })),
        value: statusFilter,
        onChange: setStatusFilter,
      },
    ],
    [deptOptions, statusOptions, deptFilter, statusFilter],
  );

  if (isLoading && !data) {
    return <LoadingSpinnerWithText text={txt('overview.dashboard.loading')} centered />;
  }

  const liveTvButton = (
    <Button
      type="button"
      size="sm"
      onClick={() => navigate('/tong-quan/tv')}
      className="shrink-0 gap-1.5"
      title={txt('overview.liveTvHint')}
    >
      <MonitorPlay className="h-4 w-4" />
      {txt('overview.liveTv')}
    </Button>
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      <DashboardToolbar
        className="static z-auto"
        filters={
          <>
            <FilterChipMultiSelect
              options={deptOptions}
              value={deptFilter}
              onChange={setDeptFilter}
              placeholder={txt('overview.dashboard.filterDepartment')}
              icon={Building2}
              className="w-full sm:w-[160px]"
            />
            <FilterChipMultiSelect
              options={statusOptions}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder={txt('overview.dashboard.filterStatus')}
              icon={Tag}
              className="w-full sm:w-[150px]"
            />
          </>
        }
        actions={liveTvButton}
        mobileActions={liveTvButton}
        filterGroups={filterGroups}
        activeFilterCount={activeFilterCount}
        onClearFilters={clearFilters}
      />

      <div className="min-h-0 flex-1 flex flex-col gap-3 p-3 sm:p-4 overflow-hidden">
        <StatsKpiGrid items={kpis} columns={4} className="shrink-0 lg:grid-cols-5" />

        <div className="min-h-0 flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(17rem,22rem)] gap-3 overflow-y-auto lg:overflow-hidden custom-scrollbar">
          <StatsDataGrid
            title={txt('overview.boardTitle')}
            icon={Users}
            rows={filteredRoster}
            columns={rosterColumns}
            getRowKey={(row) => row.id}
            renderCell={renderRosterCell}
            emptyTitle={txt('overview.table.empty')}
            emptyDescription={
              activeFilterCount > 0
                ? txt('overview.dashboard.noDataFiltered')
                : undefined
            }
            hideFooter
            fillHeight
            className="min-h-[22rem] lg:min-h-0 h-full"
            tableMinWidth="min-w-[40rem]"
          />

          <div className="min-h-0 flex flex-col gap-3 h-full overflow-hidden">
            <StatsDataGrid
              title={txt('overview.dashboard.byDepartment')}
              icon={Building2}
              rows={filteredDeptRows}
              columns={deptColumns}
              getRowKey={(row) => row.id}
              renderCell={renderBreakdownCell}
              emptyTitle={txt('overview.dashboard.emptyDept')}
              hideFooter
              fillHeight
              className="min-h-[12rem] lg:min-h-0 flex-1"
              tableMinWidth="min-w-[20rem]"
            />

            <StatsDataGrid
              title={txt('overview.dashboard.byPosition')}
              icon={Briefcase}
              rows={filteredPosRows}
              columns={posColumns}
              getRowKey={(row) => row.id}
              renderCell={renderBreakdownCell}
              emptyTitle={txt('overview.dashboard.emptyPosition')}
              hideFooter
              fillHeight
              className="min-h-[12rem] lg:min-h-0 flex-1"
              tableMinWidth="min-w-[20rem]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function LiveTvToolbarAction() {
  const navigate = useNavigate();
  return (
    <Button
      type="button"
      size="sm"
      onClick={() => navigate('/tong-quan/tv')}
      className="shrink-0 gap-1.5"
      title={txt('overview.liveTvHint')}
    >
      <MonitorPlay className="h-4 w-4" />
      {txt('overview.liveTv')}
    </Button>
  );
}

export function TongQuanDashboard() {
  const [section, setSection] = useState<DashboardSectionId>('nhan-su');

  return (
    <div className="flex flex-col h-[calc(100dvh-8.5rem)] min-h-[36rem] min-w-0">
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[12.5rem_minmax(0,1fr)] rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        {/* Cột 1: chức năng */}
        <aside className="min-h-0 border-b md:border-b-0 md:border-r border-border/70 bg-muted/20 md:overflow-y-auto">
          <SectionNavColumn section={section} onSelect={setSection} />
        </aside>

        {/* Cột 2: dữ liệu */}
        <section className="min-h-0 min-w-0 flex flex-col overflow-hidden">
          {section === 'nhan-su' ? (
            <NhanSuDashboardBody />
          ) : (
            <div className="flex flex-col h-full min-h-0">
              <DashboardToolbar
                className="static z-auto"
                actions={<LiveTvToolbarAction />}
                mobileActions={<LiveTvToolbarAction />}
              />
              <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">
                <ComingSoonPanel sectionId={section} />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
