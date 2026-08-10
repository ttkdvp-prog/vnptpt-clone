import { queryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { listQueryOptions } from '@/lib/query/query-config';
import {
  getDistinctPhongBan,
  getDistinctTieuDe,
  getCongViecById,
  getCongViecCount,
  getCongViecFilterCounts,
  getCongViecStatsAggregates,
  getCongViecPage,
  type GetCongViecParams,
} from '../services/cong-viec-service';

function listFilterKey(params: GetCongViecParams): Omit<GetCongViecParams, 'limit' | 'offset' | 'orderBy' | 'ascending'> {
  return {
    search: params.search,
    cap: params.cap,
    uu_tien: params.uu_tien,
    to_ar: params.to_ar,
  };
}

export function congViecCountQueryOptions(params: GetCongViecParams = {}) {
  return queryOptions({
    queryKey: queryKeys.congViec.count(listFilterKey(params)),
    queryFn: () => getCongViecCount(params),
    ...listQueryOptions,
  });
}

export function congViecDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.congViec.detail(id),
    queryFn: () => getCongViecById(id),
    enabled: Boolean(id),
    ...listQueryOptions,
  });
}

export function congViecPageQueryOptions(params: GetCongViecParams) {
  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  const orderBy = params.orderBy ?? 'id';
  const ascending = params.ascending ?? true;
  const pageKey = { limit, offset, orderBy, ascending, ...listFilterKey(params) };
  return queryOptions({
    queryKey: queryKeys.congViec.page(pageKey),
    queryFn: () => getCongViecPage({ ...params, limit, offset, orderBy, ascending }),
    ...listQueryOptions,
  });
}

export function congViecFilterCountsQueryOptions(params: GetCongViecParams = {}) {
  return queryOptions({
    queryKey: queryKeys.congViec.filterCounts(listFilterKey(params)),
    queryFn: () => getCongViecFilterCounts(params),
    ...listQueryOptions,
  });
}

export function congViecStatsAggregatesQueryOptions(params: GetCongViecParams = {}) {
  return queryOptions({
    queryKey: queryKeys.congViec.statsAggregates(listFilterKey(params)),
    queryFn: () => getCongViecStatsAggregates(params),
    ...listQueryOptions,
  });
}

export function congViecDistinctTieuDeQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.congViec.distinctTieuDe,
    queryFn: () => getDistinctTieuDe(),
    ...listQueryOptions,
  });
}

export function congViecDistinctToQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.congViec.distinctTo,
    queryFn: () => getDistinctPhongBan(),
    ...listQueryOptions,
  });
}
