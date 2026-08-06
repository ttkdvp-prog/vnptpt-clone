import { txt } from '@/lib/text';
import { TABLE_COLUMN_PRESETS } from '@/lib/table-column-presets';
import { createGenericStore, type ColumnConfig } from '@/store/createGenericStore';
import type { LoaiTaiLieuFilters } from '../core/types';

const P = TABLE_COLUMN_PRESETS;

const DEFAULT_COLUMNS: ColumnConfig[] = [
  {
    id: 'thu_tu',
    label: txt('documentSettings.loai.store.orderCol'),
    visible: true,
    ...P.code,
    order: 0,
    priority: 3,
  },
  {
    id: 'ten_loai_tai_lieu',
    label: txt('documentSettings.loai.store.nameCol'),
    visible: true,
    ...P.titleShort,
    order: 1,
    priority: 1,
  },
  {
    id: 'mo_ta',
    label: txt('documentSettings.loai.store.descCol'),
    visible: true,
    ...P.longText,
    order: 2,
    priority: 2,
  },
  {
    id: 'ten_nguoi_tao',
    label: txt('documentSettings.loai.store.creatorCol'),
    visible: true,
    ...P.titleShort,
    order: 3,
    priority: 3,
  },
  {
    id: 'tg_tao',
    label: txt('documentSettings.loai.store.createdCol'),
    visible: true,
    ...P.datetime,
    order: 4,
    priority: 3,
  },
  {
    id: 'tg_cap_nhat',
    label: txt('documentSettings.loai.store.updatedCol'),
    visible: true,
    ...P.datetime,
    order: 5,
    priority: 3,
  },
];

const initialFilters: LoaiTaiLieuFilters = {
  columnSearch: {},
  nguoi_tao: [],
};

export const useLoaiTaiLieuStore = createGenericStore(initialFilters, DEFAULT_COLUMNS, 'table-loai-tai-lieu');
