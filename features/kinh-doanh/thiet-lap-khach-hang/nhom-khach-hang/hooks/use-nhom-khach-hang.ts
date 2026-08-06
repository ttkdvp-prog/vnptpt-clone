import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { txt } from '@/lib/text';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import { listQueryOptions } from '@/lib/query/query-config';
import type { ImportMutationInput } from '@/lib/import';
import type { NhomKhachHang } from '../core/types';
import type { NhomKhachHangFormValues } from '../core/schema';
import {
  createNhomKhachHang,
  deleteNhomKhachHangList,
  getNhomKhachHangList,
  importNhomKhachHang,
  updateNhomKhachHang,
} from '../services/nhom-khach-hang-service';

export function useNhomKhachHang() {
  return useQuery({
    queryKey: queryKeys.customerGroups.all,
    queryFn: getNhomKhachHangList,
    ...listQueryOptions,
  });
}

export function useCreateNhomKhachHang(onSuccess?: (created: NhomKhachHang) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNhomKhachHang,
    onSuccess: (created) => {
      queryClient.setQueryData<NhomKhachHang[]>(queryKeys.customerGroups.all, (old) =>
        old ? [...old, created] : [created],
      );
      toast.success(txt('customerSettings.nhom.toast.createSuccess'));
      onSuccess?.(created);
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
}

export function useUpdateNhomKhachHang(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: NhomKhachHangFormValues }) =>
      updateNhomKhachHang(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData<NhomKhachHang[]>(queryKeys.customerGroups.all, (old) =>
        old?.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success(txt('customerSettings.nhom.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
}

export function useDeleteNhomKhachHang() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteNhomKhachHangList(ids),
    onSuccess: (_, ids) => {
      queryClient.setQueryData<NhomKhachHang[]>(queryKeys.customerGroups.all, (old) =>
        old?.filter((item) => !ids.includes(item.id)),
      );
      toast.success(txt('customerSettings.nhom.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
}
export function useImportNhomKhachHang() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rows, onProgress }: ImportMutationInput) =>
      importNhomKhachHang(rows, { onProgress }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.customerGroups.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.customerGroups.count });
      void queryClient.invalidateQueries({ queryKey: queryKeys.customerGroups.pagePrefix });
      if (result.created > 0) {
        toast.success(
          txt('customerSettings.nhom.toast.importSuccess', { count: result.created }),
        );
      }
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
}
