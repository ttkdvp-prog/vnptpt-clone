import React from 'react';

const RADIAN = Math.PI / 180;

export interface PieInsideLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
}

/**
 * Label % nằm giữa lát pie/donut (thay cho label ngoài dễ bị cắt khỏi viewport SVG).
 * Dùng: <Pie label={renderPercentInsideLabel} labelLine={false} …>
 * Lát < 6% bị ẩn label để tránh chồng chữ.
 */
export function renderPercentInsideLabel({
  cx = 0,
  cy = 0,
  midAngle = 0,
  innerRadius = 0,
  outerRadius = 0,
  percent,
}: PieInsideLabelProps): React.ReactElement | null {
  const pct = percent ?? 0;
  if (pct < 0.06) return null;
  const r = (innerRadius + outerRadius) / 2;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#fff"
      fontSize={11}
      fontWeight={600}
      textAnchor="middle"
      dominantBaseline="central"
      pointerEvents="none"
    >
      {`${(pct * 100).toFixed(0)}%`}
    </text>
  );
}
