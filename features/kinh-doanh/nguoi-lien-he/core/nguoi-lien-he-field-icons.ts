import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  Building2,
  Calendar,
  Mail,
  MapPin,
  Phone,
  StickyNote,
  User,
} from 'lucide-react';

export const NGUOI_LIEN_HE_FIELD_ICONS = {
  id_khach_hang: Building2,
  ho_ten: User,
  ngay_sinh: Calendar,
  chuc_vu: Briefcase,
  so_dien_thoai: Phone,
  email: Mail,
  dia_chi: MapPin,
  ghi_chu: StickyNote,
} as const satisfies Record<string, LucideIcon>;
