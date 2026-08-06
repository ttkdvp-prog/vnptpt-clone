import { txt } from '@/lib/text';
import { TABLE_COLUMN_PRESETS } from '@/lib/table-column-presets';
import { createGenericStore, type ColumnConfig } from '@/store/createGenericStore';
import type { MarketInFilters } from '../core/types';

const P = TABLE_COLUMN_PRESETS;

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'thu_tu', label: txt('printMarket.store.orderCol'), visible: true, ...P.orderIndex, order: 0, priority: 3 },
  { id: 'ma_market', label: txt('printMarket.store.marketCodeCol'), visible: true, ...P.code, order: 1, priority: 1 },
  { id: 'ma_san_pham', label: txt('printMarket.store.productCodeCol'), visible: true, ...P.code, order: 2, priority: 2 },
  { id: 'ten_khach_hang', label: txt('printMarket.store.customerCol'), visible: true, ...P.titleShort, order: 3, priority: 1 },
  { id: 'trang_thai', label: txt('printMarket.store.statusCol'), visible: true, ...P.enumBadge, order: 4, priority: 2 },
  { id: 'ten_nguoi_ve', label: txt('printMarket.store.artistCol'), visible: true, ...P.titleShort, order: 5, priority: 2 },
  { id: 'ngay_hieu_luc', label: txt('printMarket.store.effectiveCol'), visible: true, ...P.date, order: 6, priority: 2 },
  { id: 'ten_nguoi_tao', label: txt('printMarket.store.creatorCol'), visible: true, ...P.titleShort, order: 7, priority: 3 },
  { id: 'tg_tao', label: txt('printMarket.store.createdCol'), visible: true, ...P.datetime, order: 8, priority: 3 },
  // Tuỳ chọn cột (ẩn mặc định)
  { id: 'ma_khach_hang', label: txt('printMarket.store.customerCodeCol'), visible: false, ...P.code, order: 9, priority: 3 },
  { id: 'mo_ta', label: txt('printMarket.store.descCol'), visible: false, ...P.longText, order: 10, priority: 3 },
  { id: 'link_file', label: txt('printMarket.store.linkCol'), visible: false, ...P.link, order: 11, priority: 3 },
  { id: 'ten_nguoi_duyet', label: txt('printMarket.store.approverCol'), visible: false, ...P.titleShort, order: 12, priority: 3 },
  { id: 'tg_duyet', label: txt('printMarket.store.approvedAtCol'), visible: false, ...P.datetime, order: 13, priority: 3 },
  { id: 'tg_cap_nhat', label: txt('printMarket.store.updatedCol'), visible: false, ...P.datetime, order: 14, priority: 3 },
];

const initialFilters: MarketInFilters = {
  columnSearch: {},
  id_khach_hang: [],
  trang_thai: [],
  id_nguoi_ve: [],
  nguoi_tao: [],
};

export const useMarketInStore = createGenericStore(initialFilters, DEFAULT_COLUMNS, 'table-market-in');
