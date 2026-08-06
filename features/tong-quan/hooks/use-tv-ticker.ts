'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { listQueryOptions } from '@/lib/query/query-config';
import { getTvTickerAnnouncements } from '../services/tong-quan-service';

const REFETCH_MS = 60_000;

export function useTvTicker() {
  return useQuery({
    queryKey: queryKeys.wallboard.ticker,
    queryFn: getTvTickerAnnouncements,
    ...listQueryOptions,
    staleTime: 0,
    refetchInterval: REFETCH_MS,
  });
}
