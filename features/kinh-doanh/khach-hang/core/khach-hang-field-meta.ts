import type { DataTypeId } from '@/lib/data-types';
import type { KhachHangFormValues } from './schema';

export const KHACH_HANG_FIELD_DATA_TYPE: Record<keyof KhachHangFormValues, DataTypeId> = {
  ma_khach_hang: 'text',
  ten_khach_hang: 'name',
  so_dien_thoai: 'phone',
  dia_chi: 'address',
  ghi_chu: 'long_text',
  id_nhom: 'ref',
  id_trang_thai: 'ref',
};
