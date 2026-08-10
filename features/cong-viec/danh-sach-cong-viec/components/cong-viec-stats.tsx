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
import { useQuery } from '@tanstack/react-query';
import { congViecStatsAggregatesQueryOptions } from '../queries/cong-viec';
import type { StatsKpiCardItem } from '@/components/shared/stats/types';

const UU_TIEN_COLORS: Record<string, string> = {
  'Cao': '#e11d48',
  'Trung bình': '#f59e0b',
  'Thấp': '#94a3b8',
};

interface CongViecStatsProps {
  /** Map<id, ho_ten> — dùng để hiển thị tên thay vì mã nhân viên trên chart theo người phụ trách. */
  employeeMap?: Map<string, string>;
}

const CongViecStats: React.FC<CongViecStatsProps> = ({ employeeMap }) => {
  const { data, isLoading } = useQuery(congViecStatsAggregatesQueryOptions());

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
      </div>
    </div>
  );
};

export default CongViecStats;
