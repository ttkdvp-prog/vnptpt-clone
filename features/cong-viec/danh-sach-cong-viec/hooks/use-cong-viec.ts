import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import { txt } from '@/lib/text';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import {
  createCongViecRecord,
  deleteCongViecRecord,
  deleteCongViecRecords,
  importCongViec,
  updateCongViecRecord,
} from '../services/cong-viec-service';
import type { ImportMutationInput } from '@/lib/import';
import {
  congViecDetailQueryOptions,
  congViecDistinctTieuDeQueryOptions,
  congViecDistinctToQueryOptions,
} from '../queries/cong-viec';
import type { CongViecFormValues } from '../core/schema';
import type { CongViec } from '../core/types';
import { useCongViecStore } from '../store/useCongViecStore';
import { useCongViecList } from './use-cong-viec-list';

function invalidateCongViecListQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.congViec.pagePrefix });
  void queryClient.invalidateQueries({ queryKey: queryKeys.congViec.countPrefix });
  void queryClient.invalidateQueries({ queryKey: queryKeys.congViec.filterCountsPrefix });
  void queryClient.invalidateQueries({ queryKey: queryKeys.congViec.statsAggregatesPrefix });
  void queryClient.invalidateQueries({ queryKey: queryKeys.congViec.distinctTieuDe });
}

export const useCongViec = () => {
  const { pagination, sort, searchTerm, filters, setPage } = useCongViecStore(
    useShallow((s) => ({
      pagination: s.pagination,
      sort: s.sort,
      searchTerm: s.searchTerm,
      filters: s.filters,
      setPage: s.setPage,
    })),
  );

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filters.cap, filters.uu_tien, filters.to_ar, setPage]);

  const result = useCongViecList({ page: pagination.page, pageSize: pagination.pageSize, sort, searchTerm, filters });
  return {
    data: result.items,
    total: result.total,
    mode: 'server' as const,
    isServerPaginated: result.isServerPaginated,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
  };
};

export const useCongViecDistinctTieuDe = () => useQuery(congViecDistinctTieuDeQueryOptions());
export const useCongViecDistinctTo = () => useQuery(congViecDistinctToQueryOptions());

export const useCongViecDetail = (id: string | null) =>
  useQuery({ ...congViecDetailQueryOptions(id ?? ''), enabled: !!id });

export const useCreateCongViec = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CongViecFormValues) => createCongViecRecord(data),
    onSuccess: () => {
      invalidateCongViecListQueries(queryClient);
      toast.success(txt('congViec.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
};

export const useUpdateCongViec = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CongViecFormValues }) => updateCongViecRecord(id, data),
    onSuccess: (updated, variables) => {
      invalidateCongViecListQueries(queryClient);
      queryClient.setQueryData(queryKeys.congViec.detail(variables.id), updated);
      toast.success(txt('congViec.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
};

export const useImportCongViec = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rows, onProgress }: ImportMutationInput) => importCongViec(rows, { onProgress }),
    onSuccess: (result) => {
      invalidateCongViecListQueries(queryClient);
      if (result.created > 0) {
        toast.success(txt('congViec.toast.importSuccess', { count: result.created }));
      }
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
};

export const useDeleteCongViec = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => (ids.length === 1 ? deleteCongViecRecord(ids[0]!) : deleteCongViecRecords(ids)),
    onSuccess: (_, ids) => {
      invalidateCongViecListQueries(queryClient);
      ids.forEach((id) => queryClient.removeQueries({ queryKey: queryKeys.congViec.detail(id) }));
      toast.success(txt('congViec.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
};

export type { CongViec };
