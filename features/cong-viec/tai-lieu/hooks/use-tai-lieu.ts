import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import { txt } from '@/lib/text';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import {
  createTaiLieuRecord,
  deleteTaiLieuRecord,
  deleteTaiLieuRecords,
  updateTaiLieuRecord,
} from '../services/tai-lieu-service';
import {
  taiLieuDetailQueryOptions,
  taiLieuDistinctDanhMucQueryOptions,
  taiLieuDistinctTenHoSoQueryOptions,
  taiLieuDistinctToQueryOptions,
} from '../queries/tai-lieu';
import type { TaiLieuFormValues } from '../core/schema';
import type { TaiLieu } from '../core/types';
import { useTaiLieuStore } from '../store/useTaiLieuStore';
import { useTaiLieuList } from './use-tai-lieu-list';

function invalidateTaiLieuListQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.taiLieu.pagePrefix });
  void queryClient.invalidateQueries({ queryKey: queryKeys.taiLieu.countPrefix });
  void queryClient.invalidateQueries({ queryKey: queryKeys.taiLieu.filterCountsPrefix });
  void queryClient.invalidateQueries({ queryKey: queryKeys.taiLieu.statsAggregatesPrefix });
  void queryClient.invalidateQueries({ queryKey: queryKeys.taiLieu.distinctDanhMuc });
  void queryClient.invalidateQueries({ queryKey: queryKeys.taiLieu.distinctTenHoSo });
}

export const useTaiLieu = () => {
  const { pagination, sort, searchTerm, filters, setPage } = useTaiLieuStore(
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
  }, [searchTerm, filters.tinh_trang, filters.danh_muc, filters.to, setPage]);

  const result = useTaiLieuList({ page: pagination.page, pageSize: pagination.pageSize, sort, searchTerm, filters });
  return {
    data: result.items,
    total: result.total,
    mode: 'server' as const,
    isServerPaginated: result.isServerPaginated,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
  };
};

export const useTaiLieuDistinctDanhMuc = () => useQuery(taiLieuDistinctDanhMucQueryOptions());
export const useTaiLieuDistinctTo = () => useQuery(taiLieuDistinctToQueryOptions());
export const useTaiLieuDistinctTenHoSo = () => useQuery(taiLieuDistinctTenHoSoQueryOptions());

export const useTaiLieuDetail = (id: string | null) =>
  useQuery({ ...taiLieuDetailQueryOptions(id ?? ''), enabled: !!id });

export const useCreateTaiLieu = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TaiLieuFormValues) => createTaiLieuRecord(data),
    onSuccess: () => {
      invalidateTaiLieuListQueries(queryClient);
      toast.success(txt('congViecTaiLieu.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
};

export const useUpdateTaiLieu = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TaiLieuFormValues }) => updateTaiLieuRecord(id, data),
    onSuccess: (updated, variables) => {
      invalidateTaiLieuListQueries(queryClient);
      queryClient.setQueryData(queryKeys.taiLieu.detail(variables.id), updated);
      toast.success(txt('congViecTaiLieu.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
};

export const useDeleteTaiLieu = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => (ids.length === 1 ? deleteTaiLieuRecord(ids[0]!) : deleteTaiLieuRecords(ids)),
    onSuccess: (_, ids) => {
      invalidateTaiLieuListQueries(queryClient);
      ids.forEach((id) => queryClient.removeQueries({ queryKey: queryKeys.taiLieu.detail(id) }));
      toast.success(txt('congViecTaiLieu.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
};

export type { TaiLieu };
