import React from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

export interface StatsChartCardProps {
  /** Tiêu đề biểu đồ */
  title: string;
  /** Icon cạnh title */
  icon?: LucideIcon;
  /** Màu icon, default text-primary */
  iconClassName?: string;
  /** Nội dung (ResponsiveContainer + chart) */
  children: React.ReactNode;
  className?: string;
  /** Span 2 cột trên grid desktop (md:col-span-2) */
  spanTwo?: boolean;
}

/**
 * Card shell compact cho biểu đồ trong tab Thống kê.
 * Nhẹ hơn StatsCard (không header border) — chuẩn theo tab Thống kê Nhân viên.
 */
const StatsChartCard: React.FC<StatsChartCardProps> = ({
  title,
  icon: Icon,
  iconClassName,
  children,
  className,
  spanTwo = false,
}) => (
  <div
    className={cn(
      'bg-card rounded-xl border border-border p-3.5',
      spanTwo && 'md:col-span-2',
      className,
    )}
  >
    <div className="flex items-center gap-2 mb-3">
      {Icon && <Icon size={14} className={cn('shrink-0', iconClassName ?? 'text-primary')} aria-hidden />}
      <h3 className="text-xs font-semibold text-foreground">{title}</h3>
    </div>
    {children}
  </div>
);

export default StatsChartCard;
