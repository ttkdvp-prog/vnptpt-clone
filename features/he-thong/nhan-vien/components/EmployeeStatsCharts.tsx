import React from 'react';
import { txt } from '@/lib/text';
import {
  Users, TrendingUp, PieChart as PieChartIcon, BarChart3,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area,
} from 'recharts';
import ChartTooltip from '@/components/ui/ChartTooltip';

/** Recharts v2 spread datum lên sector props, v3 bọc trong `payload` — đọc cả hai. */
function chartDatum<T>(entry: unknown): T {
  const e = entry as { payload?: T };
  return (e?.payload ?? entry) as T;
}
import StatsChartCard from '@/components/shared/stats/StatsChartCard';
import { renderPercentInsideLabel } from '@/components/shared/stats/chart-label-utils';

export interface EmployeeStatsChartsProps {
  chartsVisible: boolean;
  chartHeight: number;
  isMdUp: boolean;
  primaryHex: string;
  deptData: Array<{ name: string; value: number; id?: string | null }>;
  statusData: Array<{ name: string; value: number; fill: string; key?: string }>;
  hiringData: Array<{ key: string; label: string; count: number }>;
  genderData: Array<{ key: string; name: string; value: number; fill: string }>;
  DEPT_COLORS: string[];
  onDeptDrillDown?: (deptId: string) => void;
  onStatusDrillDown?: (status: string) => void;
  onGenderDrillDown?: (gender: string) => void;
  onMonthDrillDown?: (monthKey: string, label: string) => void;
}

const EmployeeStatsCharts: React.FC<EmployeeStatsChartsProps> = ({
  chartsVisible,
  chartHeight,
  isMdUp,
  primaryHex,
  deptData,
  statusData,
  hiringData,
  genderData,
  DEPT_COLORS,
  onDeptDrillDown,
  onStatusDrillDown,
  onGenderDrillDown,
  onMonthDrillDown,
}) => {
  if (!chartsVisible) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {deptData.length > 0 && (
          <StatsChartCard title={txt('employee.stats.departmentChart')} icon={PieChartIcon}>
            <ResponsiveContainer width="100%" height={chartHeight}>
              <PieChart>
                <Pie
                  data={deptData}
                  cx="50%"
                  cy="50%"
                  outerRadius={75}
                  innerRadius={38}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive={false}
                  label={renderPercentInsideLabel}
                  labelLine={false}
                  onClick={(entry: unknown) => {
                    const { id } = chartDatum<{ id?: string | null }>(entry);
                    if (id && onDeptDrillDown) onDeptDrillDown(id);
                  }}
                  style={{ cursor: onDeptDrillDown ? 'pointer' : 'default' }}
                >
                  {deptData.map((_, i) => (
                    <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px' }}
                  formatter={(value: string) => (
                    <span className="text-muted-foreground text-caption">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </StatsChartCard>
        )}

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

        <StatsChartCard title={txt('employee.stats.trendChart')} icon={TrendingUp} spanTwo>
          <ResponsiveContainer
            width="100%"
            height={chartHeight}
            className={onMonthDrillDown ? 'cursor-pointer' : undefined}
          >
            <AreaChart
              data={hiringData}
              onClick={(state) => {
                const point = (state as {
                  activePayload?: Array<{ payload?: { key?: string; label?: string } }>;
                } | null)?.activePayload?.[0]?.payload;
                if (point?.key && onMonthDrillDown) {
                  onMonthDrillDown(point.key, point.label ?? point.key);
                }
              }}
            >
              <defs>
                <linearGradient id="colorHire" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryHex} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={primaryHex} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis
                dataKey="label"
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
              <Area
                type="monotone"
                isAnimationActive={false}
                dataKey="count"
                name={txt('employee.stats.newHires')}
                stroke={primaryHex}
                strokeWidth={2}
                fill="url(#colorHire)"
                dot={{ r: 3, fill: primaryHex, strokeWidth: 0 }}
                activeDot={{ r: 6, fill: primaryHex, stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </StatsChartCard>

        {genderData.length > 0 && (
          <StatsChartCard
            title={txt('employee.stats.genderChart')}
            icon={Users}
            iconClassName="text-pink-500"
          >
            <ResponsiveContainer width="100%" height={chartHeight}>
              <PieChart>
                <Pie
                  data={genderData}
                  cx="50%"
                  cy="50%"
                  outerRadius={isMdUp ? 75 : 70}
                  innerRadius={isMdUp ? 42 : 38}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                  isAnimationActive={false}
                  label={renderPercentInsideLabel}
                  labelLine={false}
                  onClick={(entry: unknown) => {
                    const { key } = chartDatum<{ key?: string }>(entry);
                    if (key && onGenderDrillDown) onGenderDrillDown(key);
                  }}
                  style={{ cursor: onGenderDrillDown ? 'pointer' : 'default' }}
                >
                  {genderData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  wrapperStyle={{ fontSize: '11px' }}
                  formatter={(value: string, entry) => {
                    const count = (entry as { payload?: { value?: number } } | undefined)
                      ?.payload?.value;
                    return (
                      <span className="text-muted-foreground text-caption">
                        {value}
                        {count != null ? ` (${count})` : ''}
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </StatsChartCard>
        )}
    </div>
  );
};

export default EmployeeStatsCharts;
