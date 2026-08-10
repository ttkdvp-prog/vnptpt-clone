import React, { useMemo } from 'react';
import { txt } from '@/lib/text';
import { FileText, CheckCircle2, XCircle, FileEdit, BarChart3, PieChart as PieChartIcon } from 'lucide-react';
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
import { taiLieuStatsAggregatesQueryOptions } from '../queries/tai-lieu';
import type { StatsKpiCardItem } from '@/components/shared/stats/types';

const STATUS_COLORS: Record<string, string> = {
  'Đang hiệu lực': '#10b981',
  'Hết hiệu lực': '#94a3b8',
  'Dự thảo': '#f59e0b',
};

const TaiLieuStats: React.FC = () => {
  const { data, isLoading } = useQuery(taiLieuStatsAggregatesQueryOptions());

  const kpis = useMemo((): StatsKpiCardItem[] => {
    const kpi = data?.kpis ?? { total: 0, dangHieuLuc: 0, hetHieuLuc: 0, duThao: 0 };
    return [
      { id: 'total', label: txt('congViecTaiLieu.stats.total'), value: kpi.total, icon: FileText, color: 'text-primary', bg: 'bg-primary/10' },
      { id: 'active', label: txt('congViecTaiLieu.stats.active'), value: kpi.dangHieuLuc, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
      { id: 'expired', label: txt('congViecTaiLieu.stats.expired'), value: kpi.hetHieuLuc, icon: XCircle, color: 'text-slate-500', bg: 'bg-slate-500/10' },
      { id: 'draft', label: txt('congViecTaiLieu.stats.draft'), value: kpi.duThao, icon: FileEdit, color: 'text-amber-600', bg: 'bg-amber-500/10' },
    ];
  }, [data]);

  const byDanhMuc = data?.byDanhMuc ?? [];
  const byTinhTrang = data?.byTinhTrang ?? [];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <LoadingSpinnerWithText text={txt('congViecTaiLieu.stats.loading')} centered />
      </div>
    );
  }

  return (
    <div className="min-h-0 min-w-0 w-full flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
      <div className="min-w-0 max-w-full space-y-3 p-3 sm:p-4 pb-4">
        <StatsKpiGrid items={kpis} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <StatsChartCard title={txt('congViecTaiLieu.stats.byDanhMuc')} icon={BarChart3}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={byDanhMuc}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="key" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number | undefined) => [v ?? 0, txt('congViecTaiLieu.stats.quantity')]} />
                <Bar dataKey="count" fill="var(--color-primary, #6366f1)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </StatsChartCard>

          <StatsChartCard title={txt('congViecTaiLieu.stats.byTinhTrang')} icon={PieChartIcon}>
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={byTinhTrang} dataKey="count" nameKey="key" cx="50%" cy="50%" outerRadius={90} label>
                  {byTinhTrang.map((entry) => (
                    <Cell key={entry.key} fill={STATUS_COLORS[entry.key] ?? '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number | undefined) => [v ?? 0, txt('congViecTaiLieu.stats.quantity')]} />
              </PieChart>
            </ResponsiveContainer>
          </StatsChartCard>
        </div>
      </div>
    </div>
  );
};

export default TaiLieuStats;
