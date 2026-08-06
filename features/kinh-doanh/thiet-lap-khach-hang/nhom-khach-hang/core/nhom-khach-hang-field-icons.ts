import type { LucideIcon } from 'lucide-react';
import { FileText, UsersRound } from 'lucide-react';

export const NHOM_KHACH_HANG_FIELD_ICONS = {
  ten_nhom: UsersRound,
  mo_ta: FileText,
} as const satisfies Record<string, LucideIcon>;
