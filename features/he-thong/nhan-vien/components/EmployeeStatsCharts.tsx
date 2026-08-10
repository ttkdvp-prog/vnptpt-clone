import React from 'react';
import { txt } from '@/lib/text';
import { BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import ChartTooltip from '@/components/ui/ChartTooltip';
import StatsChartCard from '@/components/shared/stats/StatsChartCard';

/** Recharts v2 spread datum lên sector props, v3 bọc trong `payload` — đọc cả hai. */
function chartDatum<T>(entry: unknown): T {
  const e = entry as { payload?: T };
  return (e?.payload ?? entry) as T;
}

export interface EmployeeStatsChartsProps {
  chartsVisible: boolean;
  chartHeight: number;
  isMdUp: boolean;
  statusData: Array<{ name: string; value: number; fill: string; key?: string }>;
  onStatusDrillDown?: (status: string) => void;
}

const EmployeeStatsCharts: React.FC<EmployeeStatsChartsProps> = ({
  chartsVisible,
  chartHeight,
  isMdUp,
  statusData,
  onStatusDrillDown,
}) => {
  if (!chartsVisible) return null;

  return (
    <div className="grid grid-cols-1 gap-3">
      <StatsChartCard title={txt('employee.stats.statusChart')} icon={BarChart3}>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={statusData} barSize={isMdUp ? 32 : 28}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
              axisLine={false}
              tickLine={false}
              allowDecimals={false}
            />
            <Tooltip content={<ChartTooltip />} />
            <Bar
              dataKey="value"
              isAnimationActive={false}
              radius={[6, 6, 0, 0]}
              name={txt('employee.stats.quantity')}
              onClick={(entry: unknown) => {
                const { key } = chartDatum<{ key?: string }>(entry);
                if (key != null && onStatusDrillDown) onStatusDrillDown(key);
              }}
              style={{ cursor: onStatusDrillDown ? 'pointer' : 'default' }}
            >
              {statusData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </StatsChartCard>
    </div>
  );
};

export default EmployeeStatsCharts;
