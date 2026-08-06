import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TrangThaiHoatDong } from '@/lib/constants/trang-thai';
import {
  createPosition,
  updatePosition,
  deletePositions,
  updatePositionStatus,
  importPositions,
} from "../services/chuc-vu-service";
import { PositionFormValues } from "../core/schema";
import type { Position } from '../core/types';
import { toast } from "sonner";
import { txt } from '@/lib/text';
import { queryKeys } from '@/lib/query-keys';
import { positionsQueryOptions, activePositionsQueryOptions } from '@/features/he-thong/queries/master-data';
import { getErrorMessage } from '@/lib/utils';
import { createCrudHooks } from '@/lib/factories/create-crud-hooks';

function invalidateActivePositions(queryClient: ReturnType<typeof useQueryClient>): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.positions.active });
}

/** Matrix `roles.forModule` + member `can()` grants — gọi khi đổi trạng thái / CRUD chức vụ. */
function invalidatePositionPermissionCaches(
  queryClient: ReturnType<typeof useQueryClient>,
  positionIds?: readonly string[],
): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.roles.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.permissionGrants.all });
  if (positionIds?.length) {
    for (const id of positionIds) {
      void queryClient.invalidateQueries({ queryKey: queryKeys.permissionGrants.byPosition(id) });
    }
  }
}

const positionCrudHooks = createCrudHooks<Position, PositionFormValues, PositionFormValues>({
  queryKey: queryKeys.positions.all,
  countKey: queryKeys.positions.count,
  pagePrefixKey: queryKeys.positions.pagePrefix,
  listQueryOptions: positionsQueryOptions,
  createFn: createPosition,
  updateFn: updatePosition,
  importFn: importPositions,
  getId: (p) => p.id,
  sortCache: (a, b) => a.thu_tu - b.thu_tu,
  toast: {
    createSuccess: txt('position.toast.createSuccess'),
    updateSuccess: txt('position.toast.updateSuccess'),
    importSuccess: (count) => txt('position.toast.importSuccess', { count }),
  },
  onMutated: (queryClient, item) => {
    invalidateActivePositions(queryClient);
    invalidatePositionPermissionCaches(queryClient, [item.id]);
  },
  onImported: (queryClient) => {
    invalidateActivePositions(queryClient);
    invalidatePositionPermissionCaches(queryClient);
  },
});

export const usePositions = positionCrudHooks.useList;
export const useActivePositions = () => useQuery(activePositionsQueryOptions());
export const useCreatePosition = positionCrudHooks.useCreate;
export const useUpdatePosition = positionCrudHooks.useUpdate;
export const useImportPositions = positionCrudHooks.useImport;

export const useUpdateStatusPosition = () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ ids, status }: { ids: string[], status: TrangThaiHoatDong }) => updatePositionStatus(ids, status),
      onSuccess: (_, variables) => {
        queryClient.setQueryData<Position[]>(queryKeys.positions.all, (old) =>
          old?.map((p) =>
            variables.ids.includes(p.id) ? { ...p, trang_thai: variables.status } : p,
          ),
        );
        invalidateActivePositions(queryClient);
        invalidatePositionPermissionCaches(queryClient, variables.ids);
        toast.success(txt('position.toast.statusUpdate', { count: variables.ids.length }));
      },
      onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`)
    });
};

export const useDeletePosition = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deletePositions(ids),
    onSuccess: (_, ids) => {
      queryClient.setQueryData<Position[]>(queryKeys.positions.all, (old) =>
        old?.filter((p) => !ids.includes(p.id)),
      );
      invalidateActivePositions(queryClient);
      toast.success(txt('position.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err))
  });
};
