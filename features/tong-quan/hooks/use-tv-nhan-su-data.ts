'use client';

import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { queryKeys } from '@/lib/query-keys';
import { listQueryOptions } from '@/lib/query/query-config';
import { getTvNhanSuSnapshot } from '../services/tong-quan-service';

const REFETCH_MS = 60_000;

export function useTvNhanSuData() {
  const date = dayjs().format('YYYY-MM-DD');

  return useQuery({
    queryKey: queryKeys.wallboard.nhanSu({ date }),
    queryFn: () => getTvNhanSuSnapshot(date),
    ...listQueryOptions,
    staleTime: 0,
    refetchInterval: REFETCH_MS,
    refetchOnWindowFocus: true,
  });
}
