import { createGenericStore, ColumnConfig } from '@/store/createGenericStore';
import { TABLE_COLUMN_PRESETS } from '@/lib/table-column-presets';
import { NhiemVuFilters } from '../core/types';
import { txt } from '@/lib/text';

const P = TABLE_COLUMN_PRESETS;

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'tieu_de', label: txt('nhiemVu.store.tieuDeCol'), visible: true, ...P.personName, order: 0, priority: 1 },
  { id: 'mo_ta', label: txt('nhiemVu.store.moTaCol'), visible: true, ...P.personName, order: 1, priority: 3 },
  { id: 'nguoi_phu_trach', label: txt('nhiemVu.store.nguoiPhuTrachCol'), visible: true, ...P.enumBadgeMedium, order: 2, priority: 1 },
  { id: 'uu_tien', label: txt('nhiemVu.store.uuTienCol'), visible: true, ...P.enumBadgeShort, order: 3, priority: 2 },
  { id: 'han_chot', label: txt('nhiemVu.store.hanChotCol'), visible: true, ...P.enumBadgeShort, order: 4, priority: 1 },
  { id: 'trang_thai', label: txt('nhiemVu.store.trangThaiCol'), visible: true, ...P.enumBadge, order: 5, priority: 1 },
  { id: 'ghi_chu', label: txt('nhiemVu.store.ghiChuCol'), visible: true, ...P.personName, order: 6, priority: 3 },
];

const initialFilters: NhiemVuFilters = {
  columnSearch: {},
  trang_thai: [],
  uu_tien: [],
  nguoi_phu_trach: [],
};

export const useNhiemVuStore = createGenericStore<NhiemVuFilters>(
  initialFilters,
  DEFAULT_COLUMNS,
  'table-nhiem-vu',
);
