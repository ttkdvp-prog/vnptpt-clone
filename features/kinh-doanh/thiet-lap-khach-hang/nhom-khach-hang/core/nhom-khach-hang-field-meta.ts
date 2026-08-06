import type { DataTypeId } from '@/lib/data-types';
import type { NhomKhachHangFormValues } from './schema';

export const NHOM_KHACH_HANG_FIELD_DATA_TYPE: Record<
  keyof NhomKhachHangFormValues,
  DataTypeId
> = {
  ten_nhom: 'name',
  mo_ta: 'long_text',
};
