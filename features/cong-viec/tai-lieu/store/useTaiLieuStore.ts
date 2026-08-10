import { createGenericStore, ColumnConfig } from '@/store/createGenericStore';
import { TABLE_COLUMN_PRESETS } from '@/lib/table-column-presets';
import { TaiLieuFilters } from '../core/types';
import { txt } from '@/lib/text';

const P = TABLE_COLUMN_PRESETS;

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ten_ho_so', label: txt('congViecTaiLieu.store.tenHoSoCol'), visible: true, ...P.personName, order: 0, priority: 1 },
  { id: 'danh_muc', label: txt('congViecTaiLieu.store.danhMucCol'), visible: true, ...P.enumBadgeMedium, order: 1, priority: 2 },
  { id: 'to', label: txt('congViecTaiLieu.store.toCol'), visible: true, ...P.enumBadgeShort, order: 2, priority: 2 },
  { id: 'tinh_trang', label: txt('congViecTaiLieu.store.tinhTrangCol'), visible: true, ...P.enumBadge, order: 3, priority: 1 },
];

const initialFilters: TaiLieuFilters = {
  columnSearch: {},
  tinh_trang: [],
  danh_muc: [],
  to: [],
};

export const useTaiLieuStore = createGenericStore<TaiLieuFilters>(
  initialFilters,
  DEFAULT_COLUMNS,
  'table-tai-lieu',
);
