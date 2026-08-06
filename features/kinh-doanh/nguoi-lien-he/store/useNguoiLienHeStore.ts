import { txt } from '@/lib/text';
import { TABLE_COLUMN_PRESETS } from '@/lib/table-column-presets';
import { createGenericStore, type ColumnConfig } from '@/store/createGenericStore';
import type { NguoiLienHeFilters } from '../core/types';

const P = TABLE_COLUMN_PRESETS;

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ho_ten', label: txt('contact.store.nameCol'), visible: true, ...P.personName, order: 0, priority: 1 },
  { id: 'ten_khach_hang', label: txt('contact.store.customerCol'), visible: true, ...P.titleShort, order: 1, priority: 1 },
  { id: 'chuc_vu', label: txt('contact.store.titleCol'), visible: true, ...P.titleShort, order: 2, priority: 2 },
  { id: 'so_dien_thoai', label: txt('contact.store.phoneCol'), visible: true, ...P.phone, order: 3, priority: 2 },
  { id: 'email', label: txt('contact.store.emailCol'), visible: true, ...P.email, order: 4, priority: 2 },
  { id: 'ngay_sinh', label: txt('contact.store.birthCol'), visible: false, ...P.datetime, order: 5, priority: 3 },
  { id: 'dia_chi', label: txt('contact.store.addressCol'), visible: false, ...P.addressLine, order: 6, priority: 3 },
  { id: 'ten_nguoi_tao', label: txt('contact.store.creatorCol'), visible: false, ...P.titleShort, order: 7, priority: 3 },
  { id: 'tg_tao', label: txt('contact.store.createdCol'), visible: false, ...P.datetime, order: 8, priority: 3 },
  { id: 'tg_cap_nhat', label: txt('contact.store.updatedCol'), visible: false, ...P.datetime, order: 9, priority: 3 },
];

const initialFilters: NguoiLienHeFilters = {
  columnSearch: {},
  id_khach_hang: [],
  nguoi_tao: [],
};

export const useNguoiLienHeStore = createGenericStore(initialFilters, DEFAULT_COLUMNS, 'table-nguoi-lien-he');
