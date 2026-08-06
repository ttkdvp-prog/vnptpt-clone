import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { txt } from '@/lib/text';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import { listQueryOptions } from '@/lib/query/query-config';
import type { ImportMutationInput } from '@/lib/import';
import type { MarketIn } from '../core/types';
import type { MarketInFormValues } from '../core/schema';
import {
  approveMarketIn,
  createMarketIn,
  deleteMarketInList,
  getMarketInList,
  getNextMaMarket,
  importMarketIn,
  suspendMarketIn,
  updateMarketIn,
} from '../services/market-in-service';

export function useMarketIn() {
  return useQuery({
    queryKey: queryKeys.printMarkets.all,
    queryFn: getMarketInList,
    ...listQueryOptions,
  });
}

export function useNextMaMarket(enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.printMarkets.nextMa,
    queryFn: getNextMaMarket,
    enabled,
    staleTime: 0,
    gcTime: 0,
  });
}

export function useCreateMarketIn(onSuccess?: (created: MarketIn) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMarketIn,
    onSuccess: (created) => {
      queryClient.setQueryData<MarketIn[]>(queryKeys.printMarkets.all, (old) =>
        old ? [...old, created] : [created],
      );
      toast.success(txt('printMarket.toast.createSuccess'));
      onSuccess?.(created);
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
}

export function useUpdateMarketIn(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MarketInFormValues }) =>
      updateMarketIn(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData<MarketIn[]>(queryKeys.printMarkets.all, (old) =>
        old?.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success(txt('printMarket.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
}

export function useApproveMarketIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }: { id: string; reapply?: boolean }) => approveMarketIn(id),
    onSuccess: (updated, { reapply }) => {
      queryClient.setQueryData<MarketIn[]>(queryKeys.printMarkets.all, (old) =>
        old?.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success(
        txt(reapply ? 'printMarket.toast.reapplySuccess' : 'printMarket.toast.approveSuccess'),
      );
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
}

export function useSuspendMarketIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => suspendMarketIn(id),
    onSuccess: (updated) => {
      queryClient.setQueryData<MarketIn[]>(queryKeys.printMarkets.all, (old) =>
        old?.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success(txt('printMarket.toast.suspendSuccess'));
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
}

export function useDeleteMarketIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteMarketInList(ids),
    onSuccess: (_, ids) => {
      queryClient.setQueryData<MarketIn[]>(queryKeys.printMarkets.all, (old) =>
        old?.filter((item) => !ids.includes(item.id)),
      );
      toast.success(txt('printMarket.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
}

export function useImportMarketIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rows, onProgress }: ImportMutationInput) =>
      importMarketIn(rows, { onProgress }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.printMarkets.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.printMarkets.count });
      void queryClient.invalidateQueries({ queryKey: queryKeys.printMarkets.pagePrefix });
      if (result.created > 0) {
        toast.success(txt('printMarket.toast.importSuccess', { count: result.created }));
      }
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
}
