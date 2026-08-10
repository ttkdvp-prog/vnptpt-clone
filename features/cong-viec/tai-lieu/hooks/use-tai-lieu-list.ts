import { useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { SortState } from '@/store/createGenericStore';
import { taiLieuPageQueryOptions } from '../queries/tai-lieu';
import type { TaiLieu, TaiLieuFilters } from '../core/types';

export type UseTaiLieuListParams = {
  page: number;
  pageSize: number;
  sort: SortState;
  searchTerm: string;
  filters: TaiLieuFilters;
};

export type UseTaiLieuListResult = {
  items: TaiLieu[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  isServerPaginated: boolean;
};

export function toListParams(page: number, pageSize: number, sort: SortState, searchTerm: string, filters: TaiLieuFilters) {
  const orderBy = sort.column && sort.column.length > 0 ? sort.column : 'id';
  const ascending = sort.direction !== 'desc';
  return {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy,
    ascending,
    search: searchTerm.trim() || undefined,
    tinh_trang: filters.tinh_trang.length ? filters.tinh_trang : undefined,
    danh_muc: filters.danh_muc.length ? filters.danh_muc : undefined,
    to: filters.to.length ? filters.to : undefined,
  };
}

export function useTaiLieuList({ page, pageSize, sort, searchTerm, filters }: UseTaiLieuListParams): UseTaiLieuListResult {
  const params = useMemo(
    () => toListParams(page, pageSize, sort, searchTerm, filters),
    [page, pageSize, sort, searchTerm, filters],
  );

  const listQuery = useQuery({
    ...taiLieuPageQueryOptions(params),
    placeholderData: keepPreviousData,
  });

  const pageResult = listQuery.data;

  return {
    items: pageResult?.items ?? [],
    total: pageResult?.total ?? 0,
    isServerPaginated: true,
    isLoading: listQuery.isLoading,
    isFetching: listQuery.isFetching,
  };
}
