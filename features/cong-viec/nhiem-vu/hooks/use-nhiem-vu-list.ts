import { useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { SortState } from '@/store/createGenericStore';
import { nhiemVuPageQueryOptions } from '../queries/nhiem-vu';
import type { NhiemVu, NhiemVuFilters } from '../core/types';

export type UseNhiemVuListParams = {
  page: number;
  pageSize: number;
  sort: SortState;
  searchTerm: string;
  filters: NhiemVuFilters;
};

export type UseNhiemVuListResult = {
  items: NhiemVu[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  isServerPaginated: boolean;
};

export function toListParams(page: number, pageSize: number, sort: SortState, searchTerm: string, filters: NhiemVuFilters) {
  const hasExplicitSort = sort.column && sort.column.length > 0;
  const orderBy = hasExplicitSort ? sort.column! : 'tg_tao';
  const ascending = hasExplicitSort ? sort.direction !== 'desc' : false;
  return {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy,
    ascending,
    search: searchTerm.trim() || undefined,
    trang_thai: filters.trang_thai.length ? filters.trang_thai : undefined,
    uu_tien: filters.uu_tien.length ? filters.uu_tien : undefined,
    nguoi_phu_trach: filters.nguoi_phu_trach.length ? filters.nguoi_phu_trach : undefined,
  };
}

export function useNhiemVuList({ page, pageSize, sort, searchTerm, filters }: UseNhiemVuListParams): UseNhiemVuListResult {
  const params = useMemo(
    () => toListParams(page, pageSize, sort, searchTerm, filters),
    [page, pageSize, sort, searchTerm, filters],
  );

  const listQuery = useQuery({
    ...nhiemVuPageQueryOptions(params),
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
