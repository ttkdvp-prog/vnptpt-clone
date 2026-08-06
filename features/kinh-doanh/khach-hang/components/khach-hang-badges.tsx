import EnumBadge, { type BadgeColor, type BadgeConfig } from '@/components/ui/EnumBadge';

const GROUP_COLORS: Record<string, BadgeColor> = {
  VIP: 'warning',
  'Tiềm năng': 'info',
  'Hiện hữu': 'success',
  'Ngừng hợp tác': 'slate',
};

const STATUS_COLORS: Record<string, BadgeColor> = {
  Mới: 'info',
  'Đang chăm sóc': 'warning',
  'Chốt deal': 'success',
  'Tạm ngưng': 'slate',
};

function badgeConfig(label: string, color: BadgeColor): BadgeConfig<string> {
  return { [label]: { label, color } };
}

interface BadgeProps {
  value?: string | null;
  truncate?: boolean;
}

export function KhachHangGroupBadge({ value, truncate = false }: BadgeProps) {
  if (!value) return <span className="text-xs text-muted-foreground italic">—</span>;
  return (
    <EnumBadge
      value={value}
      config={badgeConfig(value, GROUP_COLORS[value] ?? 'primary')}
      shape="rounded"
      truncate={truncate}
    />
  );
}

export function KhachHangStatusBadge({ value, truncate = false }: BadgeProps) {
  if (!value) return <span className="text-xs text-muted-foreground italic">—</span>;
  return (
    <EnumBadge
      value={value}
      config={badgeConfig(value, STATUS_COLORS[value] ?? 'info')}
      truncate={truncate}
    />
  );
}
