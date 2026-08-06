import { txt } from '@/lib/text';
import { TABLE_COLUMN_PRESETS } from '@/lib/table-column-presets';
import { createGenericStore, type ColumnConfig } from '@/store/createGenericStore';
import type { TrangThaiKhachHangFilters } from '../core/types';

const P = TABLE_COLUMN_PRESETS;

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ten_trang_thai', label: txt('customerSettings.trangThai.store.nameCol'), visible: true, ...P.titleShort, order: 0, priority: 1 },
  { id: 'mo_ta', label: txt('customerSettings.trangThai.store.descCol'), visible: true, ...P.longText, order: 1, priority: 2 },
  { id: 'ten_nguoi_tao', label: txt('customerSettings.trangThai.store.creatorCol'), visible: true, ...P.titleShort, order: 2, priority: 3 },
  { id: 'tg_tao', label: txt('customerSettings.trangThai.store.createdCol'), visible: true, ...P.datetime, order: 3, priority: 3 },
  { id: 'tg_cap_nhat', label: txt('customerSettings.trangThai.store.updatedCol'), visible: true, ...P.datetime, order: 4, priority: 3 },
];

const initialFilters: TrangThaiKhachHangFilters = {
  columnSearch: {},
  nguoi_tao: [],
};

export const useTrangThaiKhachHangStore = createGenericStore(initialFilters, DEFAULT_COLUMNS, 'table-trang-thai-khach-hang');
