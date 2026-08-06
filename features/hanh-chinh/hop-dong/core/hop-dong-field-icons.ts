import type { LucideIcon } from 'lucide-react';
import {
  Briefcase,
  Building2,
  Calendar,
  CircleDot,
  Clock,
  FileSignature,
  FileText,
  MapPin,
  StickyNote,
  User,
  Wallet,
} from 'lucide-react';

export const HOP_DONG_FIELD_ICONS = {
  loai_hop_dong: FileSignature,
  ma_hop_dong: FileSignature,
  ngay_ky: Calendar,
  ngay_hieu_luc: Calendar,
  ngay_ket_thuc: Calendar,
  trang_thai: CircleDot,
  id_nhan_vien: User,
  id_chuc_vu: Briefcase,
  id_phong_ban: Building2,
  muc_luong: Wallet,
  hinh_thuc_tra_luong: Wallet,
  noi_lam_viec: MapPin,
  thoi_gian_lam_viec: Clock,
  che_do_khac: FileText,
  luu_y_khac: StickyNote,
  ghi_chu: StickyNote,
} as const satisfies Record<string, LucideIcon>;
