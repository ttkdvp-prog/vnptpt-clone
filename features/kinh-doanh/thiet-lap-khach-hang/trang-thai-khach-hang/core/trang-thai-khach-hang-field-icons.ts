import type { LucideIcon } from 'lucide-react';
import { FileText, Tag } from 'lucide-react';

export const TRANG_THAI_KHACH_HANG_FIELD_ICONS = {
  ten_trang_thai: Tag,
  mo_ta: FileText,
} as const satisfies Record<string, LucideIcon>;
