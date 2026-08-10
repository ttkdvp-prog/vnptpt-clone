import { createGenericStore, ColumnConfig } from '@/store/createGenericStore';
import { TABLE_COLUMN_PRESETS } from '@/lib/table-column-presets';
import { CongViecFilters } from '../core/types';
import { txt } from '@/lib/text';

const P = TABLE_COLUMN_PRESETS;

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'tieu_de', label: txt('congViec.store.tieuDeCol'), visible: true, ...P.personName, order: 0, priority: 1 },
  { id: 'mo_ta', label: txt('congViec.store.moTaCol'), visible: true, ...P.personName, order: 1, priority: 3 },
  { id: 'cap', label: txt('congViec.store.capCol'), visible: true, ...P.enumBadgeShort, order: 2, priority: 2 },
  { id: 'to_ar', label: txt('congViec.store.toArCol'), visible: true, ...P.enumBadgeShort, order: 3, priority: 2 },
  { id: 'mnv_a', label: txt('congViec.store.mnvACol'), visible: true, ...P.enumBadgeMedium, order: 4, priority: 2 },
  { id: 'mnv_r', label: txt('congViec.store.mnvRCol'), visible: true, ...P.enumBadgeMedium, order: 5, priority: 2 },
  { id: 'mnv_c', label: txt('congViec.store.mnvCCol'), visible: true, ...P.enumBadgeMedium, order: 6, priority: 3 },
  { id: 'ke_hoach', label: txt('congViec.store.keHoachCol'), visible: true, ...P.enumBadgeShort, order: 7, priority: 2 },
  { id: 'thuc_hien', label: txt('congViec.store.thucHienCol'), visible: true, ...P.enumBadgeShort, order: 8, priority: 2 },
  { id: 'ty_le', label: txt('congViec.store.tyLeCol'), visible: true, ...P.enumBadgeShort, order: 9, priority: 2 },
  { id: 'uu_tien', label: txt('congViec.store.uuTienCol'), visible: false, ...P.enumBadge, order: 10, priority: 1 },
  { id: 'ngay_kt', label: txt('congViec.store.ngayKtCol'), visible: true, ...P.enumBadgeShort, order: 11, priority: 2 },
  { id: 'trang_thai', label: txt('congViec.store.trangThaiCol'), visible: true, ...P.enumBadge, order: 12, priority: 1 },
  { id: 'ngay_ht', label: txt('congViec.store.ngayHtCol'), visible: true, ...P.enumBadgeShort, order: 13, priority: 3 },
  { id: 'ghi_chu', label: txt('congViec.store.ghiChuCol'), visible: true, ...P.personName, order: 14, priority: 3 },
];

const initialFilters: CongViecFilters = {
  columnSearch: {},
  cap: [],
  uu_tien: [],
  to_ar: [],
  mnv_a: [],
  mnv_r: [],
  mnv_c: [],
};

export const useCongViecStore = createGenericStore<CongViecFilters>(
  initialFilters,
  DEFAULT_COLUMNS,
  'table-cong-viec',
);
