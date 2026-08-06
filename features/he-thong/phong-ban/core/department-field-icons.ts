import type { LucideIcon } from 'lucide-react';
import {
  ArrowUpFromLine,
  Building2,
  FileText,
  Folder,
  Layers,
  Power,
} from 'lucide-react';

export const DEPARTMENT_FIELD_ICONS = {
  ten_phong_ban: Building2,
  ma_phong_ban: Building2,
  mo_ta: FileText,
  cha_id: Folder,
  cap_do: Layers,
  thu_tu: ArrowUpFromLine,
  trang_thai: Power,
} as const satisfies Record<string, LucideIcon>;
