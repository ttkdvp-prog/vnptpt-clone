import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Employee, EmployeeFilters } from '../core/types';
import { employeeFilterCountsQueryOptions } from '../queries/employees';

export type EmployeeFilterCounts = {
  statusCounts: Record<string, number>;
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
      columnSearch: Object.keys(filters.columnSearch ?? {}).length
        ? Object.fromEntries(
            Object.entries(filters.columnSearch).filter(([, v]) => v?.trim()),
          )
        : undefined,
    }),
    [searchTerm, filters],
  );

  const { data } = useQuery(employeeFilterCountsQueryOptions(params));

  return data ?? { statusCounts: {} };
}
