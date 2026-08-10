import { useMemo } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import type { SortState } from '@/store/createGenericStore';
import { congViecPageQueryOptions } from '../queries/cong-viec';
import type { CongViec, CongViecFilters } from '../core/types';

export type UseCongViecListParams = {
  page: number;
  pageSize: number;
  sort: SortState;
  searchTerm: string;
  filters: CongViecFilters;
};

export type UseCongViecListResult = {
  items: CongViec[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  isServerPaginated: boolean;
};

export function toListParams(page: number, pageSize: number, sort: SortState, searchTerm: string, filters: CongViecFilters) {
  const hasExplicitSort = sort.column && sort.column.length > 0;
  // Mặc định: mới tạo lên đầu. `id` không dùng được làm mặc định vì dữ liệu cũ trên
  // sheet có id dạng chuỗi không đồng nhất (task-N, TASK_xxx...), không phản ánh thời
  // gian tạo — dùng `id` mặc định khiến việc mới tạo "biến mất" xuống cuối/trang sau.
  const orderBy = hasExplicitSort ? sort.column! : 'tg_tao';
  const ascending = hasExplicitSort ? sort.direction !== 'desc' : false;
  return {
    limit: pageSize,
    offset: (page - 1) * pageSize,
    orderBy,
    ascending,
    search: searchTerm.trim() || undefined,
    cap: filters.cap.length ? filters.cap : undefined,
    uu_tien: filters.uu_tien.length ? filters.uu_tien : undefined,
    to_ar: filters.to_ar.length ? filters.to_ar : undefined,
    mnv_a: filters.mnv_a.length ? filters.mnv_a : undefined,
    mnv_r: filters.mnv_r.length ? filters.mnv_r : undefined,
    mnv_c: filters.mnv_c.length ? filters.mnv_c : undefined,
  };
}

export function useCongViecList({ page, pageSize, sort, searchTerm, filters }: UseCongViecListParams): UseCongViecListResult {
  const params = useMemo(
    () => toListParams(page, pageSize, sort, searchTerm, filters),
    [page, pageSize, sort, searchTerm, filters],
  );

  const listQuery = useQuery({
    ...congViecPageQueryOptions(params),
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
