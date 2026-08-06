import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { txt } from '@/lib/text';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import { listQueryOptions } from '@/lib/query/query-config';
import type { ImportResult } from '@/lib/import';
import type { HopDong } from '../core/types';
import type { HopDongFormValues } from '../core/schema';
import {
  createHopDong,
  deleteHopDongList,
  getHopDongById,
  getHopDongList,
  updateHopDong,
} from '../services/hop-dong-service';

export function useHopDong() {
  return useQuery({
    queryKey: queryKeys.contracts.all,
    queryFn: getHopDongList,
    ...listQueryOptions,
  });
}

export function useHopDongDetail(id: string | null) {
  return useQuery({
    queryKey: queryKeys.contracts.detail(id ?? ''),
    queryFn: () => getHopDongById(id ?? ''),
    enabled: !!id,
    ...listQueryOptions,
  });
}

export function useCreateHopDong(onSuccess?: (created: HopDong) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createHopDong,
    onSuccess: (created) => {
      queryClient.setQueryData<HopDong[]>(queryKeys.contracts.all, (old) =>
        old ? [...old, created] : [created],
      );
      toast.success(txt('contract.toast.createSuccess'));
      onSuccess?.(created);
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
}

export function useUpdateHopDong(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: HopDongFormValues }) =>
      updateHopDong(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData<HopDong[]>(queryKeys.contracts.all, (old) =>
        old?.map((item) => (item.id === updated.id ? updated : item)),
      );
      queryClient.setQueryData(queryKeys.contracts.detail(updated.id), updated);
      toast.success(txt('contract.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
}

export function useDeleteHopDong() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteHopDongList(ids),
    onSuccess: (_, ids) => {
      queryClient.setQueryData<HopDong[]>(queryKeys.contracts.all, (old) =>
        old?.filter((item) => !ids.includes(item.id)),
      );
      toast.success(txt('contract.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
}

/** Module không hỗ trợ import ở v1 — factory vẫn yêu cầu hook, trả về no-op. */
export function useNoopHopDongImport() {
  return {
    mutateAsync: async (): Promise<ImportResult> => ({ created: 0, failed: [] }),
  };
}
