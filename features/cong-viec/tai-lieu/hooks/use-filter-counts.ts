import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { TaiLieuFilters } from '../core/types';
import { taiLieuFilterCountsQueryOptions } from '../queries/tai-lieu';

export function useTaiLieuFilterCounts(searchTerm: string, filters: TaiLieuFilters) {
  const params = useMemo(
    () => ({
      search: searchTerm.trim() || undefined,
      tinh_trang: filters.tinh_trang.length ? filters.tinh_trang : undefined,
      danh_muc: filters.danh_muc.length ? filters.danh_muc : undefined,
      to: filters.to.length ? filters.to : undefined,
    }),
    [searchTerm, filters],
  );

  const { data } = useQuery(taiLieuFilterCountsQueryOptions(params));

  return data ?? { tinhTrangCounts: {}, danhMucCounts: {} };
}
