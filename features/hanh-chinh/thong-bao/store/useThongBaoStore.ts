import { txt } from '@/lib/text';
import { TABLE_COLUMN_PRESETS } from '@/lib/table-column-presets';
import { createGenericStore, type ColumnConfig } from '@/store/createGenericStore';
import type { ThongBaoFilters } from '../core/types';

const P = TABLE_COLUMN_PRESETS;

const DEFAULT_COLUMNS: ColumnConfig[] = [
  {
    id: 'tg_dang',
    label: txt('announcement.store.datetimeCol'),
    visible: true,
    ...P.datetime,
    order: 0,
    priority: 2,
  },
  {
    id: 'tieu_de',
    label: txt('announcement.store.titleCol'),
    visible: true,
    ...P.titleShort,
    order: 1,
    priority: 1,
  },
  {
    id: 'ten_chuc_vu',
    label: txt('announcement.store.positionsCol'),
    visible: true,
    ...P.titleShort,
    order: 2,
    priority: 2,
  },
  {
    id: 'ten_nguoi_tao',
    label: txt('announcement.store.creatorCol'),
    visible: true,
    ...P.titleShort,
    order: 3,
    priority: 3,
  },
  {
    id: 'tg_cap_nhat',
    label: txt('announcement.store.updatedCol'),
    visible: false,
    ...P.datetime,
    order: 4,
    priority: 3,
  },
];

const initialFilters: ThongBaoFilters = {
  columnSearch: {},
  id_chuc_vu: [],
  nguoi_tao: [],
  pham_vi: [],
  date_preset: 'all',
  date_custom_start: '',
  date_custom_end: '',
};

export const useThongBaoStore = createGenericStore(initialFilters, DEFAULT_COLUMNS, 'table-thong-bao');
