import { createGenericStore, ColumnConfig } from '@/store/createGenericStore';
import { TABLE_COLUMN_PRESETS } from '@/lib/table-column-presets';
import { txt } from '@/lib/text';

const P = TABLE_COLUMN_PRESETS;

export interface DepartmentFilters {
  /** Lọc text theo từng cột (header), AND — không dùng cho cột đã có MultiSelect */
  columnSearch: Record<string, string>;
  /** Trạng thái: ['Active','Inactive'] hoặc [] = tất cả — từ header cột */
  status: string[];
  /** Lọc theo phòng gốc (id phòng cấp 1); [] = tất cả — từ header cột tên phòng */
  id_phong_goc: string[];
}

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'thu_tu', label: txt('department.store.orderCol'), visible: true, ...P.orderIndex, order: 0, priority: 3 },
  { id: 'ten_phong_ban', label: txt('department.store.nameCol'), visible: true, ...P.treeName, order: 1, priority: 1 },
  { id: 'ma_phong_ban', label: txt('department.store.codeCol'), visible: true, ...P.code, order: 2, priority: 1 },
  { id: 'ten_phong_cha', label: txt('department.store.parentCol'), visible: true, ...P.branch, order: 3, priority: 2 },
  { id: 'mo_ta', label: txt('department.store.descCol'), visible: true, ...P.longText, order: 4, priority: 3 },
  { id: 'cap_do', label: txt('department.store.levelCol'), visible: true, ...P.enumBadgeMedium, order: 5, priority: 2 },
  { id: 'trang_thai', label: txt('department.store.statusCol'), visible: true, ...P.enumBadge, order: 6, priority: 2 },
  { id: 'tg_cap_nhat', label: txt('department.store.updatedCol'), visible: true, ...P.date, order: 7, priority: 3 },
];

const initialFilters: DepartmentFilters = {
  columnSearch: {},
  status: [],
  id_phong_goc: [],
};

export const useDepartmentStore = createGenericStore<DepartmentFilters>(
  initialFilters,
  DEFAULT_COLUMNS,
  'table-phong-ban'
);
