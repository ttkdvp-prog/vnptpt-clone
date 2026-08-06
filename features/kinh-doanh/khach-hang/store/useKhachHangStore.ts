import { txt } from '@/lib/text';
import { TABLE_COLUMN_PRESETS } from '@/lib/table-column-presets';
import { createGenericStore, type ColumnConfig } from '@/store/createGenericStore';
import type { KhachHangFilters } from '../core/types';

const P = TABLE_COLUMN_PRESETS;

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ma_khach_hang', label: txt('customer.store.codeCol'), visible: true, ...P.code, order: 0, priority: 1 },
  { id: 'ten_khach_hang', label: txt('customer.store.nameCol'), visible: true, ...P.titleShort, order: 1, priority: 1 },
  { id: 'ten_nhom', label: txt('customer.store.groupCol'), visible: true, ...P.enumBadge, order: 2, priority: 2 },
  { id: 'ten_trang_thai', label: txt('customer.store.statusCol'), visible: true, ...P.enumBadge, order: 3, priority: 2 },
  {
    id: 'so_nguoi_lien_he',
    label: txt('customer.store.contactCol'),
    visible: true,
    ...P.count,
    order: 4,
    priority: 2,
  },
  { id: 'so_dien_thoai', label: txt('customer.store.phoneCol'), visible: true, ...P.phone, order: 5, priority: 2 },
  { id: 'dia_chi', label: txt('customer.store.addressCol'), visible: true, ...P.addressLine, order: 6, priority: 3 },
  { id: 'ten_nguoi_tao', label: txt('customer.store.creatorCol'), visible: false, ...P.titleShort, order: 7, priority: 3 },
  { id: 'tg_tao', label: txt('customer.store.createdCol'), visible: false, ...P.datetime, order: 8, priority: 3 },
  { id: 'tg_cap_nhat', label: txt('customer.store.updatedCol'), visible: false, ...P.datetime, order: 9, priority: 3 },
];

const initialFilters: KhachHangFilters = {
  columnSearch: {},
  id_nhom: [],
  id_trang_thai: [],
  nguoi_tao: [],
};

export const useKhachHangStore = createGenericStore(initialFilters, DEFAULT_COLUMNS, 'table-khach-hang');
