import { queryOptions } from '@tanstack/react-query';
import { queryKeys, EMPLOYEES_LIST_QUERY_PARAMS } from '@/lib/query-keys';
import { listQueryOptions } from '@/lib/query/query-config';
import {
  getEmployeeById,
  getEmployeeCount,
  getEmployeeFilterCounts,
  getEmployeeStatsAggregates,
  getEmployeesPage,
  type GetEmployeesParams,
} from '@/features/he-thong/nhan-vien/services/nhan-vien-service';

export type EmployeeListQueryParams = GetEmployeesParams;

function listFilterKey(
  params: GetEmployeesParams,
): Omit<GetEmployeesParams, 'limit' | 'offset' | 'orderBy' | 'ascending'> {
  return {
    search: params.search,
    trang_thai: params.trang_thai,
    columnSearch: params.columnSearch,
    asAt: params.asAt,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
  };
}

export function employeeCountQueryOptions(params: GetEmployeesParams = {}) {
  const filterKey = listFilterKey(params);
  return queryOptions({
    queryKey: queryKeys.employees.count(filterKey),
    queryFn: () => getEmployeeCount(params),
    ...listQueryOptions,
  });
}

export function employeeDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.employees.detail(id),
    queryFn: () => getEmployeeById(id),
    enabled: Boolean(id),
    ...listQueryOptions,
  });
}

export function employeesPageQueryOptions(params: GetEmployeesParams) {
  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  const orderBy = params.orderBy ?? EMPLOYEES_LIST_QUERY_PARAMS.orderBy;
  const ascending = params.ascending ?? EMPLOYEES_LIST_QUERY_PARAMS.ascending;
  const pageKey = {
    limit,
    offset,
    orderBy,
    ascending,
    ...listFilterKey(params),
  };
  return queryOptions({
    queryKey: queryKeys.employees.page(pageKey),
    queryFn: () =>
      getEmployeesPage({
        ...params,
        limit,
        offset,
        orderBy,
        ascending,
      }),
    ...listQueryOptions,
  });
}

export function employeeFilterCountsQueryOptions(params: GetEmployeesParams = {}) {
  const filterKey = listFilterKey(params);
  return queryOptions({
    queryKey: queryKeys.employees.filterCounts(filterKey),
    queryFn: () => getEmployeeFilterCounts(params),
    ...listQueryOptions,
  });
}

export function employeeStatsAggregatesQueryOptions(params: GetEmployeesParams = {}) {
  return queryOptions({
    queryKey: queryKeys.employees.statsAggregates(listFilterKey(params)),
    queryFn: () => getEmployeeStatsAggregates(params),
    ...listQueryOptions,
  });
}
