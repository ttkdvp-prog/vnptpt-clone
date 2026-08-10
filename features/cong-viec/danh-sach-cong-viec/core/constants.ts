import type { BadgeConfig } from '@/components/ui/EnumBadge';
import { txt } from '@/lib/text';

export const CAP_CONG_VIEC = ['Trung tâm', 'Tổ'] as const;
export type CapCongViec = (typeof CAP_CONG_VIEC)[number];

export const CAP_OPTIONS: { label: string; value: CapCongViec }[] = [
  { get label() { return txt('congViec.cap.trungTam'); }, value: 'Trung tâm' },
  { get label() { return txt('congViec.cap.to'); }, value: 'Tổ' },
];

export const CAP_BADGE_CONFIG: BadgeConfig<CapCongViec> = {
  'Trung tâm': { get label() { return txt('congViec.cap.trungTam'); }, color: 'violet' },
  'Tổ': { get label() { return txt('congViec.cap.to'); }, color: 'sky' },
};

export const UU_TIEN_CONG_VIEC = ['Cao', 'Trung bình', 'Thấp'] as const;
export type UuTienCongViec = (typeof UU_TIEN_CONG_VIEC)[number];

export const UU_TIEN_OPTIONS: { label: string; value: UuTienCongViec }[] = [
  { get label() { return txt('congViec.uuTien.cao'); }, value: 'Cao' },
  { get label() { return txt('congViec.uuTien.trungBinh'); }, value: 'Trung bình' },
  { get label() { return txt('congViec.uuTien.thap'); }, value: 'Thấp' },
];

export const UU_TIEN_BADGE_CONFIG: BadgeConfig<UuTienCongViec> = {
  'Cao': { get label() { return txt('congViec.uuTien.cao'); }, color: 'rose' },
  'Trung bình': { get label() { return txt('congViec.uuTien.trungBinh'); }, color: 'amber' },
  'Thấp': { get label() { return txt('congViec.uuTien.thap'); }, color: 'slate' },
};

export const TRANG_THAI_BADGE_CONFIG: BadgeConfig<'hoan_thanh' | 'qua_han' | 'dang_thuc_hien'> = {
  hoan_thanh: { get label() { return txt('congViec.trangThai.hoanThanh'); }, color: 'emerald' },
  qua_han: { get label() { return txt('congViec.trangThai.quaHan'); }, color: 'rose' },
  dang_thuc_hien: { get label() { return txt('congViec.trangThai.dangThucHien'); }, color: 'sky' },
};

export const TRANG_THAI_OPTIONS: { label: string; value: 'hoan_thanh' | 'qua_han' | 'dang_thuc_hien' }[] = [
  { get label() { return txt('congViec.trangThai.hoanThanh'); }, value: 'hoan_thanh' },
  { get label() { return txt('congViec.trangThai.quaHan'); }, value: 'qua_han' },
  { get label() { return txt('congViec.trangThai.dangThucHien'); }, value: 'dang_thuc_hien' },
];
