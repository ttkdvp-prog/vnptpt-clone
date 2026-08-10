import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { CongViecFilters } from '../core/types';
import { congViecFilterCountsQueryOptions } from '../queries/cong-viec';

export function useCongViecFilterCounts(searchTerm: string, filters: CongViecFilters) {
  const params = useMemo(
    () => ({
      search: searchTerm.trim() || undefined,
      cap: filters.cap.length ? filters.cap : undefined,
      uu_tien: filters.uu_tien.length ? filters.uu_tien : undefined,
      to_ar: filters.to_ar.length ? filters.to_ar : undefined,
    }),
    [searchTerm, filters],
  );

  const { data } = useQuery(congViecFilterCountsQueryOptions(params));

  return data ?? { capCounts: {}, uuTienCounts: {}, toArCounts: {} };
}
