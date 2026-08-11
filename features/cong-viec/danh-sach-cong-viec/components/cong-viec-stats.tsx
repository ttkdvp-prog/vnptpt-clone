import React, { useMemo } from 'react';
import { txt } from '@/lib/text';
import { ClipboardList, CheckCircle2, AlertTriangle, Clock, BarChart3, PieChart as PieChartIcon, Users } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import StatsKpiGrid from '@/components/shared/stats/StatsKpiGrid';
import StatsChartCard from '@/components/shared/stats/StatsChartCard';
import LoadingSpinnerWithText from '@/components/shared/LoadingSpinnerWithText';
import { cn, formatDate } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { congViecStatsAggregatesQueryOptions } from '../queries/cong-viec';
import { useCongViecTonQuaHanDetail } from '../hooks/use-cong-viec';
import type { StatsKpiCardItem } from '@/components/shared/stats/types';
import { getCongViecTrangThai } from '../core/types';

const UU_TIEN_COLORS: Record<string, string> = {
  'Cao': '#e11d48',
  'Trung bình': '#f59e0b',
  'Thấp': '#94a3b8',
};

interface CongViecStatsProps {
  /** Map<id, ho_ten> — dùng để hiển thị tên thay vì mã nhân viên trên chart theo người phụ trách. */
  employeeMap?: Map<string, string>;
  /** Map<id, to_phong> — tổ của từng nhân viên, dùng để nhóm/sắp xếp bảng theo AR/R. */
  employeeTeamMap?: Map<string, string>;
}

const CongViecStats: React.FC<CongViecStatsProps> = ({ employeeMap, employeeTeamMap }) => {
  const { data, isLoading } = useQuery(congViecStatsAggregatesQueryOptions());
  const { data: tonQuaHanItems = [], isLoading: isLoadingTonQuaHan } = useCongViecTonQuaHanDetail();

  const kpis = useMemo((): StatsKpiCardItem[] => {
    const kpi = data?.kpis ?? { total: 0, hoanThanh: 0, quaHan: 0, dangThucHien: 0 };
    return [
      { id: 'total', label: txt('congViec.stats.total'), value: kpi.total, icon: ClipboardList, color: 'text-primary', bg: 'bg-primary/10' },
      { id: 'hoanThanh', label: txt('congViec.stats.hoanThanh'), value: kpi.hoanThanh, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
      { id: 'quaHan', label: txt('congViec.stats.quaHan'), value: kpi.quaHan, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-500/10' },
      { id: 'dangThucHien', label: txt('congViec.stats.dangThucHien'), value: kpi.dangThucHien, icon: Clock, color: 'text-sky-600', bg: 'bg-sky-500/10' },
    ];
  }, [data]);

  const byCap = data?.byCap ?? [];
  const byUuTien = data?.byUuTien ?? [];
  const byNguoiPhuTrach = useMemo(
    () =>
      (data?.byNguoiPhuTrach ?? [])
        .map((entry) => ({ ...entry, name: employeeMap?.get(entry.key) ?? entry.key }))
        .sort((a, b) => b.count - a.count),
    [data, employeeMap],
  );
  const byToTeam = useMemo(() => (data?.byToTeam ?? []).slice().sort((a, b) => a.key.localeCompare(b.key, 'vi')), [data]);
  const byNguoiRaci = useMemo(
    () =>
      (data?.byNguoiRaci ?? [])
        .map((entry) => ({
          ...entry,
          name: employeeMap?.get(entry.key) ?? entry.key,
          team: employeeTeamMap?.get(entry.key) || '—',
        }))
        .sort((a, b) => a.team.localeCompare(b.team, 'vi') || a.name.localeCompare(b.name, 'vi')),
    [data, employeeMap, employeeTeamMap],
  );
  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const daysLate = (ngayKt: string): number =>
    Math.max(0, Math.round((new Date(today).getTime() - new Date(ngayKt).getTime()) / 86_400_000));

  const nguoiArName = (item: (typeof tonQuaHanItems)[number]) => employeeMap?.get(item.mnv_a) ?? item.mnv_a;

  /** Đánh dấu nhóm theo Người AR liền kề — tô xen kẽ 2 màu để phân biệt cá nhân cạnh nhau, không phải zebra theo dòng. */
  const quaHanList = useMemo(() => {
    const sorted = tonQuaHanItems
      .filter((item) => getCongViecTrangThai(item) === 'qua_han')
      .slice()
      .sort((a, b) => nguoiArName(a).localeCompare(nguoiArName(b), 'vi') || a.ngay_kt.localeCompare(b.ngay_kt));
    let groupIndex = -1;
    let prevName: string | null = null;
    return sorted.map((item) => {
      const name = nguoiArName(item);
      if (name !== prevName) {
        groupIndex += 1;
        prevName = name;
      }
      return { ...item, personGroup: groupIndex };
    });
  }, [tonQuaHanItems, employeeMap]);
  /** Đánh dấu nhóm theo Người AR liền kề — tô xen kẽ 2 màu để phân biệt cá nhân cạnh nhau. */
  const tonList = useMemo(() => {
    const sorted = tonQuaHanItems
      .filter((item) => getCongViecTrangThai(item) === 'dang_thuc_hien')
      .slice()
      .sort((a, b) => nguoiArName(a).localeCompare(nguoiArName(b), 'vi') || a.ngay_kt.localeCompare(b.ngay_kt));
    let groupIndex = -1;
    let prevName: string | null = null;
    return sorted.map((item) => {
      const name = nguoiArName(item);
      if (name !== prevName) {
        groupIndex += 1;
        prevName = name;
      }
      return { ...item, personGroup: groupIndex };
    });
  }, [tonQuaHanItems, employeeMap]);

  const toTeamTotal = useMemo(
    () =>
      byToTeam.reduce(
        (acc, t) => ({ giao: acc.giao + t.giao, hoanThanh: acc.hoanThanh + t.hoanThanh, quaHan: acc.quaHan + t.quaHan }),
        { giao: 0, hoanThanh: 0, quaHan: 0 },
      ),
    [byToTeam],
  );

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <LoadingSpinnerWithText text={txt('congViec.stats.loading')} centered />
      </div>
    );
  }

  return (
    <div className="min-h-0 min-w-0 w-full flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
      <div className="min-w-0 max-w-full space-y-3 p-3 sm:p-4 pb-4">
        <StatsKpiGrid items={kpis} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <StatsChartCard title={txt('congViec.stats.byCap')} icon={BarChart3}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byCap}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="key" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number | undefined) => [v ?? 0, txt('congViec.stats.quantity')]} />
                <Bar dataKey="count" fill="var(--color-primary, #6366f1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </StatsChartCard>

          <StatsChartCard title={txt('congViec.stats.byUuTien')} icon={PieChartIcon}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={byUuTien} dataKey="count" nameKey="key" cx="50%" cy="50%" outerRadius={90} label>
                  {byUuTien.map((entry) => (
                    <Cell key={entry.key} fill={UU_TIEN_COLORS[entry.key] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number | undefined) => [v ?? 0, txt('congViec.stats.quantity')]} />
              </PieChart>
            </ResponsiveContainer>
          </StatsChartCard>
        </div>

        <StatsChartCard title={txt('congViec.stats.byNguoiPhuTrach')} icon={Users}>
          <ResponsiveContainer width="100%" height={Math.max(260, byNguoiPhuTrach.length * 36)}>
            <BarChart data={byNguoiPhuTrach} layout="vertical" margin={{ left: 8, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number | undefined) => [v ?? 0, txt('congViec.stats.quantity')]} />
              <Bar dataKey="count" fill="var(--color-primary, #6366f1)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </StatsChartCard>

        <StatsChartCard title={txt('congViec.stats.byToTeam')} icon={Users}>
          {byToTeam.length === 0 ? (
            <p className="text-body-sm text-muted-foreground py-6 text-center">{txt('congViec.stats.noData')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-body-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left font-medium py-2 pr-3">{txt('congViec.stats.toTeamCol')}</th>
                    <th className="text-right font-medium py-2 px-3">{txt('congViec.stats.giaoCol')}</th>
                    <th className="text-right font-medium py-2 px-3">{txt('congViec.stats.hoanThanhCol')}</th>
                    <th className="text-right font-medium py-2 pl-3">{txt('congViec.stats.quaHanCol')}</th>
                  </tr>
                </thead>
                <tbody>
                  {byToTeam.map((t) => (
                    <tr key={t.key} className="border-b border-border/60">
                      <td className="py-2 pr-3 text-foreground">{t.key}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-foreground">{t.giao}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{t.hoanThanh}</td>
                      <td className="py-2 pl-3 text-right tabular-nums text-rose-600 dark:text-rose-400">{t.quaHan}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-semibold">
                    <td className="py-2 pr-3 text-foreground">{txt('congViec.stats.totalRow')}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-foreground">{toTeamTotal.giao}</td>
                    <td className="py-2 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{toTeamTotal.hoanThanh}</td>
                    <td className="py-2 pl-3 text-right tabular-nums text-rose-600 dark:text-rose-400">{toTeamTotal.quaHan}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </StatsChartCard>

        <StatsChartCard title={txt('congViec.stats.byNguoiRaci')} icon={Users}>
          {byNguoiRaci.length === 0 ? (
            <p className="text-body-sm text-muted-foreground py-6 text-center">{txt('congViec.stats.noData')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-body-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left font-medium py-2 pr-3">{txt('congViec.stats.toCuaNguoiCol')}</th>
                    <th className="text-left font-medium py-2 px-3">{txt('congViec.stats.nguoiCol')}</th>
                    <th className="text-right font-medium py-2 px-3">{txt('congViec.stats.arCol')}</th>
                    <th className="text-right font-medium py-2 px-3">{txt('congViec.stats.rCol')}</th>
                    <th className="text-right font-medium py-2 px-3">{txt('congViec.stats.nguoiHoanThanhCol')}</th>
                    <th className="text-right font-medium py-2 pl-3">{txt('congViec.stats.nguoiQuaHanCol')}</th>
                  </tr>
                </thead>
                <tbody>
                  {byNguoiRaci.map((p) => (
                    <tr key={p.key} className="border-b border-border/60">
                      <td className="py-2 pr-3 text-muted-foreground">{p.team}</td>
                      <td className="py-2 px-3 text-foreground">{p.name}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-foreground">{p.ar}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-foreground">{p.r}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{p.hoanThanh}</td>
                      <td className="py-2 pl-3 text-right tabular-nums text-rose-600 dark:text-rose-400">{p.quaHan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </StatsChartCard>

        <StatsChartCard title={txt('congViec.stats.quaHanDetailTitle')} icon={AlertTriangle}>
          {quaHanList.length === 0 ? (
            <p className="text-body-sm text-muted-foreground py-6 text-center">
              {isLoadingTonQuaHan ? txt('congViec.stats.loading') : txt('congViec.stats.noData')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-body-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-right font-medium py-2 pr-3">{txt('congViec.stats.colStt')}</th>
                    <th className="text-left font-medium py-2 px-3">{txt('congViec.stats.colTieuDe')}</th>
                    <th className="text-left font-medium py-2 px-3">{txt('congViec.stats.colToAr')}</th>
                    <th className="text-left font-medium py-2 px-3">{txt('congViec.stats.colNguoiAr')}</th>
                    <th className="text-right font-medium py-2 px-3">{txt('congViec.stats.colNgayKt')}</th>
                    <th className="text-right font-medium py-2 pl-3">{txt('congViec.stats.colSoNgayTre')}</th>
                  </tr>
                </thead>
                <tbody>
                  {quaHanList.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={cn(
                        'border-b border-border/60',
                        item.personGroup % 2 === 1 && 'bg-muted/40',
                      )}
                    >
                      <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">{idx + 1}</td>
                      <td className="py-2 px-3 text-foreground">{item.tieu_de}</td>
                      <td className="py-2 px-3 text-muted-foreground">{item.to_ar}</td>
                      <td className="py-2 px-3 text-foreground">{nguoiArName(item)}</td>
                      <td className="py-2 px-3 text-right tabular-nums text-foreground">{formatDate(item.ngay_kt)}</td>
                      <td className="py-2 pl-3 text-right tabular-nums text-rose-600 dark:text-rose-400">{daysLate(item.ngay_kt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </StatsChartCard>

        <StatsChartCard title={txt('congViec.stats.tonDetailTitle')} icon={Clock}>
          {tonList.length === 0 ? (
            <p className="text-body-sm text-muted-foreground py-6 text-center">
              {isLoadingTonQuaHan ? txt('congViec.stats.loading') : txt('congViec.stats.noData')}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-body-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-right font-medium py-2 pr-3">{txt('congViec.stats.colStt')}</th>
                    <th className="text-left font-medium py-2 px-3">{txt('congViec.stats.colTieuDe')}</th>
                    <th className="text-left font-medium py-2 px-3">{txt('congViec.stats.colToAr')}</th>
                    <th className="text-left font-medium py-2 px-3">{txt('congViec.stats.colNguoiAr')}</th>
                    <th className="text-right font-medium py-2 pl-3">{txt('congViec.stats.colNgayKt')}</th>
                  </tr>
                </thead>
                <tbody>
                  {tonList.map((item, idx) => (
                    <tr
                      key={item.id}
                      className={cn(
                        'border-b border-border/60',
                        item.personGroup % 2 === 1 && 'bg-sky-100 dark:bg-sky-900/30',
                      )}
                    >
                      <td className="py-2 pr-3 text-right tabular-nums text-muted-foreground">{idx + 1}</td>
                      <td className="py-2 px-3 text-foreground">{item.tieu_de}</td>
                      <td className="py-2 px-3 text-muted-foreground">{item.to_ar}</td>
                      <td className="py-2 px-3 text-foreground">{nguoiArName(item)}</td>
                      <td className="py-2 pl-3 text-right tabular-nums text-sky-600 dark:text-sky-400">{formatDate(item.ngay_kt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </StatsChartCard>
      </div>
    </div>
  );
};

export default CongViecStats;
