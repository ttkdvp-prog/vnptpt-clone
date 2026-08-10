import type { Employee } from '../core/types';
import { createColumnSearchMatcher } from '@/lib/factories/createColumnSearchMatcher';

/**
 * Cột đã có ô tìm trong dropdown MultiSelect (lọc danh sách tick) — không dùng thêm `columnSearch` cho cùng cột
 * (một ô giao diện thống nhất).
 */
export const COLUMN_IDS_WITH_MULTISELECT_SEARCH = [
  'trang_thai',
] as const;

/** Map id cột UI → field trên Employee. */
export function columnIdToEmployeeKey(colId: string): keyof Employee {
  return colId as keyof Employee;
}

const matcher = createColumnSearchMatcher<Employee, void>({
  skipColumnIds: COLUMN_IDS_WITH_MULTISELECT_SEARCH,
  getFieldValue: (emp, colId) => {
    const key = columnIdToEmployeeKey(colId);
    const raw = emp[key];
    return raw == null ? '' : String(raw);
  },
});

/** Số ô columnSearch đang có nội dung (bỏ cột đã có MultiSelect). */
export const countColumnSearchActive = matcher.countActive;

/**
 * Kiểm tra một nhân viên có khớp tất cả ô lọc theo cột (AND, không phân biệt hoa thường).
 * Bỏ qua các khóa thuộc cột đã có MultiSelect (state cũ không còn UI).
 */
export const employeeMatchesColumnSearch = (
  emp: Employee,
  columnSearch: Record<string, string> | undefined,
) => matcher.matches(emp, columnSearch, undefined);
