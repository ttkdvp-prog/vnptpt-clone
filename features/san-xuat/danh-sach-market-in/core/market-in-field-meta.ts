import type { DataTypeId } from '@/lib/data-types';
import type { MarketInFormValues } from './schema';

export const MARKET_IN_FIELD_DATA_TYPE: Record<keyof MarketInFormValues, DataTypeId> = {
  thu_tu: 'number',
  id_khach_hang: 'ref',
  ma_san_pham: 'text',
  ma_market: 'text',
  mo_ta: 'long_text',
  link_file: 'url',
  id_nguoi_ve: 'ref',
  ngay_hieu_luc: 'date',
};
