import type { TrangThaiNhanVien } from './constants';

export interface Employee {
  id: string;
  ho_ten: string;
  must_change_password?: boolean;
  tai_khoan_dang_hoat_dong?: boolean;
  trang_thai: TrangThaiNhanVien;
  anh_dai_dien?: string | null;
  /** Text tự do (chức danh) — không có bảng tra, chỉ hiển thị nguyên văn. */
  chuc_danh?: string | null;
  /** Text tự do (tên tổ/phòng) — không có bảng tra, chỉ hiển thị nguyên văn. */
  to_phong?: string | null;
  /** Cấp nhân viên — 'Trung tâm' | 'Tổ', cột tự do trong sheet `var_nhan_vien`. */
  cap?: string | null;
}

export interface EmployeeFilters {
  columnSearch: Record<string, string>;
  trang_thai: string[];
}
