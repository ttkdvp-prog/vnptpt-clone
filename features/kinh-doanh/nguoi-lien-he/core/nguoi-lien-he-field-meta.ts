import type { DataTypeId } from '@/lib/data-types';
import type { NguoiLienHeFormValues } from './schema';

export const NGUOI_LIEN_HE_FIELD_DATA_TYPE: Record<
  Exclude<keyof NguoiLienHeFormValues, 'ngay_sinh'>,
  DataTypeId
> = {
  id_khach_hang: 'ref',
  ho_ten: 'name',
  chuc_vu: 'text',
  so_dien_thoai: 'phone',
  email: 'email',
  dia_chi: 'address',
  ghi_chu: 'long_text',
};
