import type { DataTypeId } from '@/lib/data-types';
import type { PhieuHanhChinhFormValues } from './schema';

export const PHIEU_HANH_CHINH_FIELD_DATA_TYPE: Record<
  keyof PhieuHanhChinhFormValues,
  DataTypeId
> = {
  ma_phieu: 'enum',
  id_nhan_vien: 'ref',
  tu_ngay: 'date',
  buoi_bat_dau: 'enum',
  den_ngay: 'date',
  buoi_ket_thuc: 'enum',
  gio_bat_dau: 'time',
  gio_ket_thuc: 'time',
  ly_do: 'long_text',
  hinh_anh: 'multi_image',
};
