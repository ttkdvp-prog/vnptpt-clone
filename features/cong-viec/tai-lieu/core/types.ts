import type { TinhTrangTaiLieu } from './constants';

export interface TaiLieu {
  id: string;
  /** Tự sinh, luôn bằng `id` (đơn giản hóa 1 counter — xem docs/modules/tai-lieu.md). */
  so_ho_so: string;
  ten_ho_so: string;
  /** Text tự do — gợi ý từ distinct giá trị đã dùng, không có bảng danh mục riêng. */
  danh_muc: string;
  /** id_phong_ban — nguồn distinct từ var_nhan_vien. */
  to: string;
  ngay_ban_hanh: string;
  ngay_ket_thuc?: string | null;
  tinh_trang: TinhTrangTaiLieu;
  url?: string | null;
  mo_ta?: string | null;
  nguoi_tao?: string | null;
  tg_tao?: string | null;
  tg_cap_nhat?: string | null;
}

export interface TaiLieuFilters {
  columnSearch: Record<string, string>;
  tinh_trang: string[];
  danh_muc: string[];
  to: string[];
}
