import type { DataTypeId } from '@/lib/data-types';
import type { TrangThaiKhachHangFormValues } from './schema';

export const TRANG_THAI_KHACH_HANG_FIELD_DATA_TYPE: Record<
  keyof TrangThaiKhachHangFormValues,
  DataTypeId
> = {
  ten_trang_thai: 'name',
  mo_ta: 'long_text',
};
