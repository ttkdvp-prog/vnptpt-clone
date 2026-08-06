import type { LucideIcon } from 'lucide-react';
import {
  ArrowUpFromLine,
  Briefcase,
  Building2,
  FileText,
  Layers,
  Power,
} from 'lucide-react';

export const POSITION_FIELD_ICONS = {
  ma_chuc_vu: Briefcase,
  ten_chuc_vu: Briefcase,
  cap_bac: Layers,
  phong_ban_id: Building2,
  mo_ta: FileText,
  thu_tu: ArrowUpFromLine,
  trang_thai: Power,
} as const satisfies Record<string, LucideIcon>;
