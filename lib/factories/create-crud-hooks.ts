import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/utils';
import type { ImportMutationInput, ImportResult } from '@/lib/import';

/**
 * Phần khung CRUD dùng chung cho `useList/useCreate/useUpdate/useImport` — trích từ
 * `chuc-vu`/`phong-ban` (audit cho thấy ~90% logic mutation/cache-update giống nhau,
 * chỉ khác key cache/sort/toast). KHÔNG gộp `useUpdateStatus`/`useDelete` vào đây vì
 * 2 module có shape khác nhau thật (chuc-vu: bulk `ids[]`, phong-ban: single `id`) —
 * ép chung sẽ tạo abstraction rò rỉ, giữ nguyên 2 hook đó riêng ở từng module.
 */
export interface CrudHooksConfig<TItem, TCreateInput, TUpdateInput> {
  queryKey: readonly unknown[];
  countKey?: readonly unknown[];
  pagePrefixKey?: readonly unknown[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- queryKey tuple type khác nhau giữa module, không cần khớp chính xác ở biên factory
  listQueryOptions: () => UseQueryOptions<TItem[], Error, TItem[], any>;
  createFn: (data: TCreateInput) => Promise<TItem>;
  updateFn: (id: string, data: TUpdateInput) => Promise<TItem>;
  importFn: (rows: ImportMutationInput['rows'], opts: { onProgress?: ImportMutationInput['onProgress'] }) => Promise<ImportResult>;
  getId: (item: TItem) => string;
  /** Sắp xếp lại cache sau khi thêm mới (vd theo `thu_tu` hoặc `duong_dan`). Không truyền = nối cuối. */
  sortCache?: (a: TItem, b: TItem) => number;
  toast: {
    createSuccess: string;
    updateSuccess: string;
    importSuccess: (count: number) => string;
  };
  /** Hook phụ sau khi create/update thành công — vd invalidate cache phân quyền (chỉ chuc-vu cần). */
  onMutated?: (queryClient: QueryClient, item: TItem) => void;
  /** Hook phụ sau khi import thành công — vd invalidate thêm cache active/permission. */
  onImported?: (queryClient: QueryClient) => void;
}

export function createCrudHooks<TItem, TCreateInput, TUpdateInput>(
  config: CrudHooksConfig<TItem, TCreateInput, TUpdateInput>,
) {
  const useList = () => useQuery(config.listQueryOptions());

  const useCreate = (onSuccess?: () => void) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: config.createFn,
      onSuccess: (created) => {
        queryClient.setQueryData<TItem[]>(config.queryKey, (old) =>
          old
            ? [...old, created].sort(config.sortCache)
            : [created],
        );
        config.onMutated?.(queryClient, created);
        toast.success(config.toast.createSuccess);
        onSuccess?.();
      },
      onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
    });
  };

  const useUpdate = (onSuccess?: () => void) => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, data }: { id: string; data: TUpdateInput }) => config.updateFn(id, data),
      onSuccess: (updated) => {
        queryClient.setQueryData<TItem[]>(config.queryKey, (old) =>
          old?.map((item) => (config.getId(item) === config.getId(updated) ? updated : item)),
        );
        config.onMutated?.(queryClient, updated);
        toast.success(config.toast.updateSuccess);
        onSuccess?.();
      },
      onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
    });
  };

  const useImport = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ rows, onProgress }: ImportMutationInput) => config.importFn(rows, { onProgress }),
      onSuccess: (result) => {
        void queryClient.invalidateQueries({ queryKey: config.queryKey });
        if (config.countKey) void queryClient.invalidateQueries({ queryKey: config.countKey });
        if (config.pagePrefixKey) void queryClient.invalidateQueries({ queryKey: config.pagePrefixKey });
        config.onImported?.(queryClient);
        if (result.created > 0) {
          toast.success(config.toast.importSuccess(result.created));
        }
      },
      onError: (err: unknown) => toast.error(getErrorMessage(err)),
    });
  };

  return { useList, useCreate, useUpdate, useImport };
}
