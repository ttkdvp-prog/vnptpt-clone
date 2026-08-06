import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import ChartTooltip from '@/components/ui/ChartTooltip';
import { txt } from '@/lib/text';

export interface DocumentStatsChartsProps {
  chartsVisible: boolean;
  chartHeight: number;
  isMdUp: boolean;
  primaryHex: string;
  typeData: Array<{ id: string; name: string; value: number; fill: string }>;
  statusData: Array<{ key: string; name: string; value: number; fill: string }>;
  trendData: Array<{ label: string; count: number }>;
  creatorData: Array<{ id: string | null; name: string; value: number }>;
  onTypeDrillDown?: (typeId: string) => void;
  onStatusDrillDown?: (status: string) => void;
  onCreatorDrillDown?: (creatorId: string | null) => void;
}

const DocumentStatsCharts: React.FC<DocumentStatsChartsProps> = ({
  chartsVisible,
  chartHeight,
  isMdUp,
  primaryHex,
  typeData,
  statusData,
  trendData,
  creatorData,
  onTypeDrillDown,
  onStatusDrillDown,
  onCreatorDrillDown,
}) => {
  if (!chartsVisible) return null;

  const hasAny =
    typeData.length > 0 ||
    statusData.some((s) => s.value > 0) ||
    trendData.some((t) => t.count > 0) ||
    creatorData.length > 0;

  if (!hasAny) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-10 text-center text-sm text-muted-foreground">
        {txt('documentStats.emptyCharts')}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {typeData.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="mb-3 flex items-center gap-2">
            <PieChartIcon size={14} className="text-primary" aria-hidden />
            <h3 className="text-xs font-semibold text-foreground">
              {txt('documentStats.typeChart')}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                outerRadius={75}
                innerRadius={38}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
                onClick={(data: { id?: string }) => {
                  if (data.id && onTypeDrillDown) onTypeDrillDown(data.id);
                }}
                style={{ cursor: onTypeDrillDown ? 'pointer' : 'default' }}
              >
                {typeData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px' }}
                formatter={(value: string) => (
                  <span className="text-caption text-muted-foreground">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="rounded-xl border border-border bg-card p-3.5">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 size={14} className="text-primary" />
          <h3 className="text-xs font-semibold text-foreground">
            {txt('documentStats.statusChart')}
          </h3>
        </div>
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
              radius={[6, 6, 0, 0]}
              name={txt('documentStats.quantity')}
              onClick={(data) => {
                const key = (data as { key?: string }).key;
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
      </div>

      <div className="rounded-xl border border-border bg-card p-3.5">
        <div className="mb-3 flex items-center gap-2">
          <TrendingUp size={14} className="text-primary" />
          <h3 className="text-xs font-semibold text-foreground">
            {txt('documentStats.trendChart')}
          </h3>
        </div>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <AreaChart data={trendData}>
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
              dataKey="count"
              stroke={primaryHex}
              fill={primaryHex}
              fillOpacity={0.15}
              name={txt('documentStats.quantity')}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {creatorData.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="mb-3 flex items-center gap-2">
            <Users size={14} className="text-primary" />
            <h3 className="text-xs font-semibold text-foreground">
              {txt('documentStats.creatorChart')}
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={chartHeight}>
            <BarChart data={creatorData} layout="vertical" barSize={isMdUp ? 16 : 14}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
              <XAxis
                type="number"
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<ChartTooltip />} />
              <Bar
                dataKey="value"
                fill={primaryHex}
                radius={[0, 6, 6, 0]}
                name={txt('documentStats.quantity')}
                onClick={(data) => {
                  const id = (data as { id?: string | null }).id ?? null;
                  onCreatorDrillDown?.(id);
                }}
                style={{ cursor: onCreatorDrillDown ? 'pointer' : 'default' }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default DocumentStatsCharts;
