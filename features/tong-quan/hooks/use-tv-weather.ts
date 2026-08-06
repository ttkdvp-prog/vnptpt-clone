'use client';

import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { getTvWeather } from '../services/tv-weather-service';

const REFETCH_MS = 15 * 60 * 1000;

export function useTvWeather() {
  return useQuery({
    queryKey: queryKeys.wallboard.weather,
    queryFn: getTvWeather,
    staleTime: REFETCH_MS,
    gcTime: REFETCH_MS * 2,
    refetchInterval: REFETCH_MS,
    retry: 1,
  });
}
