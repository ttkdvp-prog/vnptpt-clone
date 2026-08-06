import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { txt } from '@/lib/text';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import { listQueryOptions } from '@/lib/query/query-config';
import type { ImportMutationInput } from '@/lib/import';
import type { TrangThaiKhachHang } from '../core/types';
import type { TrangThaiKhachHangFormValues } from '../core/schema';
import {
  createTrangThaiKhachHang,
  deleteTrangThaiKhachHangList,
  getTrangThaiKhachHangList,
  importTrangThaiKhachHang,
  updateTrangThaiKhachHang,
} from '../services/trang-thai-khach-hang-service';

export function useTrangThaiKhachHang() {
  return useQuery({
    queryKey: queryKeys.customerStatuses.all,
    queryFn: getTrangThaiKhachHangList,
    ...listQueryOptions,
  });
}

export function useCreateTrangThaiKhachHang(
  onSuccess?: (created: TrangThaiKhachHang) => void,
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createTrangThaiKhachHang,
    onSuccess: (created) => {
      queryClient.setQueryData<TrangThaiKhachHang[]>(queryKeys.customerStatuses.all, (old) =>
        old ? [...old, created] : [created],
      );
      toast.success(txt('customerSettings.trangThai.toast.createSuccess'));
      onSuccess?.(created);
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
}

export function useUpdateTrangThaiKhachHang(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TrangThaiKhachHangFormValues }) =>
      updateTrangThaiKhachHang(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData<TrangThaiKhachHang[]>(queryKeys.customerStatuses.all, (old) =>
        old?.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success(txt('customerSettings.trangThai.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
}

export function useDeleteTrangThaiKhachHang() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteTrangThaiKhachHangList(ids),
    onSuccess: (_, ids) => {
      queryClient.setQueryData<TrangThaiKhachHang[]>(queryKeys.customerStatuses.all, (old) =>
        old?.filter((item) => !ids.includes(item.id)),
      );
      toast.success(txt('customerSettings.trangThai.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
}
export function useImportTrangThaiKhachHang() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rows, onProgress }: ImportMutationInput) =>
      importTrangThaiKhachHang(rows, { onProgress }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.customerStatuses.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.customerStatuses.count });
      void queryClient.invalidateQueries({ queryKey: queryKeys.customerStatuses.pagePrefix });
      if (result.created > 0) {
        toast.success(
          txt('customerSettings.trangThai.toast.importSuccess', { count: result.created }),
        );
      }
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
}
