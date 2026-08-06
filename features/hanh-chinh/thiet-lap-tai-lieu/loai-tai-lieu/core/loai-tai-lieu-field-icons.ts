import type { LucideIcon } from 'lucide-react';
import { ArrowUpFromLine, FileText, StickyNote } from 'lucide-react';

export const LOAI_TAI_LIEU_FIELD_ICONS = {
  thu_tu: ArrowUpFromLine,
  ten_loai_tai_lieu: FileText,
  mo_ta: StickyNote,
} as const satisfies Record<string, LucideIcon>;
