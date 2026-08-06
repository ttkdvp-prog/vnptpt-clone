import type { Employee } from '../core/types';
import type { EmployeeCreateFormValues, EmployeeEditFormValues, EmployeeFormValues } from '../core/schema';
import { coerceEntityId } from '@/lib/coerce-entity-id';

const nullHrDefaults = {
  email_ca_nhan: null,
  ngay_sinh: null,
  so_cccd: null,
  ngay_cap_cccd: null,
  noi_cap_cccd: null,
  dia_chi_thuong_tru: null,
  dia_chi_hien_tai: null,
  que_quan: null,
  dan_toc: null,
  ton_giao: null,
  tinh_trang_hon_nhan: null,
  quoc_tich: null,
  ngay_vao_lam: null,
  ngay_chinh_thuc: null,
  ngay_nghi_viec: null,
  ly_do_nghi: null,
  so_tai_khoan: null,
  ten_chu_tai_khoan: null,
  ngan_hang: null,
  chi_nhanh: null,
  nguoi_lien_he_khan: null,
  sdt_khan: null,
  moi_quan_he: null,
  so_so_bhxh: null,
  so_bhyt: null,
  ma_so_thue_ca_nhan: null,
  trinh_do: null,
  chuyen_nganh: null,
  truong: null,
} as const;

export function getDefaultEmployeeFormValues(): EmployeeFormValues {
  return {
    ho_ten: '',
    email: '',
    so_dien_thoai: '',
    chuc_vu_id: '',
    phong_ban_id: '',
    gioi_tinh: 'Nam',
    ...nullHrDefaults,
    trang_thai: 'Đang làm việc',
    anh_dai_dien: '',
  };
}

export function getDefaultEmployeeCreateFormValues(): EmployeeCreateFormValues {
  return {
    ...getDefaultEmployeeFormValues(),
    ten_dang_nhap: '',
    mat_khau_tam: '',
    // Điền sẵn ba trường nhân thân đúng với gần như mọi hồ sơ — HR sửa được như giá trị
    // bình thường. Trước đây chúng là *placeholder* (`Việt Nam` / `Kinh` / `Không`), tức
    // chữ xám trông y hệt dữ liệu đã lưu, khiến người nhập bỏ qua và lưu ra hồ sơ trống.
    // CHỈ áp dụng khi Thêm mới — form Sửa dùng `getDefaultEmployeeFormValues()` rồi
    // `reset(employeeToEditFormValues(...))`, nên hồ sơ cũ đang trống không bị điền đè.
    quoc_tich: 'Việt Nam',
    dan_toc: 'Kinh',
    ton_giao: 'Không',
  };
}

export function employeeToFormValues(emp: Employee): EmployeeFormValues {
  return {
    ho_ten: emp.ho_ten,
    email: emp.email,
    so_dien_thoai: emp.so_dien_thoai,
    chuc_vu_id: coerceEntityId(emp.chuc_vu_id),
    phong_ban_id: coerceEntityId(emp.phong_ban_id),
    gioi_tinh: emp.gioi_tinh,
    email_ca_nhan: emp.email_ca_nhan ?? null,
    ngay_sinh: emp.ngay_sinh ?? null,
    so_cccd: emp.so_cccd ?? null,
    ngay_cap_cccd: emp.ngay_cap_cccd ?? null,
    noi_cap_cccd: emp.noi_cap_cccd ?? null,
    dia_chi_thuong_tru: emp.dia_chi_thuong_tru ?? null,
    dia_chi_hien_tai: emp.dia_chi_hien_tai ?? null,
    que_quan: emp.que_quan ?? null,
    dan_toc: emp.dan_toc ?? null,
    ton_giao: emp.ton_giao ?? null,
    tinh_trang_hon_nhan: emp.tinh_trang_hon_nhan ?? null,
    quoc_tich: emp.quoc_tich ?? null,
    ngay_vao_lam: emp.ngay_vao_lam ?? null,
    ngay_chinh_thuc: emp.ngay_chinh_thuc ?? null,
    ngay_nghi_viec: emp.ngay_nghi_viec ?? null,
    ly_do_nghi: emp.ly_do_nghi ?? null,
    so_tai_khoan: emp.so_tai_khoan ?? null,
    ten_chu_tai_khoan: emp.ten_chu_tai_khoan ?? null,
    ngan_hang: emp.ngan_hang ?? null,
    chi_nhanh: emp.chi_nhanh ?? null,
    nguoi_lien_he_khan: emp.nguoi_lien_he_khan ?? null,
    sdt_khan: emp.sdt_khan ?? null,
    moi_quan_he: emp.moi_quan_he ?? null,
    so_so_bhxh: emp.so_so_bhxh ?? null,
    so_bhyt: emp.so_bhyt ?? null,
    ma_so_thue_ca_nhan: emp.ma_so_thue_ca_nhan ?? null,
    trinh_do: emp.trinh_do ?? null,
    chuyen_nganh: emp.chuyen_nganh ?? null,
    truong: emp.truong ?? null,
    trang_thai: emp.trang_thai,
    anh_dai_dien: emp.anh_dai_dien ?? undefined,
  };
}

export function employeeToEditFormValues(emp: Employee): EmployeeEditFormValues {
  return {
    ...employeeToFormValues(emp),
    ten_dang_nhap: emp.ten_dang_nhap ?? '',
    mat_khau_tam: '',
  };
}
