import type { LucideIcon } from 'lucide-react';
import { Briefcase, CalendarClock, FileText, Type } from 'lucide-react';

export const THONG_BAO_FIELD_ICONS = {
  tg_dang: CalendarClock,
  tieu_de: Type,
  noi_dung: FileText,
  id_chuc_vu: Briefcase,
} as const satisfies Record<string, LucideIcon>;
