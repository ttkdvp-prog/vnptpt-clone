import type { DataTypeId } from '@/lib/data-types';
import type { ThongBaoFormValues } from './schema';

export const THONG_BAO_FIELD_DATA_TYPE: Record<keyof ThongBaoFormValues, DataTypeId> = {
  tg_dang: 'datetime',
  tieu_de: 'text',
  noi_dung: 'long_text',
  id_chuc_vu: 'enum_list',
};
