import EnumBadge, { type BadgeColor, type BadgeConfig } from '@/components/ui/EnumBadge';
import {
  CONTRACT_STATUS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPE,
  CONTRACT_TYPE_LABELS,
} from '../core/types';

const STATUS_COLORS: Record<string, BadgeColor> = {
  [CONTRACT_STATUS.CHUA_XONG]: 'warning',
  [CONTRACT_STATUS.DA_XONG]: 'success',
};

const TYPE_COLORS: Record<string, BadgeColor> = {
  [CONTRACT_TYPE.THU_VIEC]: 'info',
  [CONTRACT_TYPE.CHINH_THUC]: 'primary',
};

interface BadgeProps {
  value?: string | null;
  truncate?: boolean;
}

export function ContractStatusBadge({ value, truncate = false }: BadgeProps) {
  if (!value) return <span className="text-xs text-muted-foreground italic">—</span>;
  const label =
    CONTRACT_STATUS_LABELS[value as keyof typeof CONTRACT_STATUS_LABELS] ?? value;
  const config: BadgeConfig<string> = {
    [value]: { label, color: STATUS_COLORS[value] ?? 'info' },
  };
  return <EnumBadge value={value} config={config} truncate={truncate} />;
}

export function ContractTypeBadge({ value, truncate = false }: BadgeProps) {
  if (!value) return <span className="text-xs text-muted-foreground italic">—</span>;
  const label =
    CONTRACT_TYPE_LABELS[value as keyof typeof CONTRACT_TYPE_LABELS] ?? value;
  const config: BadgeConfig<string> = {
    [value]: { label, color: TYPE_COLORS[value] ?? 'slate' },
  };
  return <EnumBadge value={value} config={config} truncate={truncate} />;
}
