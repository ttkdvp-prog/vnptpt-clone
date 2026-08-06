import type { LucideIcon } from 'lucide-react';
import {
  ArrowUpFromLine,
  Calendar,
  CalendarClock,
  CircleDot,
  FileText,
  Link2,
  Package,
  Palette,
  Printer,
  ShieldCheck,
  Users,
} from 'lucide-react';

export const MARKET_IN_FIELD_ICONS = {
  thu_tu: ArrowUpFromLine,
  ma_market: Printer,
  ma_san_pham: Package,
  id_khach_hang: Users,
  id_nguoi_ve: Palette,
  mo_ta: FileText,
  trang_thai: CircleDot,
  link_file: Link2,
  ngay_hieu_luc: Calendar,
  id_nguoi_duyet: ShieldCheck,
  ten_nguoi_duyet: ShieldCheck,
  tg_duyet: CalendarClock,
} as const satisfies Record<string, LucideIcon>;
