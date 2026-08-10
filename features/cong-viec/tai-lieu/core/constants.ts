import type { BadgeConfig } from '@/components/ui/EnumBadge';
import { txt } from '@/lib/text';

export const TINH_TRANG_TAI_LIEU = ['Đang hiệu lực', 'Hết hiệu lực', 'Dự thảo'] as const;
export type TinhTrangTaiLieu = (typeof TINH_TRANG_TAI_LIEU)[number];

export const TINH_TRANG_OPTIONS: { label: string; value: TinhTrangTaiLieu }[] = [
  { get label() { return txt('congViecTaiLieu.status.active'); }, value: 'Đang hiệu lực' },
  { get label() { return txt('congViecTaiLieu.status.expired'); }, value: 'Hết hiệu lực' },
  { get label() { return txt('congViecTaiLieu.status.draft'); }, value: 'Dự thảo' },
];

export const TINH_TRANG_BADGE_CONFIG: BadgeConfig<TinhTrangTaiLieu> = {
  'Đang hiệu lực': { get label() { return txt('congViecTaiLieu.status.active'); }, color: 'emerald' },
  'Hết hiệu lực': { get label() { return txt('congViecTaiLieu.status.expired'); }, color: 'slate' },
  'Dự thảo': { get label() { return txt('congViecTaiLieu.status.draft'); }, color: 'amber' },
};
