
import { createGenericStore, ColumnConfig } from '@/store/createGenericStore';
import { TABLE_COLUMN_PRESETS } from '@/lib/table-column-presets';
import { EmployeeFilters } from '../core/types';
import { txt } from '@/lib/text';

const P = TABLE_COLUMN_PRESETS;

const DEFAULT_COLUMNS: ColumnConfig[] = [
  { id: 'ho_ten', label: txt('employee.store.nameCol'), visible: true, ...P.personName, order: 0, priority: 1 },
  { id: 'chuc_danh', label: txt('employee.store.positionCol'), visible: true, ...P.titleShort, order: 1, priority: 2 },
  { id: 'to_phong', label: txt('employee.store.departmentCol'), visible: true, ...P.branch, order: 2, priority: 3 },
  { id: 'trang_thai', label: txt('employee.store.statusCol'), visible: true, ...P.enumBadge, order: 3, priority: 2 },
];

const initialFilters: EmployeeFilters = {
  columnSearch: {},
  trang_thai: [],
};

export const useEmployeeStore = createGenericStore<EmployeeFilters>(
  initialFilters,
  DEFAULT_COLUMNS,
  'table-nhan-vien'
);
