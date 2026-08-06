import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { txt } from '@/lib/text';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import { listQueryOptions } from '@/lib/query/query-config';
import type { ImportMutationInput } from '@/lib/import';
import type { DanhSachTaiLieu } from '../core/types';
import type { DanhSachTaiLieuFormValues } from '../core/schema';
import {
  createDanhSachTaiLieu,
  deleteDanhSachTaiLieuList,
  getDanhSachTaiLieuList,
  importDanhSachTaiLieu,
  updateDanhSachTaiLieu,
} from '../services/danh-sach-tai-lieu-service';

export function useDanhSachTaiLieu() {
  return useQuery({
    queryKey: queryKeys.documents.all,
    queryFn: getDanhSachTaiLieuList,
    ...listQueryOptions,
  });
}

export function useCreateDanhSachTaiLieu(onSuccess?: (created: DanhSachTaiLieu) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDanhSachTaiLieu,
    onSuccess: (created) => {
      queryClient.setQueryData<DanhSachTaiLieu[]>(queryKeys.documents.all, (old) =>
        old ? [...old, created] : [created],
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.documents.statsAggregatesPrefix,
      });
      toast.success(txt('document.toast.createSuccess'));
      onSuccess?.(created);
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
}

export function useUpdateDanhSachTaiLieu(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DanhSachTaiLieuFormValues }) =>
      updateDanhSachTaiLieu(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData<DanhSachTaiLieu[]>(queryKeys.documents.all, (old) =>
        old?.map((item) => (item.id === updated.id ? updated : item)),
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.documents.statsAggregatesPrefix,
      });
      toast.success(txt('document.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
}

export function useDeleteDanhSachTaiLieu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteDanhSachTaiLieuList(ids),
    onSuccess: (_, ids) => {
      queryClient.setQueryData<DanhSachTaiLieu[]>(queryKeys.documents.all, (old) =>
        old?.filter((item) => !ids.includes(item.id)),
      );
      void queryClient.invalidateQueries({
        queryKey: queryKeys.documents.statsAggregatesPrefix,
      });
      toast.success(txt('document.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
}

export function useImportDanhSachTaiLieu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rows, onProgress }: ImportMutationInput) =>
      importDanhSachTaiLieu(rows, { onProgress }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents.count });
      void queryClient.invalidateQueries({ queryKey: queryKeys.documents.pagePrefix });
      void queryClient.invalidateQueries({
        queryKey: queryKeys.documents.statsAggregatesPrefix,
      });
      if (result.created > 0) {
        toast.success(txt('document.toast.importSuccess', { count: result.created }));
      }
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
}
