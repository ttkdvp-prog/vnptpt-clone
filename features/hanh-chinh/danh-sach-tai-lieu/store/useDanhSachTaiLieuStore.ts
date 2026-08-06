import { txt } from '@/lib/text';
import { TABLE_COLUMN_PRESETS } from '@/lib/table-column-presets';
import { createGenericStore, type ColumnConfig } from '@/store/createGenericStore';
import type { DanhSachTaiLieuFilters } from '../core/types';

const P = TABLE_COLUMN_PRESETS;

const DEFAULT_COLUMNS: ColumnConfig[] = [
  {
    id: 'ten_tai_lieu',
    label: txt('document.store.nameCol'),
    visible: true,
    ...P.personName,
    order: 0,
    priority: 1,
  },
  {
    id: 'ten_loai_tai_lieu',
    label: txt('document.store.typeCol'),
    visible: true,
    ...P.titleShort,
    order: 1,
    priority: 2,
  },
  {
    id: 'trang_thai',
    label: txt('document.store.statusCol'),
    visible: true,
    ...P.enumBadge,
    order: 2,
    priority: 2,
  },
  {
    id: 'link_tai_lieu',
    label: txt('document.store.linkCol'),
    visible: true,
    ...P.link,
    order: 3,
    priority: 2,
  },
  {
    id: 'mo_ta',
    label: txt('document.store.descCol'),
    visible: false,
    ...P.longText,
    order: 4,
    priority: 3,
  },
  {
    id: 'ten_nguoi_tao',
    label: txt('document.store.creatorCol'),
    visible: true,
    ...P.titleShort,
    order: 5,
    priority: 3,
  },
  {
    id: 'tg_cap_nhat',
    label: txt('document.store.updatedCol'),
    visible: true,
    ...P.datetime,
    order: 6,
    priority: 3,
  },
];

const initialFilters: DanhSachTaiLieuFilters = {
  columnSearch: {},
  id_loai_tai_lieu: [],
  trang_thai: [],
  nguoi_tao: [],
};

export const useDanhSachTaiLieuStore = createGenericStore(initialFilters, DEFAULT_COLUMNS, 'table-danh-sach-tai-lieu');
