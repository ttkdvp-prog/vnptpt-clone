import type { BadgeConfig } from '@/components/ui/EnumBadge';
import { txt } from '@/lib/text';

export const TRANG_THAI_NHIEM_VU = ['chua_bat_dau', 'dang_thuc_hien', 'hoan_thanh', 'qua_han'] as const;
export type TrangThaiNhiemVu = (typeof TRANG_THAI_NHIEM_VU)[number];

export const TRANG_THAI_OPTIONS: { label: string; value: TrangThaiNhiemVu }[] = [
  { get label() { return txt('nhiemVu.trangThai.chuaBatDau'); }, value: 'chua_bat_dau' },
  { get label() { return txt('nhiemVu.trangThai.dangThucHien'); }, value: 'dang_thuc_hien' },
  { get label() { return txt('nhiemVu.trangThai.hoanThanh'); }, value: 'hoan_thanh' },
  { get label() { return txt('nhiemVu.trangThai.quaHan'); }, value: 'qua_han' },
];

export const TRANG_THAI_BADGE_CONFIG: BadgeConfig<TrangThaiNhiemVu> = {
  chua_bat_dau: { get label() { return txt('nhiemVu.trangThai.chuaBatDau'); }, color: 'slate' },
  dang_thuc_hien: { get label() { return txt('nhiemVu.trangThai.dangThucHien'); }, color: 'sky' },
  hoan_thanh: { get label() { return txt('nhiemVu.trangThai.hoanThanh'); }, color: 'emerald' },
  qua_han: { get label() { return txt('nhiemVu.trangThai.quaHan'); }, color: 'rose' },
};

export const UU_TIEN_NHIEM_VU = ['Cao', 'Trung bình', 'Thấp'] as const;
export type UuTienNhiemVu = (typeof UU_TIEN_NHIEM_VU)[number];

export const UU_TIEN_OPTIONS: { label: string; value: UuTienNhiemVu }[] = [
  { get label() { return txt('nhiemVu.uuTien.cao'); }, value: 'Cao' },
  { get label() { return txt('nhiemVu.uuTien.trungBinh'); }, value: 'Trung bình' },
  { get label() { return txt('nhiemVu.uuTien.thap'); }, value: 'Thấp' },
];

export const UU_TIEN_BADGE_CONFIG: BadgeConfig<UuTienNhiemVu> = {
  'Cao': { get label() { return txt('nhiemVu.uuTien.cao'); }, color: 'rose' },
  'Trung bình': { get label() { return txt('nhiemVu.uuTien.trungBinh'); }, color: 'amber' },
  'Thấp': { get label() { return txt('nhiemVu.uuTien.thap'); }, color: 'slate' },
};
