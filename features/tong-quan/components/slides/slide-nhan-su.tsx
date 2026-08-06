'use client';

import dayjs from 'dayjs';
import {
  Building2,
  CalendarOff,
  Plane,
  UserCheck,
  UserPlus,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { txt } from '@/lib/text';
import { cn, getAvatarUrl } from '@/lib/utils';
import { useTvNhanSuData } from '@/features/tong-quan/hooks/use-tv-nhan-su-data';
import type {
  TvDeptBreakdownRow,
  TvRosterRow,
  TvRosterStatus,
} from '@/features/tong-quan/core/types';
import { TV_SURFACE, TV_TONES, type TvToneId } from '@/features/tong-quan/components/tv-theme';

function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}

function AnimatedValue({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <span key={value} className={cn('tv-value-pulse inline-block tabular-nums', className)}>
      {value}
    </span>
  );
}

function KpiCard({
  label,
  value,
  percent,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  percent: number;
  icon: LucideIcon;
  tone: TvToneId;
}) {
  const t = TV_TONES[tone];

  return (
    <div className={cn(TV_SURFACE, 'px-3.5 py-3 min-w-0')}>
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
            t.iconBg,
            t.iconFg,
          )}
        >
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-white/45 truncate">{label}</p>
          <div className="mt-0.5 flex items-baseline gap-2">
            <p className={cn('text-3xl xl:text-4xl font-semibold tracking-tight leading-none', t.value)}>
              <AnimatedValue value={value} />
            </p>
            <span className="text-sm font-semibold text-white/35 tabular-nums">{percent}%</span>
          </div>
        </div>
      </div>
      <div className="mt-2.5 h-1.5 rounded-lg bg-white/10 overflow-hidden">
        <div
          className={cn('h-full rounded-lg transition-[width] duration-500', t.bar)}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: TvRosterStatus }) {
  const styles: Record<TvRosterStatus, string> = {
    lam_viec: 'bg-success/15 text-success border-success/25',
    cong_tac: 'bg-info/15 text-info border-info/25',
    nghi: 'bg-warning/15 text-warning border-warning/25',
  };
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border whitespace-nowrap',
        styles[status],
      )}
    >
      {txt(`overview.status.${status}`)}
    </span>
  );
}

function RosterRow({ row, index }: { row: TvRosterRow; index: number }) {
  return (
    <tr className="[&>td]:border-b [&>td]:border-white/[0.06] hover:bg-white/[0.03] transition-colors">
      <td className="px-3 py-2.5 text-sm text-white/40 tabular-nums w-14">{index + 1}</td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src={row.anh_dai_dien || getAvatarUrl(row.ho_ten)}
            alt=""
            className="h-8 w-8 rounded-lg object-cover shrink-0 ring-1 ring-white/10 bg-white/10"
          />
          <span className="text-sm font-semibold text-white truncate">{row.ho_ten}</span>
        </div>
      </td>
      <td className="px-3 py-2.5 text-sm text-white/55 truncate hidden md:table-cell max-w-[10rem]">
        {row.ten_chuc_vu || '—'}
      </td>
      <td className="px-3 py-2.5 text-sm text-white/55 truncate hidden lg:table-cell max-w-[10rem]">
        {row.ten_phong_ban || '—'}
      </td>
      <td className="px-3 py-2.5">
        <StatusBadge status={row.status} />
      </td>
      <td className="px-3 py-2.5 text-sm text-white/40 truncate hidden sm:table-cell max-w-[12rem]">
        {row.ghi_chu || '—'}
      </td>
    </tr>
  );
}

/** Always fills parent height; only this region scrolls when content overflows. */
function RosterTable({ rows, isHeld }: { rows: TvRosterRow[]; isHeld: boolean }) {
  if (rows.length === 0) {
    return (
      <div
        className={cn(
          TV_SURFACE,
          'h-full min-h-0 flex items-center justify-center text-white/40 text-sm',
        )}
      >
        {txt('overview.table.empty')}
      </div>
    );
  }

  const autoScroll = !isHeld && rows.length > 10;

  return (
    <div className={cn(TV_SURFACE, 'h-full min-h-0 overflow-hidden flex flex-col')}>
      <div className="min-h-0 flex-1 overflow-hidden relative">
        <div
          className={cn(
            autoScroll
              ? 'tv-roster-scroll'
              : 'h-full overflow-y-auto overflow-x-auto custom-scrollbar',
          )}
        >
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10">
              <tr className="bg-zinc-950/95 backdrop-blur-sm">
                {(
                  [
                    [txt('overview.table.stt'), 'w-14', ''],
                    [txt('overview.table.name'), '', ''],
                    [txt('overview.table.position'), '', 'hidden md:table-cell'],
                    [txt('overview.table.department'), '', 'hidden lg:table-cell'],
                    [txt('overview.table.status'), '', ''],
                    [txt('overview.table.note'), '', 'hidden sm:table-cell'],
                  ] as const
                ).map(([label, width, visibility]) => (
                  <th
                    key={label}
                    className={cn(
                      'px-3 py-2.5 text-xs font-semibold text-white/45 border-b border-white/10',
                      width,
                      visibility,
                    )}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <RosterRow key={row.id} row={row} index={index} />
              ))}
            </tbody>
          </table>
          {autoScroll ? (
            <table className="w-full text-left border-collapse" aria-hidden>
              <tbody>
                {rows.map((row, index) => (
                  <RosterRow key={`dup-${row.id}`} row={row} index={index} />
                ))}
              </tbody>
            </table>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function DeptPanel({ rows }: { rows: TvDeptBreakdownRow[] }) {
  return (
    <div className={cn(TV_SURFACE, 'h-full min-h-0 flex flex-col overflow-hidden')}>
      <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-white/10">
        <Building2 className="h-3.5 w-3.5 text-primary shrink-0" />
        <h3 className="text-xs font-semibold text-white/80 truncate">
          {txt('overview.dashboard.byDepartment')}
        </h3>
      </div>
      {rows.length === 0 ? (
        <div className="flex-1 flex items-center justify-center px-3 text-xs text-white/40 text-center">
          {txt('overview.dashboard.emptyDept')}
        </div>
      ) : (
        <ul className="flex-1 min-h-0 px-2.5 py-2 space-y-1.5 overflow-hidden">
          {rows.map((row) => {
            const rate = pct(row.present, row.workforce);
            return (
              <li
                key={row.id ?? row.name}
                className="rounded-lg px-2 py-1.5 bg-white/[0.03] border border-white/[0.06]"
              >
                <div className="flex items-center justify-between gap-2 min-w-0">
                  <p className="text-xs font-medium text-white/85 truncate" title={row.name}>
                    {row.name}
                  </p>
                  <span className="text-xs tabular-nums text-white/40 shrink-0">
                    {row.workforce}
                  </span>
                </div>
                <div className="mt-1 flex items-center gap-2 text-[11px] tabular-nums">
                  <span className="text-success">
                    {txt('overview.dashboard.colPresent')} {row.present}
                  </span>
                  <span className="text-white/20">·</span>
                  <span className="text-warning">
                    {txt('overview.dashboard.colLeave')} {row.onLeave}
                  </span>
                </div>
                <div className="mt-1.5 h-1 rounded-lg bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-lg bg-success/80"
                    style={{ width: `${rate}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export interface SlideNhanSuProps {
  isHeld?: boolean;
}

export function SlideNhanSu({ isHeld = false }: SlideNhanSuProps) {
  const { data, isLoading, isError, dataUpdatedAt } = useTvNhanSuData();
  const snapshot = data;

  if (isLoading && !snapshot) {
    return (
      <div className="h-full flex items-center justify-center text-white/40 text-sm gap-3">
        <Users className="h-6 w-6 animate-pulse text-primary" />
        <span>…</span>
      </div>
    );
  }

  const workforce = snapshot?.workforce ?? 0;
  const presentToday = snapshot?.presentToday ?? 0;
  const onLeave = snapshot?.onLeave ?? 0;
  const onTrip = snapshot?.onTrip ?? 0;
  const probation = snapshot?.probation ?? 0;
  const byDepartment = snapshot?.byDepartment ?? [];

  const updatedLabel = dataUpdatedAt
    ? txt('overview.updatedAt', { time: dayjs(dataUpdatedAt).format('HH:mm') })
    : null;

  return (
    <div className="h-full flex flex-col gap-3 min-h-0 overflow-hidden">
      <div className="flex items-end justify-between gap-3 shrink-0 px-0.5">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-white tracking-tight">
            {txt('overview.boardTitle')}
          </h2>
          <p className="mt-1 text-xs text-white/45 flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-60" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-success" />
            </span>
            {txt('overview.realtimeUpdate')}
            {updatedLabel ? ` · ${updatedLabel}` : ''}
            {isError
              ? ` · ${txt('overview.connectionLost', { time: dayjs().format('HH:mm') })}`
              : ''}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5 shrink-0">
        <KpiCard
          label={txt('overview.kpi.workforce')}
          value={workforce}
          percent={100}
          icon={Users}
          tone="primary"
        />
        <KpiCard
          label={txt('overview.kpi.presentToday')}
          value={presentToday}
          percent={pct(presentToday, workforce)}
          icon={UserCheck}
          tone="success"
        />
        <KpiCard
          label={txt('overview.kpi.onTrip')}
          value={onTrip}
          percent={pct(onTrip, workforce)}
          icon={Plane}
          tone="info"
        />
        <KpiCard
          label={txt('overview.kpi.onLeave')}
          value={onLeave}
          percent={pct(onLeave, workforce)}
          icon={CalendarOff}
          tone="warning"
        />
        <KpiCard
          label={txt('overview.kpi.probation')}
          value={probation}
          percent={pct(probation, workforce)}
          icon={UserPlus}
          tone="muted"
        />
      </div>

      <div className="min-h-0 flex-1 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(14rem,18rem)] gap-3 overflow-hidden">
        <div className="min-h-0 min-w-0 h-full overflow-hidden">
          <RosterTable rows={snapshot?.roster ?? []} isHeld={isHeld} />
        </div>
        <div className="min-h-0 h-full overflow-hidden hidden lg:block">
          <DeptPanel rows={byDepartment} />
        </div>
      </div>
    </div>
  );
}
