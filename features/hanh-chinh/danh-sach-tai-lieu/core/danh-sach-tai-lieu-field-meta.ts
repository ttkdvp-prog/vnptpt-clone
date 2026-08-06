import type { DataTypeId } from '@/lib/data-types';
import type { DanhSachTaiLieuFormValues } from './schema';

export const DANH_SACH_TAI_LIEU_FIELD_DATA_TYPE: Record<
  keyof DanhSachTaiLieuFormValues,
  DataTypeId
> = {
  id_loai_tai_lieu: 'ref',
  ten_tai_lieu: 'name',
  mo_ta: 'long_text',
  link_tai_lieu: 'url',
  ghi_chu: 'long_text',
  trang_thai: 'enum',
  id_chuc_vu: 'enum_list',
  id_nhan_vien: 'enum_list',
};
