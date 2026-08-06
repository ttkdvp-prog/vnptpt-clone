import EnumBadge, { type BadgeColor, type BadgeConfig } from '@/components/ui/EnumBadge';
import { MARKET_IN_STATUS, MARKET_IN_STATUS_LABELS } from '../core/types';

const STATUS_COLORS: Record<string, BadgeColor> = {
  [MARKET_IN_STATUS.CHO_DUYET]: 'warning',
  [MARKET_IN_STATUS.DA_DUYET]: 'success',
  [MARKET_IN_STATUS.NGUNG_AP_DUNG]: 'slate',
};

function resolveLabel(value: string): string {
  return MARKET_IN_STATUS_LABELS[value as keyof typeof MARKET_IN_STATUS_LABELS] ?? value;
}

function badgeConfig(value: string): BadgeConfig<string> {
  const label = resolveLabel(value);
  return { [value]: { label, color: STATUS_COLORS[value] ?? 'info' } };
}

interface BadgeProps {
  value?: string | null;
  truncate?: boolean;
}

export function MarketInStatusBadge({ value, truncate = false }: BadgeProps) {
  if (!value) return <span className="text-xs text-muted-foreground italic">—</span>;
  return (
    <EnumBadge
      value={value}
      config={badgeConfig(value)}
      truncate={truncate}
    />
  );
}
