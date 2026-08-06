import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { txt } from '@/lib/text';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import { listQueryOptions } from '@/lib/query/query-config';
import type { ImportMutationInput } from '@/lib/import';
import type { KhachHang } from '../core/types';
import type { KhachHangFormValues } from '../core/schema';
import {
  createKhachHang,
  deleteKhachHangList,
  getKhachHangList,
  getNextMaKhachHang,
  importKhachHang,
  patchKhachHang,
  updateKhachHang,
} from '../services/khach-hang-service';

export function useKhachHang() {
  return useQuery({
    queryKey: queryKeys.customers.all,
    queryFn: getKhachHangList,
    ...listQueryOptions,
  });
}

/** Gợi ý mã KH tăng dần — refetch mỗi lần mở form create. */
export function useNextMaKhachHang(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.customers.nextMa,
    queryFn: getNextMaKhachHang,
    enabled,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useCreateKhachHang(onSuccess?: (created: KhachHang) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createKhachHang,
    onSuccess: (created) => {
      queryClient.setQueryData<KhachHang[]>(queryKeys.customers.all, (old) =>
        old ? [...old, created] : [created],
      );
      toast.success(txt('customer.toast.createSuccess'));
      onSuccess?.(created);
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
}

export function useUpdateKhachHang(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: KhachHangFormValues }) =>
      updateKhachHang(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData<KhachHang[]>(queryKeys.customers.all, (old) =>
        old?.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success(txt('customer.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
}

/** Patch nhóm / trạng thái từ detail (không đóng drawer). */
export function usePatchKhachHang() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<KhachHangFormValues> }) =>
      patchKhachHang(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData<KhachHang[]>(queryKeys.customers.all, (old) =>
        old?.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success(txt('customer.toast.updateSuccess'));
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
}

export function useDeleteKhachHang() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteKhachHangList(ids),
    onSuccess: (_, ids) => {
      queryClient.setQueryData<KhachHang[]>(queryKeys.customers.all, (old) =>
        old?.filter((item) => !ids.includes(item.id)),
      );
      toast.success(txt('customer.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
}
export function useImportKhachHang() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rows, onProgress }: ImportMutationInput) =>
      importKhachHang(rows, { onProgress }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.count });
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.pagePrefix });
      if (result.created > 0) {
        toast.success(txt('customer.toast.importSuccess', { count: result.created }));
      }
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
}
