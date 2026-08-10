import type { LucideIcon } from 'lucide-react';
import { FileText, Tag, Building2, CalendarDays, CircleDot, Link2, FileType } from 'lucide-react';

export const TAI_LIEU_FIELD_ICONS = {
  ten_ho_so: FileText,
  danh_muc: Tag,
  to: Building2,
  ngay_ban_hanh: CalendarDays,
  ngay_ket_thuc: CalendarDays,
  tinh_trang: CircleDot,
  url: Link2,
  mo_ta: FileType,
} as const satisfies Record<string, LucideIcon>;
