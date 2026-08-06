import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { txt } from '@/lib/text';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import { listQueryOptions } from '@/lib/query/query-config';
import type { ImportMutationInput } from '@/lib/import';
import type { LoaiTaiLieu } from '../core/types';
import type { LoaiTaiLieuFormValues } from '../core/schema';
import {
  createLoaiTaiLieu,
  deleteLoaiTaiLieuList,
  getLoaiTaiLieuList,
  importLoaiTaiLieu,
  updateLoaiTaiLieu,
} from '../services/loai-tai-lieu-service';

export function useLoaiTaiLieu() {
  return useQuery({
    queryKey: queryKeys.documentTypes.all,
    queryFn: getLoaiTaiLieuList,
    ...listQueryOptions,
  });
}

export function useCreateLoaiTaiLieu(onSuccess?: (created: LoaiTaiLieu) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createLoaiTaiLieu,
    onSuccess: (created) => {
      queryClient.setQueryData<LoaiTaiLieu[]>(queryKeys.documentTypes.all, (old) =>
        old ? [...old, created] : [created],
      );
      toast.success(txt('documentSettings.loai.toast.createSuccess'));
      onSuccess?.(created);
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
}

export function useUpdateLoaiTaiLieu(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: LoaiTaiLieuFormValues }) =>
      updateLoaiTaiLieu(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData<LoaiTaiLieu[]>(queryKeys.documentTypes.all, (old) =>
        old?.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success(txt('documentSettings.loai.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
}

export function useDeleteLoaiTaiLieu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteLoaiTaiLieuList(ids),
    onSuccess: (_, ids) => {
      queryClient.setQueryData<LoaiTaiLieu[]>(queryKeys.documentTypes.all, (old) =>
        old?.filter((item) => !ids.includes(item.id)),
      );
      toast.success(txt('documentSettings.loai.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
}
export function useImportLoaiTaiLieu() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rows, onProgress }: ImportMutationInput) =>
      importLoaiTaiLieu(rows, { onProgress }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.documentTypes.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.documentTypes.count });
      void queryClient.invalidateQueries({ queryKey: queryKeys.documentTypes.pagePrefix });
      if (result.created > 0) {
        toast.success(
          txt('documentSettings.loai.toast.importSuccess', { count: result.created }),
        );
      }
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
}
