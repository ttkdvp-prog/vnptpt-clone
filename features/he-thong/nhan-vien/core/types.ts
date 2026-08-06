import type { TrangThaiNhanVien } from './constants';

export type Gender = 'Nam' | 'Nữ' | 'Khác';

export interface Employee {
  id: string;
  ho_ten: string;
  email: string;
  email_ca_nhan?: string | null;
  so_dien_thoai: string;
  ten_dang_nhap?: string | null;
  must_change_password?: boolean;
  tai_khoan_dang_hoat_dong?: boolean;
  phong_ban_id: string | null;
  chuc_vu_id: string | null;
  ten_phong_ban?: string;
  /** Nhóm/phòng con cấp 2 — enrich từ cây phòng ban, không cột DB */
  ten_bo_phan?: string | null;
  ten_chuc_vu?: string;
  /** Cấp bậc số — enrich từ var_chuc_vu */
  cap_bac?: number | null;
  gioi_tinh: Gender;
  ngay_sinh?: string | null;
  so_cccd?: string | null;
  ngay_cap_cccd?: string | null;
  noi_cap_cccd?: string | null;
  dia_chi_thuong_tru?: string | null;
  dia_chi_hien_tai?: string | null;
  que_quan?: string | null;
  dan_toc?: string | null;
  ton_giao?: string | null;
  tinh_trang_hon_nhan?: string | null;
  quoc_tich?: string | null;
  ngay_vao_lam?: string | null;
  ngay_chinh_thuc?: string | null;
  ngay_nghi_viec?: string | null;
  ly_do_nghi?: string | null;
  so_tai_khoan?: string | null;
  ten_chu_tai_khoan?: string | null;
  ngan_hang?: string | null;
  chi_nhanh?: string | null;
  nguoi_lien_he_khan?: string | null;
  sdt_khan?: string | null;
  moi_quan_he?: string | null;
  so_so_bhxh?: string | null;
  so_bhyt?: string | null;
  ma_so_thue_ca_nhan?: string | null;
  trinh_do?: string | null;
  chuyen_nganh?: string | null;
  truong?: string | null;
  trang_thai: TrangThaiNhanVien;
  anh_dai_dien?: string;
  tg_tao?: string;
  tg_cap_nhat?: string;
  /** Id NV tạo bản ghi */
  nguoi_tao?: string | null;
  /** Enrich từ join creator */
  ten_nguoi_tao?: string | null;
}

export interface EmployeeFilters {
  columnSearch: Record<string, string>;
  trang_thai: string[];
  phong_ban_id: string[];
  gender: string[];
  position: string[];
}
