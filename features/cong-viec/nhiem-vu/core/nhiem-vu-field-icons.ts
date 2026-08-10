import type { LucideIcon } from 'lucide-react';
import { FileText, Users, CalendarDays, CircleDot, FileType } from 'lucide-react';

export const NHIEM_VU_FIELD_ICONS = {
  tieu_de: FileText,
  mo_ta: FileType,
  nguoi_phu_trach: Users,
  han_chot: CalendarDays,
  trang_thai: CircleDot,
  uu_tien: CircleDot,
  ghi_chu: FileType,
} as const satisfies Record<string, LucideIcon>;
