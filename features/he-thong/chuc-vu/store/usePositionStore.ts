import { createGenericStore, ColumnConfig } from '@/store/createGenericStore';
import { TABLE_COLUMN_PRESETS } from '@/lib/table-column-presets';
import type { PositionFilters } from '../core/types';
import { txt } from '@/lib/text';

const P = TABLE_COLUMN_PRESETS;

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'thu_tu', label: txt('position.store.orderCol'), visible: true, ...P.orderIndex, order: 0, priority: 3 },
  { id: 'ma_chuc_vu', label: txt('position.store.codeCol'), visible: true, ...P.code, order: 1, priority: 1 },
  { id: 'ten_chuc_vu', label: txt('position.store.nameCol'), visible: true, ...P.treeName, order: 2, priority: 1 },
  { id: 'cap_bac', label: txt('position.store.levelCol'), visible: true, ...P.orderIndex, order: 3, priority: 2 },
  { id: 'mo_ta', label: txt('position.store.descCol'), visible: true, ...P.longText, order: 4, priority: 3 },
  { id: 'trang_thai', label: txt('position.store.statusCol'), visible: true, ...P.enumBadge, order: 5, priority: 2 },
  { id: 'tg_cap_nhat', label: txt('position.store.updatedCol'), visible: true, ...P.datetime, order: 6, priority: 3 },
];

const initialFilters: PositionFilters = {
  status: [],
  id_phong_goc: [],
  phong_ban_id: [],
  cap_bac: [],
  columnSearch: {},
};

export const usePositionStore = createGenericStore<PositionFilters>(
  initialFilters,
  DEFAULT_COLUMNS,
  'table-chuc-vu'
);
