import { queryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { listQueryOptions } from '@/lib/query/query-config';
import {
  getDistinctDanhMuc,
  getDistinctPhongBan,
  getDistinctTenHoSo,
  getTaiLieuById,
  getTaiLieuCount,
  getTaiLieuFilterCounts,
  getTaiLieuStatsAggregates,
  getTaiLieuPage,
  type GetTaiLieuParams,
} from '../services/tai-lieu-service';

function listFilterKey(params: GetTaiLieuParams): Omit<GetTaiLieuParams, 'limit' | 'offset' | 'orderBy' | 'ascending'> {
  return {
    search: params.search,
    tinh_trang: params.tinh_trang,
    danh_muc: params.danh_muc,
    to: params.to,
  };
}

export function taiLieuCountQueryOptions(params: GetTaiLieuParams = {}) {
  return queryOptions({
    queryKey: queryKeys.taiLieu.count(listFilterKey(params)),
    queryFn: () => getTaiLieuCount(params),
    ...listQueryOptions,
  });
}

export function taiLieuDetailQueryOptions(id: string) {
  return queryOptions({
    queryKey: queryKeys.taiLieu.detail(id),
    queryFn: () => getTaiLieuById(id),
    enabled: Boolean(id),
    ...listQueryOptions,
  });
}

export function taiLieuPageQueryOptions(params: GetTaiLieuParams) {
  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;
  const orderBy = params.orderBy ?? 'id';
  const ascending = params.ascending ?? true;
  const pageKey = { limit, offset, orderBy, ascending, ...listFilterKey(params) };
  return queryOptions({
    queryKey: queryKeys.taiLieu.page(pageKey),
    queryFn: () => getTaiLieuPage({ ...params, limit, offset, orderBy, ascending }),
    ...listQueryOptions,
  });
}

export function taiLieuFilterCountsQueryOptions(params: GetTaiLieuParams = {}) {
  return queryOptions({
    queryKey: queryKeys.taiLieu.filterCounts(listFilterKey(params)),
    queryFn: () => getTaiLieuFilterCounts(params),
    ...listQueryOptions,
  });
}

export function taiLieuStatsAggregatesQueryOptions(params: GetTaiLieuParams = {}) {
  return queryOptions({
    queryKey: queryKeys.taiLieu.statsAggregates(listFilterKey(params)),
    queryFn: () => getTaiLieuStatsAggregates(params),
    ...listQueryOptions,
  });
}

export function taiLieuDistinctDanhMucQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.taiLieu.distinctDanhMuc,
    queryFn: () => getDistinctDanhMuc(),
    ...listQueryOptions,
  });
}

export function taiLieuDistinctToQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.taiLieu.distinctTo,
    queryFn: () => getDistinctPhongBan(),
    ...listQueryOptions,
  });
}

export function taiLieuDistinctTenHoSoQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.taiLieu.distinctTenHoSo,
    queryFn: () => getDistinctTenHoSo(),
    ...listQueryOptions,
  });
}
