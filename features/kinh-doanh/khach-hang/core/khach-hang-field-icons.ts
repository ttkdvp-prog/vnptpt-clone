import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Hash,
  MapPin,
  Phone,
  StickyNote,
  Users,
  UsersRound,
} from 'lucide-react';

export const KHACH_HANG_FIELD_ICONS = {
  ma_khach_hang: Hash,
  ten_khach_hang: Users,
  id_nhom: UsersRound,
  id_trang_thai: Activity,
  so_dien_thoai: Phone,
  dia_chi: MapPin,
  ghi_chu: StickyNote,
} as const satisfies Record<string, LucideIcon>;
