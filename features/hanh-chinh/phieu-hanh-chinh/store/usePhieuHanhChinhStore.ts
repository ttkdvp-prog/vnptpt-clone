import { txt } from '@/lib/text';
import { TABLE_COLUMN_PRESETS } from '@/lib/table-column-presets';
import { createGenericStore, type ColumnConfig } from '@/store/createGenericStore';
import type { PhieuHanhChinhFilters } from '../core/types';

const P = TABLE_COLUMN_PRESETS;

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ten_loai_phieu', label: txt('adminForm.store.typeCol'), visible: true, ...P.titleShort, order: 0, priority: 1 },
  { id: 'ten_nhan_vien', label: txt('adminForm.store.employeeCol'), visible: true, ...P.titleShort, order: 1, priority: 1 },
  { id: 'tu_ngay', label: txt('adminForm.store.fromCol'), visible: true, ...P.date, order: 2, priority: 2 },
  { id: 'den_ngay', label: txt('adminForm.store.toCol'), visible: true, ...P.date, order: 3, priority: 2 },
  { id: 'trang_thai', label: txt('adminForm.store.statusCol'), visible: true, ...P.enumBadge, order: 4, priority: 2 },
  { id: 'ly_do', label: txt('adminForm.store.reasonCol'), visible: true, ...P.longText, order: 5, priority: 3 },
  { id: 'ten_nguoi_tao', label: txt('adminForm.store.creatorCol'), visible: true, ...P.titleShort, order: 6, priority: 3 },
  { id: 'tg_tao', label: txt('adminForm.store.createdCol'), visible: true, ...P.datetime, order: 7, priority: 3 },
  { id: 'ma_phieu', label: txt('adminForm.store.codeCol'), visible: false, ...P.code, order: 8, priority: 3 },
  { id: 'buoi_bat_dau', label: txt('adminForm.store.startShiftCol'), visible: false, ...P.enumBadge, order: 9, priority: 3 },
  { id: 'buoi_ket_thuc', label: txt('adminForm.store.endShiftCol'), visible: false, ...P.enumBadge, order: 10, priority: 3 },
  { id: 'tg_cap_nhat', label: txt('adminForm.store.updatedCol'), visible: false, ...P.datetime, order: 11, priority: 3 },
];

const initialFilters: PhieuHanhChinhFilters = {
  columnSearch: {},
  ma_phieu: [],
  trang_thai: [],
  id_nhan_vien: [],
  id_phong_ban: [],
  nguoi_tao: [],
  date_preset: 'all',
  date_custom_start: '',
  date_custom_end: '',
};

export const usePhieuHanhChinhStore = createGenericStore(initialFilters, DEFAULT_COLUMNS, 'table-phieu-hanh-chinh');
