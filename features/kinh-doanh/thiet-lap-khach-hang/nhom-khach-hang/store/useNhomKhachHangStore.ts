import { txt } from '@/lib/text';
import { TABLE_COLUMN_PRESETS } from '@/lib/table-column-presets';
import { createGenericStore, type ColumnConfig } from '@/store/createGenericStore';
import type { NhomKhachHangFilters } from '../core/types';

const P = TABLE_COLUMN_PRESETS;

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ten_nhom', label: txt('customerSettings.nhom.store.nameCol'), visible: true, ...P.titleShort, order: 0, priority: 1 },
  { id: 'mo_ta', label: txt('customerSettings.nhom.store.descCol'), visible: true, ...P.longText, order: 1, priority: 2 },
  { id: 'ten_nguoi_tao', label: txt('customerSettings.nhom.store.creatorCol'), visible: true, ...P.titleShort, order: 2, priority: 3 },
  { id: 'tg_tao', label: txt('customerSettings.nhom.store.createdCol'), visible: true, ...P.datetime, order: 3, priority: 3 },
  { id: 'tg_cap_nhat', label: txt('customerSettings.nhom.store.updatedCol'), visible: true, ...P.datetime, order: 4, priority: 3 },
];

const initialFilters: NhomKhachHangFilters = {
  columnSearch: {},
  nguoi_tao: [],
};

export const useNhomKhachHangStore = createGenericStore(initialFilters, DEFAULT_COLUMNS, 'table-nhom-khach-hang');
