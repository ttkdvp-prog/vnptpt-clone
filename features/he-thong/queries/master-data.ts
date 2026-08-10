import { queryOptions } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { masterDataQueryOptions } from '@/lib/query/query-config';
import { getBranches } from '@/features/he-thong/chi-nhanh/services/chi-nhanh-service';
import { getJobLevels } from '@/features/he-thong/cap-bac/services/cap-bac-service';

export function branchesQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.branches.all,
    queryFn: getBranches,
    ...masterDataQueryOptions,
  });
}

export function jobLevelsQueryOptions() {
  return queryOptions({
    queryKey: queryKeys.jobLevels.all,
    queryFn: getJobLevels,
    ...masterDataQueryOptions,
  });
}
