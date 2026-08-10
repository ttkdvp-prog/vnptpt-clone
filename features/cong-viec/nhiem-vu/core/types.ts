import type { TrangThaiNhiemVu, UuTienNhiemVu } from './constants';

export interface NhiemVu {
  id: string;
  tieu_de: string;
  mo_ta?: string | null;
  /** Mã nhân viên phụ trách chính (1 người). */
  nguoi_phu_trach: string;
  han_chot: string;
  trang_thai: TrangThaiNhiemVu;
  uu_tien: UuTienNhiemVu;
  ghi_chu?: string | null;
  nguoi_tao?: string | null;
  tg_tao?: string | null;
  tg_cap_nhat?: string | null;
}

export interface NhiemVuFilters {
  columnSearch: Record<string, string>;
  trang_thai: string[];
  uu_tien: string[];
  nguoi_phu_trach: string[];
}
