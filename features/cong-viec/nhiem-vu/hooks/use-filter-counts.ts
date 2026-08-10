import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { NhiemVuFilters } from '../core/types';
import { nhiemVuFilterCountsQueryOptions } from '../queries/nhiem-vu';

export function useNhiemVuFilterCounts(searchTerm: string, filters: NhiemVuFilters) {
  const params = useMemo(
    () => ({
      search: searchTerm.trim() || undefined,
      trang_thai: filters.trang_thai.length ? filters.trang_thai : undefined,
      uu_tien: filters.uu_tien.length ? filters.uu_tien : undefined,
      nguoi_phu_trach: filters.nguoi_phu_trach.length ? filters.nguoi_phu_trach : undefined,
    }),
    [searchTerm, filters],
  );

  const { data } = useQuery(nhiemVuFilterCountsQueryOptions(params));

  return data ?? { trangThaiCounts: {}, uuTienCounts: {} };
}
