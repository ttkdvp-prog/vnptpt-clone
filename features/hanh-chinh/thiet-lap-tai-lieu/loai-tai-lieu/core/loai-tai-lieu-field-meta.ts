import type { DataTypeId } from '@/lib/data-types';
import type { LoaiTaiLieuFormValues } from './schema';

export const LOAI_TAI_LIEU_FIELD_DATA_TYPE: Record<keyof LoaiTaiLieuFormValues, DataTypeId> = {
  thu_tu: 'number',
  ten_loai_tai_lieu: 'name',
  mo_ta: 'long_text',
};
