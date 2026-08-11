import type { LucideIcon } from 'lucide-react';
import { FileText, Tag, Building2, Users, CalendarDays, CircleDot, FileType, Paperclip, Target, TrendingUp, ShieldCheck } from 'lucide-react';

export const CONG_VIEC_FIELD_ICONS = {
  cap: Tag,
  tieu_de: FileText,
  mo_ta: FileType,
  to_ar: Building2,
  to_r: Building2,
  mnv_a: Users,
  mnv_r: Users,
  mnv_c: Users,
  mnv_bgd: ShieldCheck,
  uu_tien: CircleDot,
  ngay_bd: CalendarDays,
  ngay_kt: CalendarDays,
  ngay_ht: CalendarDays,
  ghi_chu: FileType,
  tep_dinh_kem: Paperclip,
  ke_hoach: Target,
  thuc_hien: TrendingUp,
} as const satisfies Record<string, LucideIcon>;
