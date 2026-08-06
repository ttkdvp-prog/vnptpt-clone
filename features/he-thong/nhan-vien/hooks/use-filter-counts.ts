import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Employee, EmployeeFilters } from '../core/types';
import { employeeFilterCountsQueryOptions } from '../queries/employees';

export type EmployeeFilterCounts = {
  deptCounts: Record<string, number>;
  posCounts: Record<string, number>;
  statusCounts: Record<string, number>;
  genderCounts: Record<string, number>;
};

/**
 * Facet counts (exclude-self) from server / mock service.
 * `employees` arg kept for call-site compatibility — unused (counts are not page-scoped).
 */
export function useFilterCounts(
  _employees: Employee[],
  searchTerm: string,
  filters: EmployeeFilters,
): EmployeeFilterCounts {
  const params = useMemo(
    () => ({
      search: searchTerm.trim() || undefined,
      trang_thai: filters.trang_thai.length ? filters.trang_thai : undefined,
      phong_ban_id: filters.phong_ban_id.length ? filters.phong_ban_id : undefined,
      chuc_vu_id: filters.position.length ? filters.position : undefined,
      gioi_tinh: filters.gender.length ? filters.gender : undefined,
      columnSearch: Object.keys(filters.columnSearch ?? {}).length
        ? Object.fromEntries(
            Object.entries(filters.columnSearch).filter(([, v]) => v?.trim()),
          )
        : undefined,
    }),
    [searchTerm, filters],
  );

  const { data } = useQuery(employeeFilterCountsQueryOptions(params));

  return (
    data ?? {
      deptCounts: {},
      posCounts: {},
      statusCounts: {},
      genderCounts: {},
    }
  );
}
