/** Map Postgres An Hung Thinh columns ↔ app domain shapes (no schema ALTER). */

const nowIso = (): string => new Date().toISOString();

function toIso(value: Date | string | null | undefined): string | undefined {
  if (value == null) return undefined;
  if (value instanceof Date) return value.toISOString();
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export function mapNhanVienTrangThaiToApp(raw: string | null | undefined): string {
  const v = String(raw ?? '').toUpperCase();
  if (v === 'INACTIVE' || v === 'RESIGNED' || v === 'NGHỈ VIỆC') return 'Nghỉ việc';
  if (v === 'PROBATION' || v === 'THỬ VIỆC') return 'Thử việc';
  if (v === 'LEAVE' || v === 'NGHỈ PHÉP') return 'Nghỉ phép';
  return 'Đang làm việc';
}

export function mapNhanVienTrangThaiToDb(app: string): string {
  if (app === 'Nghỉ việc') return 'INACTIVE';
  if (app === 'Thử việc') return 'PROBATION';
  if (app === 'Nghỉ phép') return 'LEAVE';
  return 'ACTIVE';
}

export interface DbNhanVien {
  id: number | string;
  ho_va_ten: string;
  hinh_anh: string | null;
  trang_thai: string;
  /** Text tự do (chức danh) — không phải khóa ngoại, không có bảng tra. */
  id_chuc_vu?: string | null;
  /** Text tự do (tên tổ/phòng) — không phải khóa ngoại, không có bảng tra. */
  id_phong_ban?: string | null;
  must_change_password?: boolean | null;
  /** Cấp nhân viên — 'Trung tâm' | 'Tổ', cột tự do trong sheet. */
  cap?: string | null;
}

export interface AppEmployee {
  id: string;
  ho_ten: string;
  must_change_password: boolean;
  tai_khoan_dang_hoat_dong: boolean;
  trang_thai: string;
  anh_dai_dien?: string;
  chuc_danh?: string | null;
  to_phong?: string | null;
  cap?: string | null;
}

export function mapEmployeeFromDb(row: DbNhanVien): AppEmployee {
  const trangThai = mapNhanVienTrangThaiToApp(row.trang_thai);
  return {
    id: String(row.id),
    ho_ten: row.ho_va_ten,
    must_change_password: Boolean(row.must_change_password),
    tai_khoan_dang_hoat_dong: trangThai !== 'Nghỉ việc',
    trang_thai: trangThai,
    anh_dai_dien: row.hinh_anh ?? undefined,
    chuc_danh: row.id_chuc_vu ?? null,
    to_phong: row.id_phong_ban ?? null,
    cap: row.cap || null,
  };
}

export function toDbId(value: string | null | undefined): number | null {
  if (value == null || value === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export interface DbNhomKhachHang {
  id: number | string;
  ten_nhom: string;
  mo_ta?: string | null;
  nguoi_tao?: number | string | null;
  tg_tao?: Date | string | null;
  tg_cap_nhat?: Date | string | null;
  ten_nguoi_tao?: string | null;
}

export interface AppNhomKhachHang {
  id: string;
  ten_nhom: string;
  mo_ta: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  nguoi_tao?: string | null;
  ten_nguoi_tao?: string | null;
}

export function mapNhomKhachHangFromDb(row: DbNhomKhachHang): AppNhomKhachHang {
  const fallbackTs = nowIso();
  return {
    id: String(row.id),
    ten_nhom: row.ten_nhom,
    mo_ta: row.mo_ta ?? null,
    tg_tao: toIso(row.tg_tao) ?? fallbackTs,
    tg_cap_nhat: toIso(row.tg_cap_nhat) ?? fallbackTs,
    nguoi_tao: row.nguoi_tao == null ? null : String(row.nguoi_tao),
    ten_nguoi_tao: row.ten_nguoi_tao ?? null,
  };
}

export interface DbTrangThaiKhachHang {
  id: number | string;
  ten_trang_thai: string;
  mo_ta?: string | null;
  nguoi_tao?: number | string | null;
  tg_tao?: Date | string | null;
  tg_cap_nhat?: Date | string | null;
  ten_nguoi_tao?: string | null;
}

export interface AppTrangThaiKhachHang {
  id: string;
  ten_trang_thai: string;
  mo_ta: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  nguoi_tao?: string | null;
  ten_nguoi_tao?: string | null;
}

export function mapTrangThaiKhachHangFromDb(row: DbTrangThaiKhachHang): AppTrangThaiKhachHang {
  const fallbackTs = nowIso();
  return {
    id: String(row.id),
    ten_trang_thai: row.ten_trang_thai,
    mo_ta: row.mo_ta ?? null,
    tg_tao: toIso(row.tg_tao) ?? fallbackTs,
    tg_cap_nhat: toIso(row.tg_cap_nhat) ?? fallbackTs,
    nguoi_tao: row.nguoi_tao == null ? null : String(row.nguoi_tao),
    ten_nguoi_tao: row.ten_nguoi_tao ?? null,
  };
}

export interface DbKhachHang {
  id: number | string;
  ma_khach_hang: string;
  ten_khach_hang: string;
  so_dien_thoai?: string | null;
  dia_chi?: string | null;
  ghi_chu?: string | null;
  id_nhom: number | string;
  id_trang_thai: number | string;
  nguoi_tao?: number | string | null;
  tg_tao?: Date | string | null;
  tg_cap_nhat?: Date | string | null;
  ten_nhom?: string | null;
  ten_trang_thai?: string | null;
  ten_nguoi_tao?: string | null;
  so_nguoi_lien_he?: number | null;
}

export interface AppKhachHang {
  id: string;
  ma_khach_hang: string;
  ten_khach_hang: string;
  so_dien_thoai: string | null;
  dia_chi: string | null;
  ghi_chu: string | null;
  id_nhom: string;
  id_trang_thai: string;
  ten_nhom?: string | null;
  ten_trang_thai?: string | null;
  /** Số người liên hệ thuộc khách hàng */
  so_nguoi_lien_he: number;
  tg_tao: string;
  tg_cap_nhat: string;
  nguoi_tao?: string | null;
  ten_nguoi_tao?: string | null;
}

export function mapKhachHangFromDb(row: DbKhachHang): AppKhachHang {
  const fallbackTs = nowIso();
  return {
    id: String(row.id),
    ma_khach_hang: row.ma_khach_hang,
    ten_khach_hang: row.ten_khach_hang,
    so_dien_thoai: row.so_dien_thoai ?? null,
    dia_chi: row.dia_chi ?? null,
    ghi_chu: row.ghi_chu ?? null,
    id_nhom: String(row.id_nhom),
    id_trang_thai: String(row.id_trang_thai),
    ten_nhom: row.ten_nhom ?? null,
    ten_trang_thai: row.ten_trang_thai ?? null,
    so_nguoi_lien_he: row.so_nguoi_lien_he ?? 0,
    tg_tao: toIso(row.tg_tao) ?? fallbackTs,
    tg_cap_nhat: toIso(row.tg_cap_nhat) ?? fallbackTs,
    nguoi_tao: row.nguoi_tao == null ? null : String(row.nguoi_tao),
    ten_nguoi_tao: row.ten_nguoi_tao ?? null,
  };
}

export interface DbNguoiLienHe {
  id: number | string;
  id_khach_hang: number | string;
  ho_ten: string;
  ngay_sinh?: string | null;
  chuc_vu?: string | null;
  so_dien_thoai?: string | null;
  email?: string | null;
  dia_chi?: string | null;
  ghi_chu?: string | null;
  nguoi_tao?: number | string | null;
  tg_tao?: Date | string | null;
  tg_cap_nhat?: Date | string | null;
  ten_khach_hang?: string | null;
  ma_khach_hang?: string | null;
  ten_nguoi_tao?: string | null;
}

export interface AppNguoiLienHe {
  id: string;
  id_khach_hang: string;
  ho_ten: string;
  ngay_sinh: string | null;
  chuc_vu: string | null;
  so_dien_thoai: string | null;
  email: string | null;
  dia_chi: string | null;
  ghi_chu: string | null;
  ten_khach_hang?: string | null;
  ma_khach_hang?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  nguoi_tao?: string | null;
  ten_nguoi_tao?: string | null;
}

export function mapNguoiLienHeFromDb(row: DbNguoiLienHe): AppNguoiLienHe {
  const fallbackTs = nowIso();
  return {
    id: String(row.id),
    id_khach_hang: String(row.id_khach_hang),
    ho_ten: row.ho_ten,
    ngay_sinh: row.ngay_sinh ?? null,
    chuc_vu: row.chuc_vu ?? null,
    so_dien_thoai: row.so_dien_thoai ?? null,
    email: row.email ?? null,
    dia_chi: row.dia_chi ?? null,
    ghi_chu: row.ghi_chu ?? null,
    ten_khach_hang: row.ten_khach_hang ?? null,
    ma_khach_hang: row.ma_khach_hang ?? null,
    tg_tao: toIso(row.tg_tao) ?? fallbackTs,
    tg_cap_nhat: toIso(row.tg_cap_nhat) ?? fallbackTs,
    nguoi_tao: row.nguoi_tao == null ? null : String(row.nguoi_tao),
    ten_nguoi_tao: row.ten_nguoi_tao ?? null,
  };
}

export interface DbLoaiTaiLieu {
  id: number | string;
  thu_tu: number;
  ten_loai_tai_lieu: string;
  mo_ta?: string | null;
  nguoi_tao?: number | string | null;
  tg_tao?: Date | string | null;
  tg_cap_nhat?: Date | string | null;
  ten_nguoi_tao?: string | null;
}

export interface AppLoaiTaiLieu {
  id: string;
  thu_tu: number;
  ten_loai_tai_lieu: string;
  mo_ta: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  nguoi_tao?: string | null;
  ten_nguoi_tao?: string | null;
}

export function mapLoaiTaiLieuFromDb(row: DbLoaiTaiLieu): AppLoaiTaiLieu {
  const fallbackTs = nowIso();
  return {
    id: String(row.id),
    thu_tu: row.thu_tu,
    ten_loai_tai_lieu: row.ten_loai_tai_lieu,
    mo_ta: row.mo_ta ?? null,
    tg_tao: toIso(row.tg_tao) ?? fallbackTs,
    tg_cap_nhat: toIso(row.tg_cap_nhat) ?? fallbackTs,
    nguoi_tao: row.nguoi_tao == null ? null : String(row.nguoi_tao),
    ten_nguoi_tao: row.ten_nguoi_tao ?? null,
  };
}

export interface DbDanhSachTaiLieu {
  id: number | string;
  id_loai_tai_lieu: number | string;
  ten_tai_lieu: string;
  mo_ta?: string | null;
  link_tai_lieu?: string | null;
  ghi_chu?: string | null;
  trang_thai: string;
  id_chuc_vu?: number[] | null;
  id_nhan_vien?: number[] | null;
  nguoi_tao?: number | string | null;
  tg_tao?: Date | string | null;
  tg_cap_nhat?: Date | string | null;
  ten_loai_tai_lieu?: string | null;
  ten_nguoi_tao?: string | null;
}

export interface AppDanhSachTaiLieu {
  id: string;
  id_loai_tai_lieu: string;
  ten_tai_lieu: string;
  mo_ta: string | null;
  link_tai_lieu: string | null;
  ghi_chu: string | null;
  trang_thai: string;
  id_chuc_vu: string[];
  id_nhan_vien: string[];
  ten_chuc_vu?: string[];
  ten_nhan_vien?: string[];
  ten_loai_tai_lieu?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  nguoi_tao?: string | null;
  ten_nguoi_tao?: string | null;
}

export function mapDanhSachTaiLieuFromDb(row: DbDanhSachTaiLieu): AppDanhSachTaiLieu {
  const fallbackTs = nowIso();
  return {
    id: String(row.id),
    id_loai_tai_lieu: String(row.id_loai_tai_lieu),
    ten_tai_lieu: row.ten_tai_lieu,
    mo_ta: row.mo_ta ?? null,
    link_tai_lieu: row.link_tai_lieu ?? null,
    ghi_chu: row.ghi_chu ?? null,
    trang_thai: row.trang_thai,
    id_chuc_vu: (row.id_chuc_vu ?? []).map(String),
    id_nhan_vien: (row.id_nhan_vien ?? []).map(String),
    ten_loai_tai_lieu: row.ten_loai_tai_lieu ?? null,
    tg_tao: toIso(row.tg_tao) ?? fallbackTs,
    tg_cap_nhat: toIso(row.tg_cap_nhat) ?? fallbackTs,
    nguoi_tao: row.nguoi_tao == null ? null : String(row.nguoi_tao),
    ten_nguoi_tao: row.ten_nguoi_tao ?? null,
  };
}

export interface DbMarketIn {
  id: number | string;
  thu_tu: number;
  id_khach_hang: number | string;
  ma_san_pham: string;
  ma_market: string;
  mo_ta?: string | null;
  link_file?: string | null;
  id_nguoi_ve?: number | string | null;
  trang_thai: string;
  ngay_hieu_luc?: Date | string | null;
  id_nguoi_duyet?: number | string | null;
  tg_duyet?: Date | string | null;
  nguoi_tao?: number | string | null;
  tg_tao?: Date | string | null;
  tg_cap_nhat?: Date | string | null;
  ten_khach_hang?: string | null;
  ma_khach_hang?: string | null;
  ten_nguoi_ve?: string | null;
  ten_nguoi_duyet?: string | null;
  ten_nguoi_tao?: string | null;
}

export interface AppMarketIn {
  id: string;
  thu_tu: number;
  id_khach_hang: string;
  ma_san_pham: string;
  ma_market: string;
  mo_ta: string | null;
  link_file: string | null;
  id_nguoi_ve: string | null;
  trang_thai: string;
  ngay_hieu_luc: string | null;
  id_nguoi_duyet: string | null;
  tg_duyet: string | null;
  ten_khach_hang?: string | null;
  ma_khach_hang?: string | null;
  ten_nguoi_ve?: string | null;
  ten_nguoi_duyet?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  nguoi_tao?: string | null;
  ten_nguoi_tao?: string | null;
}

function toDateOnlyIso(value: Date | string | null | undefined): string | null {
  if (value == null) return null;
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    return value.toISOString().slice(0, 10);
  }
  const s = String(value).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

export function mapMarketInFromDb(row: DbMarketIn): AppMarketIn {
  const fallbackTs = nowIso();
  return {
    id: String(row.id),
    thu_tu: row.thu_tu ?? 0,
    id_khach_hang: String(row.id_khach_hang),
    ma_san_pham: row.ma_san_pham,
    ma_market: row.ma_market,
    mo_ta: row.mo_ta ?? null,
    link_file: row.link_file ?? null,
    id_nguoi_ve: row.id_nguoi_ve == null ? null : String(row.id_nguoi_ve),
    trang_thai: row.trang_thai,
    ngay_hieu_luc: toDateOnlyIso(row.ngay_hieu_luc),
    id_nguoi_duyet: row.id_nguoi_duyet == null ? null : String(row.id_nguoi_duyet),
    tg_duyet: toIso(row.tg_duyet) ?? null,
    ten_khach_hang: row.ten_khach_hang ?? null,
    ma_khach_hang: row.ma_khach_hang ?? null,
    ten_nguoi_ve: row.ten_nguoi_ve ?? null,
    ten_nguoi_duyet: row.ten_nguoi_duyet ?? null,
    tg_tao: toIso(row.tg_tao) ?? fallbackTs,
    tg_cap_nhat: toIso(row.tg_cap_nhat) ?? fallbackTs,
    nguoi_tao: row.nguoi_tao == null ? null : String(row.nguoi_tao),
    ten_nguoi_tao: row.ten_nguoi_tao ?? null,
  };
}

export interface DbPhieuHanhChinh {
  id: number | string;
  ma_phieu: string;
  id_nhan_vien: number | string;
  tu_ngay: Date | string;
  buoi_bat_dau: string;
  den_ngay: Date | string;
  buoi_ket_thuc: string;
  gio_bat_dau?: string | null;
  gio_ket_thuc?: string | null;
  ly_do?: string | null;
  hinh_anh?: string[] | null;
  trang_thai: string;
  id_ql_duyet?: number | string | null;
  tg_ql_duyet?: Date | string | null;
  ghi_chu_ql?: string | null;
  id_hcns_duyet?: number | string | null;
  tg_hcns_duyet?: Date | string | null;
  ghi_chu_hcns?: string | null;
  ly_do_tu_choi?: string | null;
  nguoi_tao?: number | string | null;
  tg_tao?: Date | string | null;
  tg_cap_nhat?: Date | string | null;
  ten_loai_phieu?: string | null;
  ten_nhan_vien?: string | null;
  id_phong_ban?: number | string | null;
  ten_phong_ban?: string | null;
  ten_ql_duyet?: string | null;
  ten_hcns_duyet?: string | null;
  ten_nguoi_tao?: string | null;
}

export interface AppPhieuHanhChinh {
  id: string;
  ma_phieu: string;
  id_nhan_vien: string;
  tu_ngay: string;
  buoi_bat_dau: string;
  den_ngay: string;
  buoi_ket_thuc: string;
  gio_bat_dau: string | null;
  gio_ket_thuc: string | null;
  ly_do: string | null;
  hinh_anh: string[];
  trang_thai: string;
  id_ql_duyet: string | null;
  tg_ql_duyet: string | null;
  ghi_chu_ql: string | null;
  id_hcns_duyet: string | null;
  tg_hcns_duyet: string | null;
  ghi_chu_hcns: string | null;
  ly_do_tu_choi: string | null;
  ten_loai_phieu?: string | null;
  ten_nhan_vien?: string | null;
  id_phong_ban?: string | null;
  ten_phong_ban?: string | null;
  ten_ql_duyet?: string | null;
  ten_hcns_duyet?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  nguoi_tao?: string | null;
  ten_nguoi_tao?: string | null;
}

export interface DbHopDong {
  id: number | string;
  loai_hop_dong: string;
  ma_hop_dong: string;
  ngay_ky: Date | string;
  ngay_hieu_luc: Date | string;
  ngay_ket_thuc?: Date | string | null;
  id_nhan_vien: number | string;
  id_chuc_vu: number | string;
  id_phong_ban: number | string;
  muc_luong: string;
  hinh_thuc_tra_luong: string;
  che_do_khac?: string | null;
  noi_lam_viec?: string | null;
  thoi_gian_lam_viec?: string | null;
  luu_y_khac?: string | null;
  ghi_chu?: string | null;
  trang_thai: string;
  nguoi_tao?: number | string | null;
  tg_tao?: Date | string | null;
  tg_cap_nhat?: Date | string | null;
  ten_nhan_vien?: string | null;
  ten_chuc_vu?: string | null;
  ten_phong_ban?: string | null;
  ten_nguoi_tao?: string | null;
}

export interface AppHopDong {
  id: string;
  loai_hop_dong: string;
  ma_hop_dong: string;
  ngay_ky: string;
  ngay_hieu_luc: string;
  ngay_ket_thuc: string | null;
  id_nhan_vien: string;
  id_chuc_vu: string;
  id_phong_ban: string;
  muc_luong: string;
  hinh_thuc_tra_luong: string;
  che_do_khac: string | null;
  noi_lam_viec: string | null;
  thoi_gian_lam_viec: string | null;
  luu_y_khac: string | null;
  ghi_chu: string | null;
  trang_thai: string;
  ten_nhan_vien?: string | null;
  ten_chuc_vu?: string | null;
  ten_phong_ban?: string | null;
  tg_tao: string;
  tg_cap_nhat: string;
  nguoi_tao?: string | null;
  ten_nguoi_tao?: string | null;
}

export function mapHopDongFromDb(row: DbHopDong): AppHopDong {
  const fallbackTs = nowIso();
  return {
    id: String(row.id),
    loai_hop_dong: row.loai_hop_dong,
    ma_hop_dong: row.ma_hop_dong,
    ngay_ky: toDateOnlyIso(row.ngay_ky) ?? '',
    ngay_hieu_luc: toDateOnlyIso(row.ngay_hieu_luc) ?? '',
    ngay_ket_thuc: toDateOnlyIso(row.ngay_ket_thuc),
    id_nhan_vien: String(row.id_nhan_vien),
    id_chuc_vu: String(row.id_chuc_vu),
    id_phong_ban: String(row.id_phong_ban),
    muc_luong: row.muc_luong,
    hinh_thuc_tra_luong: row.hinh_thuc_tra_luong,
    che_do_khac: row.che_do_khac ?? null,
    noi_lam_viec: row.noi_lam_viec ?? null,
    thoi_gian_lam_viec: row.thoi_gian_lam_viec ?? null,
    luu_y_khac: row.luu_y_khac ?? null,
    ghi_chu: row.ghi_chu ?? null,
    trang_thai: row.trang_thai,
    ten_nhan_vien: row.ten_nhan_vien ?? null,
    ten_chuc_vu: row.ten_chuc_vu ?? null,
    ten_phong_ban: row.ten_phong_ban ?? null,
    tg_tao: toIso(row.tg_tao) ?? fallbackTs,
    tg_cap_nhat: toIso(row.tg_cap_nhat) ?? fallbackTs,
    nguoi_tao: row.nguoi_tao == null ? null : String(row.nguoi_tao),
    ten_nguoi_tao: row.ten_nguoi_tao ?? null,
  };
}

export interface DbThongBao {
  id: number | string;
  tg_dang: Date | string;
  tieu_de: string;
  noi_dung: string;
  id_chuc_vu?: number[] | null;
  nguoi_tao?: number | string | null;
  tg_tao?: Date | string | null;
  tg_cap_nhat?: Date | string | null;
  ten_nguoi_tao?: string | null;
}

export interface AppThongBao {
  id: string;
  tg_dang: string;
  tieu_de: string;
  noi_dung: string;
  id_chuc_vu: string[];
  ten_chuc_vu?: string[];
  tg_tao: string;
  tg_cap_nhat: string;
  nguoi_tao?: string | null;
  ten_nguoi_tao?: string | null;
}

export function mapThongBaoFromDb(row: DbThongBao): AppThongBao {
  const fallbackTs = nowIso();
  return {
    id: String(row.id),
    tg_dang: toIso(row.tg_dang) ?? fallbackTs,
    tieu_de: row.tieu_de,
    noi_dung: row.noi_dung,
    id_chuc_vu: (row.id_chuc_vu ?? []).map(String),
    tg_tao: toIso(row.tg_tao) ?? fallbackTs,
    tg_cap_nhat: toIso(row.tg_cap_nhat) ?? fallbackTs,
    nguoi_tao: row.nguoi_tao == null ? null : String(row.nguoi_tao),
    ten_nguoi_tao: row.ten_nguoi_tao ?? null,
  };
}

export function mapPhieuHanhChinhFromDb(row: DbPhieuHanhChinh): AppPhieuHanhChinh {
  const fallbackTs = nowIso();
  return {
    id: String(row.id),
    ma_phieu: row.ma_phieu,
    id_nhan_vien: String(row.id_nhan_vien),
    tu_ngay: toDateOnlyIso(row.tu_ngay) ?? '',
    buoi_bat_dau: row.buoi_bat_dau,
    den_ngay: toDateOnlyIso(row.den_ngay) ?? '',
    buoi_ket_thuc: row.buoi_ket_thuc,
    gio_bat_dau: row.gio_bat_dau ?? null,
    gio_ket_thuc: row.gio_ket_thuc ?? null,
    ly_do: row.ly_do ?? null,
    hinh_anh: Array.isArray(row.hinh_anh) ? row.hinh_anh : [],
    trang_thai: row.trang_thai,
    id_ql_duyet: row.id_ql_duyet == null ? null : String(row.id_ql_duyet),
    tg_ql_duyet: toIso(row.tg_ql_duyet) ?? null,
    ghi_chu_ql: row.ghi_chu_ql ?? null,
    id_hcns_duyet: row.id_hcns_duyet == null ? null : String(row.id_hcns_duyet),
    tg_hcns_duyet: toIso(row.tg_hcns_duyet) ?? null,
    ghi_chu_hcns: row.ghi_chu_hcns ?? null,
    ly_do_tu_choi: row.ly_do_tu_choi ?? null,
    ten_loai_phieu: row.ten_loai_phieu ?? null,
    ten_nhan_vien: row.ten_nhan_vien ?? null,
    id_phong_ban: row.id_phong_ban == null ? null : String(row.id_phong_ban),
    ten_phong_ban: row.ten_phong_ban ?? null,
    ten_ql_duyet: row.ten_ql_duyet ?? null,
    ten_hcns_duyet: row.ten_hcns_duyet ?? null,
    tg_tao: toIso(row.tg_tao) ?? fallbackTs,
    tg_cap_nhat: toIso(row.tg_cap_nhat) ?? fallbackTs,
    nguoi_tao: row.nguoi_tao == null ? null : String(row.nguoi_tao),
    ten_nguoi_tao: row.ten_nguoi_tao ?? null,
  };
}
