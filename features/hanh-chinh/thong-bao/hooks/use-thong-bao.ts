import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { txt } from '@/lib/text';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import { listQueryOptions } from '@/lib/query/query-config';
import type { ImportResult } from '@/lib/import';
import type { ThongBao } from '../core/types';
import type { ThongBaoFormValues } from '../core/schema';
import {
  createThongBao,
  deleteThongBaoList,
  getThongBaoById,
  getThongBaoList,
  updateThongBao,
} from '../services/thong-bao-service';

export function useThongBao() {
  return useQuery({
    queryKey: queryKeys.announcements.all,
    queryFn: getThongBaoList,
    ...listQueryOptions,
  });
}

export function useThongBaoDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.announcements.detail(id ?? ''),
    queryFn: () => getThongBaoById(id ?? ''),
    enabled: !!id,
    ...listQueryOptions,
  });
}

export function useCreateThongBao(onSuccess?: (created: ThongBao) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createThongBao,
    onSuccess: (created) => {
      queryClient.setQueryData<ThongBao[]>(queryKeys.announcements.all, (old) =>
        old ? [...old, created] : [created],
      );
      toast.success(txt('announcement.toast.createSuccess'));
      onSuccess?.(created);
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
}

export function useUpdateThongBao(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ThongBaoFormValues }) =>
      updateThongBao(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData<ThongBao[]>(queryKeys.announcements.all, (old) =>
        old?.map((item) => (item.id === updated.id ? updated : item)),
      );
      queryClient.setQueryData(queryKeys.announcements.detail(updated.id), updated);
      toast.success(txt('announcement.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
}

export function useDeleteThongBao() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteThongBaoList(ids),
    onSuccess: (_, ids) => {
      queryClient.setQueryData<ThongBao[]>(queryKeys.announcements.all, (old) =>
        old?.filter((item) => !ids.includes(item.id)),
      );
      toast.success(txt('announcement.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
}

export function useNoopThongBaoImport() {
  return {
    mutateAsync: async (): Promise<ImportResult> => ({ created: 0, failed: [] }),
  };
}

