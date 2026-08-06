import type { DataTypeId } from '@/lib/data-types';
import type { EmployeeFormValues } from './schema';

export const EMPLOYEE_FIELD_DATA_TYPE: Partial<Record<keyof EmployeeFormValues, DataTypeId>> = {
  ho_ten: 'name',
  email: 'email',
  email_ca_nhan: 'email',
  so_dien_thoai: 'phone',
  chuc_vu_id: 'ref',
  phong_ban_id: 'ref',
  gioi_tinh: 'enum',
  ngay_sinh: 'date',
  so_cccd: 'text',
  ngay_cap_cccd: 'date',
  noi_cap_cccd: 'text',
  dia_chi_thuong_tru: 'address',
  dia_chi_hien_tai: 'address',
  que_quan: 'address',
  dan_toc: 'text',
  ton_giao: 'text',
  tinh_trang_hon_nhan: 'enum',
  quoc_tich: 'text',
  ngay_vao_lam: 'date',
  ngay_chinh_thuc: 'date',
  ngay_nghi_viec: 'date',
  ly_do_nghi: 'enum',
  so_tai_khoan: 'text',
  ten_chu_tai_khoan: 'name',
  ngan_hang: 'text',
  chi_nhanh: 'text',
  nguoi_lien_he_khan: 'name',
  sdt_khan: 'phone',
  moi_quan_he: 'enum',
  so_so_bhxh: 'text',
  so_bhyt: 'text',
  ma_so_thue_ca_nhan: 'text',
  trinh_do: 'enum',
  chuyen_nganh: 'text',
  truong: 'text',
  trang_thai: 'enum',
  anh_dai_dien: 'image',
};

export function getEmployeeFieldDataType(
  field: keyof EmployeeFormValues
): DataTypeId | undefined {
  return EMPLOYEE_FIELD_DATA_TYPE[field];
}
