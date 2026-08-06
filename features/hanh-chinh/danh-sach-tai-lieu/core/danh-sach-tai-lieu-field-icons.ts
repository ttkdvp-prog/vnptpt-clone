import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  CircleDot,
  FileText,
  FolderOpen,
  Link2,
  StickyNote,
  User,
} from 'lucide-react';

export const DANH_SACH_TAI_LIEU_FIELD_ICONS = {
  id_loai_tai_lieu: FolderOpen,
  trang_thai: CircleDot,
  ten_tai_lieu: FileText,
  link_tai_lieu: Link2,
  mo_ta: StickyNote,
  ghi_chu: StickyNote,
  id_chuc_vu: Briefcase,
  id_nhan_vien: User,
} as const satisfies Record<string, LucideIcon>;
