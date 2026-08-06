import EnumBadge, { type BadgeColor, type BadgeConfig } from '@/components/ui/EnumBadge';
import { DOCUMENT_STATUS, DOCUMENT_STATUS_LABELS } from '../core/types';

const STATUS_COLORS: Record<string, BadgeColor> = {
  [DOCUMENT_STATUS.DU_THAO]: 'slate',
  [DOCUMENT_STATUS.HIEU_LUC]: 'success',
  [DOCUMENT_STATUS.LOI_THOI]: 'rose',
  [DOCUMENT_STATUS.CHO_SUA]: 'warning',
};

function resolveLabel(value: string): string {
  return DOCUMENT_STATUS_LABELS[value as keyof typeof DOCUMENT_STATUS_LABELS] ?? value;
}

function badgeConfig(value: string): BadgeConfig<string> {
  const label = resolveLabel(value);
  return { [value]: { label, color: STATUS_COLORS[value] ?? 'info' } };
}

interface BadgeProps {
  value?: string | null;
  truncate?: boolean;
}

export function DocumentStatusBadge({ value, truncate = false }: BadgeProps) {
  if (!value) return <span className="text-xs text-muted-foreground italic">—</span>;
  return <EnumBadge value={value} config={badgeConfig(value)} truncate={truncate} />;
}
