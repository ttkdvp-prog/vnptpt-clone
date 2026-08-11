import type { CapCongViec, UuTienCongViec } from './constants';

export interface CongViec {
  id: string;
  cap: CapCongViec;
  tieu_de: string;
  mo_ta?: string | null;
  /** id_phong_ban của tổ vừa Accountable + Responsible (tổ chính). */
  to_ar: string;
  /** id_phong_ban của tổ Responsible hỗ trợ, optional. */
  to_r?: string | null;
  /** Mã nhân viên chịu trách nhiệm (Accountable), 1 người. */
  mnv_a: string;
  /** CSV mã nhân viên thực hiện (Responsible). */
  mnv_r?: string | null;
  /** CSV mã nhân viên tham vấn (Consulted). */
  mnv_c?: string | null;
  /** CSV mã nhân viên Ban giám đốc — giao việc + giám sát toàn bộ, không phụ thuộc cấp/tổ. */
  mnv_bgd?: string | null;
  uu_tien: UuTienCongViec;
  ngay_bd: string;
  ngay_kt: string;
  ghi_chu?: string | null;
  ngay_ht?: string | null;
  tep_dinh_kem?: string | null;
  nguoi_tao?: string | null;
  tg_tao?: string | null;
  tg_cap_nhat?: string | null;
  /** Số lượng kế hoạch. */
  ke_hoach?: number | null;
  /** Số lượng thực hiện. */
  thuc_hien?: number | null;
}

export type TrangThaiCongViec = 'hoan_thanh' | 'qua_han' | 'dang_thuc_hien';

export function getCongViecTrangThai(item: Pick<CongViec, 'ngay_ht' | 'ngay_kt'>): TrangThaiCongViec {
  if (item.ngay_ht) return 'hoan_thanh';
  const today = new Date().toISOString().slice(0, 10);
  if (item.ngay_kt && today > item.ngay_kt) return 'qua_han';
  return 'dang_thuc_hien';
}

export interface CongViecFilters {
  columnSearch: Record<string, string>;
  cap: string[];
  uu_tien: string[];
  to_ar: string[];
  to_r: string[];
  mnv_a: string[];
  mnv_r: string[];
  mnv_c: string[];
  trang_thai: string[];
}
