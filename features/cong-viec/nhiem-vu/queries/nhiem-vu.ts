import { queryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { listQueryOptions } from '@/lib/query/query-config';
import {
  getDistinctTieuDe,
  getNhiemVuById,
  getNhiemVuCount,
  getNhiemVuFilterCounts,
  getNhiemVuStatsAggregates,
  getNhiemVuPage,
  type GetNhiemVuParams,
} from '../services/nhiem-vu-service';

function listFilterKey(params: GetNhiemVuParams): Omit<GetNhiemVuParams, 'limit' | 'offset' | 'orderBy' | 'ascending'> {
  return {
    search: params.search,
    trang_thai: params.trang_thai,
    uu_tien: params.uu_tien,
    nguoi_phu_trach: params.nguoi_phu_trach,
  };
}

export function nhiemVuCountQueryOptions(params: GetNhiemVuParams = {}) {
  return queryOptions({
    queryKey: queryKeys.nhiemVu.count(listFilterKey(params)),
    queryFn: () => getNhiemVuCount(params),
    ...listQueryOptions,
  });
}

export function nhiemVuDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.nhiemVu.detail(id),
    queryFn: () => getNhiemVuById(id),
    enabled: Boolean(id),
    ...listQueryOptions,
  });
}

export function nhiemVuPageQueryOptions(params: GetNhiemVuParams) {
  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  const orderBy = params.orderBy ?? 'id';
  const ascending = params.ascending ?? true;
  const pageKey = { limit, offset, orderBy, ascending, ...listFilterKey(params) };
  return queryOptions({
    queryKey: queryKeys.nhiemVu.page(pageKey),
    queryFn: () => getNhiemVuPage({ ...params, limit, offset, orderBy, ascending }),
    ...listQueryOptions,
  });
}

export function nhiemVuFilterCountsQueryOptions(params: GetNhiemVuParams = {}) {
  return queryOptions({
    queryKey: queryKeys.nhiemVu.filterCounts(listFilterKey(params)),
    queryFn: () => getNhiemVuFilterCounts(params),
    ...listQueryOptions,
  });
}

export function nhiemVuStatsAggregatesQueryOptions(params: GetNhiemVuParams = {}) {
  return queryOptions({
    queryKey: queryKeys.nhiemVu.statsAggregates(listFilterKey(params)),
    queryFn: () => getNhiemVuStatsAggregates(params),
    ...listQueryOptions,
  });
}

export function nhiemVuDistinctTieuDeQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.nhiemVu.distinctTieuDe,
    queryFn: () => getDistinctTieuDe(),
    ...listQueryOptions,
  });
}
