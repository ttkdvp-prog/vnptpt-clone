import { txt } from '@/lib/text';
import { TABLE_COLUMN_PRESETS } from '@/lib/table-column-presets';
import { createGenericStore, type ColumnConfig } from '@/store/createGenericStore';
import type { HopDongFilters } from '../core/types';

const P = TABLE_COLUMN_PRESETS;

const DEFAULT_COLUMNS: ColumnConfig[] = [
  {
    id: 'ma_hop_dong',
    label: txt('contract.store.codeCol'),
    visible: true,
    ...P.titleShort,
    order: 0,
    priority: 1,
  },
  {
    id: 'loai_hop_dong',
    label: txt('contract.store.typeCol'),
    visible: true,
    ...P.enumBadge,
    order: 1,
    priority: 2,
  },
  {
    id: 'ten_nhan_vien',
    label: txt('contract.store.employeeCol'),
    visible: true,
    ...P.personName,
    order: 2,
    priority: 1,
  },
  {
    id: 'ten_phong_ban',
    label: txt('contract.store.departmentCol'),
    visible: true,
    ...P.titleShort,
    order: 3,
    priority: 2,
  },
  {
    id: 'ngay_ky',
    label: txt('contract.store.signDateCol'),
    visible: true,
    ...P.date,
    order: 4,
    priority: 2,
  },
  {
    id: 'ngay_hieu_luc',
    label: txt('contract.store.effectiveDateCol'),
    visible: false,
    ...P.date,
    order: 5,
    priority: 3,
  },
  {
    id: 'ngay_ket_thuc',
    label: txt('contract.store.endDateCol'),
    visible: true,
    ...P.date,
    order: 6,
    priority: 2,
  },
  {
    id: 'muc_luong',
    label: txt('contract.store.salaryCol'),
    visible: true,
    ...P.titleShort,
    order: 7,
    priority: 3,
  },
  {
    id: 'trang_thai',
    label: txt('contract.store.statusCol'),
    visible: true,
    ...P.enumBadge,
    order: 8,
    priority: 2,
  },
  {
    id: 'ten_nguoi_tao',
    label: txt('contract.store.creatorCol'),
    visible: false,
    ...P.titleShort,
    order: 9,
    priority: 3,
  },
  {
    id: 'tg_cap_nhat',
    label: txt('contract.store.updatedCol'),
    visible: false,
    ...P.datetime,
    order: 10,
    priority: 3,
  },
];

const initialFilters: HopDongFilters = {
  columnSearch: {},
  loai_hop_dong: [],
  trang_thai: [],
  id_phong_ban: [],
};

export const useHopDongStore = createGenericStore(initialFilters, DEFAULT_COLUMNS, 'table-hop-dong');
