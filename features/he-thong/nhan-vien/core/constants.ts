import type { BadgeConfig } from '@/components/ui/EnumBadge';
import { txt } from '@/lib/text';

/** Trạng thái nhân viên – giá trị tiếng Việt lưu DB */
export const TRANG_THAI_NHAN_VIEN = ['Nghỉ việc', 'Đang làm việc', 'Thử việc', 'Nghỉ phép'] as const;
export type TrangThaiNhanVien = (typeof TRANG_THAI_NHAN_VIEN)[number];

/** Trạng thái nhân viên – giá trị tiếng Việt lưu DB */
export const STATUS_OPTIONS: { label: string; value: TrangThaiNhanVien }[] = [
  { get label() { return txt('employee.statusActiveShort'); }, value: 'Đang làm việc' },
  { get label() { return txt('employee.statusInactiveShort'); }, value: 'Nghỉ việc' },
  { get label() { return txt('employee.statusProbation'); }, value: 'Thử việc' },
  { get label() { return txt('employee.statusLeave'); }, value: 'Nghỉ phép' },
];

/* ================================================================== */
/*  Badge Config Maps – dùng với component <EnumBadge />               */
/* ================================================================== */

/** Trạng thái nhân viên */
export const STATUS_BADGE_CONFIG: BadgeConfig<TrangThaiNhanVien> = {
  'Đang làm việc': { get label() { return txt('employee.statusActive'); }, color: 'emerald' },
  'Thử việc': { get label() { return txt('employee.statusProbation'); }, color: 'blue' },
  'Nghỉ phép': { get label() { return txt('employee.statusLeave'); }, color: 'amber' },
  'Nghỉ việc': { get label() { return txt('employee.statusResigned'); }, color: 'slate' },
};
