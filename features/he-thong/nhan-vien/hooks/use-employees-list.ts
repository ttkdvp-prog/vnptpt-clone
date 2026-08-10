import { useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { SortState } from '@/store/createGenericStore';
import { EMPLOYEES_LIST_QUERY_PARAMS } from '@/lib/query-keys';
import { employeesPageQueryOptions } from '../queries/employees';
import type { Employee, EmployeeFilters } from '../core/types';

export type EmployeesListMode = 'server';

export type UseEmployeesListParams = {
  page: number;
  pageSize: number;
  sort: SortState;
  searchTerm: string;
  filters: EmployeeFilters;
};

export type UseEmployeesListResult = {
  employees: Employee[];
  total: number;
  mode: EmployeesListMode;
  isLoading: boolean;
  isFetching: boolean;
  isServerPaginated: boolean;
};

function sortToQuery(sort: SortState) {
  const orderBy =
    sort.column && sort.column.length > 0 ? sort.column : EMPLOYEES_LIST_QUERY_PARAMS.orderBy;
  const ascending = sort.direction !== 'desc';
  return { orderBy, ascending };
}

export function toListParams(
  page: number,
  pageSize: number,
  sort: SortState,
  searchTerm: string,
  filters: EmployeeFilters,
) {
  const { orderBy, ascending } = sortToQuery(sort);
  const columnSearch = Object.fromEntries(
    Object.entries(filters.columnSearch ?? {}).filter(([, v]) => v?.trim()),
  );
  return {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy,
    ascending,
    search: searchTerm.trim() || undefined,
    trang_thai: filters.trang_thai.length ? filters.trang_thai : undefined,
    columnSearch: Object.keys(columnSearch).length ? columnSearch : undefined,
  };
}

export function useEmployeesList({
  page,
  pageSize,
  sort,
  searchTerm,
  filters,
}: UseEmployeesListParams): UseEmployeesListResult {
  const params = useMemo(
    () => toListParams(page, pageSize, sort, searchTerm, filters),
    [page, pageSize, sort, searchTerm, filters],
  );

  const listQuery = useQuery({
    ...employeesPageQueryOptions(params),
    placeholderData: keepPreviousData,
  });

  const pageResult = listQuery.data;
  const employees = pageResult?.items ?? [];
  const total = pageResult?.total ?? 0;

  return {
    employees,
    total,
    mode: 'server',
    isServerPaginated: true,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
  };
}
