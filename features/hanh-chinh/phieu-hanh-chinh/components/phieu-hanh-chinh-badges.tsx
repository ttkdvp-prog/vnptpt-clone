import EnumBadge, { type BadgeColor, type BadgeConfig } from '@/components/ui/EnumBadge';
import {
  PHIEU_BUOI_LABELS,
  PHIEU_HANH_CHINH_STATUS,
  PHIEU_HANH_CHINH_STATUS_LABELS,
  type PhieuBuoi,
} from '../core/types';

const STATUS_COLORS: Record<string, BadgeColor> = {
  [PHIEU_HANH_CHINH_STATUS.CHO_QL_DUYET]: 'warning',
  [PHIEU_HANH_CHINH_STATUS.CHO_HCNS_DUYET]: 'info',
  [PHIEU_HANH_CHINH_STATUS.DA_DUYET]: 'success',
  [PHIEU_HANH_CHINH_STATUS.TU_CHOI]: 'rose',
  [PHIEU_HANH_CHINH_STATUS.DA_HUY]: 'slate',
};

function resolveStatusLabel(value: string): string {
  return (
    PHIEU_HANH_CHINH_STATUS_LABELS[
      value as keyof typeof PHIEU_HANH_CHINH_STATUS_LABELS
    ] ?? value
  );
}

function statusBadgeConfig(value: string): BadgeConfig<string> {
  const label = resolveStatusLabel(value);
  return { [value]: { label, color: STATUS_COLORS[value] ?? 'info' } };
}

interface BadgeProps {
  value?: string | null;
  truncate?: boolean;
}

export function PhieuHanhChinhStatusBadge({ value, truncate = false }: BadgeProps) {
  if (!value) return <span className="text-xs text-muted-foreground italic">—</span>;
  return (
    <EnumBadge value={value} config={statusBadgeConfig(value)} truncate={truncate} />
  );
}

export function PhieuBuoiBadge({ value, truncate = false }: BadgeProps) {
  if (!value) return <span className="text-xs text-muted-foreground italic">—</span>;
  const label = PHIEU_BUOI_LABELS[value as PhieuBuoi] ?? value;
  return (
    <EnumBadge
      value={value}
      config={{ [value]: { label, color: 'slate' } }}
      truncate={truncate}
    />
  );
}
