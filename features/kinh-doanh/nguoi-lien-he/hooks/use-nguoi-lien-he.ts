import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { txt } from '@/lib/text';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import { listQueryOptions } from '@/lib/query/query-config';
import type { ImportMutationInput } from '@/lib/import';
import type { NguoiLienHe } from '../core/types';
import type { NguoiLienHeFormValues } from '../core/schema';
import {
  createNguoiLienHe,
  deleteNguoiLienHeList,
  getNguoiLienHeList,
  importNguoiLienHe,
  updateNguoiLienHe,
} from '../services/nguoi-lien-he-service';

export function useNguoiLienHe() {
  return useQuery({
    queryKey: queryKeys.contacts.all,
    queryFn: () => getNguoiLienHeList(),
    ...listQueryOptions,
  });
}

export function useNguoiLienHeByCustomer(customerId: string | undefined) {
  return useQuery({
    queryKey: customerId
      ? queryKeys.contacts.byCustomer(customerId)
      : ['contacts', 'by-customer', 'none'],
    queryFn: () => getNguoiLienHeList(customerId),
    enabled: !!customerId,
    ...listQueryOptions,
  });
}

function patchContactCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (old: NguoiLienHe[] | undefined) => NguoiLienHe[] | undefined,
) {
  queryClient.setQueryData<NguoiLienHe[]>(queryKeys.contacts.all, updater);
  queryClient.setQueriesData<NguoiLienHe[]>(
    { queryKey: ['contacts', 'by-customer'] },
    updater,
  );
}

export function useCreateNguoiLienHe(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createNguoiLienHe,
    onSuccess: (created) => {
      patchContactCaches(queryClient, (old) => (old ? [...old, created] : [created]));
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      toast.success(txt('contact.toast.createSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
}

export function useUpdateNguoiLienHe(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: NguoiLienHeFormValues }) =>
      updateNguoiLienHe(id, data),
    onSuccess: (updated) => {
      patchContactCaches(queryClient, (old) =>
        old?.map((item) => (item.id === updated.id ? updated : item)),
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      toast.success(txt('contact.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
}

export function useDeleteNguoiLienHe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteNguoiLienHeList(ids),
    onSuccess: (_, ids) => {
      patchContactCaches(queryClient, (old) => old?.filter((item) => !ids.includes(item.id)));
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      toast.success(txt('contact.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
}

export function useImportNguoiLienHe() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rows, onProgress }: ImportMutationInput) =>
      importNguoiLienHe(rows, { onProgress }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.contacts.count });
      void queryClient.invalidateQueries({ queryKey: queryKeys.contacts.pagePrefix });
      void queryClient.invalidateQueries({ queryKey: ['contacts', 'by-customer'] });
      void queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
      if (result.created > 0) {
        toast.success(txt('contact.toast.importSuccess', { count: result.created }));
      }
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
}
