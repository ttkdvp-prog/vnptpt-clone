import type { DataTypeId } from '@/lib/data-types';
import type { HopDongFormValues } from './schema';

export const HOP_DONG_FIELD_DATA_TYPE: Record<keyof HopDongFormValues, DataTypeId> = {
  loai_hop_dong: 'enum',
  ma_hop_dong: 'text',
  ngay_ky: 'date',
  ngay_hieu_luc: 'date',
  ngay_ket_thuc: 'date',
  id_nhan_vien: 'ref',
  id_chuc_vu: 'ref',
  id_phong_ban: 'ref',
  muc_luong: 'text',
  hinh_thuc_tra_luong: 'enum',
  che_do_khac: 'long_text',
  noi_lam_viec: 'text',
  thoi_gian_lam_viec: 'text',
  luu_y_khac: 'long_text',
  ghi_chu: 'long_text',
  trang_thai: 'enum',
};
