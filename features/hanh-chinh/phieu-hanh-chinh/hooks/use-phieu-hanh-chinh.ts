import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { txt } from '@/lib/text';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import { listQueryOptions } from '@/lib/query/query-config';
import type { ImportMutationInput } from '@/lib/import';
import { getEmployees } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import type { PhieuHanhChinh } from '../core/types';
import type { PhieuHanhChinhFormValues } from '../core/schema';
import {
  approvePhieuHcns,
  approvePhieuQl,
  cancelPhieuHanhChinh,
  createPhieuHanhChinh,
  deletePhieuHanhChinhList,
  getPhieuHanhChinhList,
  importPhieuHanhChinh,
  rejectPhieuHanhChinh,
  updatePhieuHanhChinh,
} from '../services/phieu-hanh-chinh-service';

function invalidateAdminFormCaches(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.adminForms.count });
  void queryClient.invalidateQueries({ queryKey: queryKeys.adminForms.pagePrefix });
  void queryClient.invalidateQueries({
    queryKey: queryKeys.adminForms.statsAggregatesPrefix,
  });
}

function patchList(updated: PhieuHanhChinh) {
  return (old: PhieuHanhChinh[] | undefined) =>
    old?.map((item) => (item.id === updated.id ? updated : item));
}

/** Gắn id/ten phòng ban từ var_nhan_vien (phiếu không có cột phòng ban). */
function enrichDepartmentFromEmployees(
  items: PhieuHanhChinh[],
  employees: { id: string; phong_ban_id: string | null; ten_phong_ban?: string }[],
): PhieuHanhChinh[] {
  if (employees.length === 0) return items;
  const byId = new Map(employees.map((e) => [e.id, e]));
  return items.map((item) => {
    const nv = byId.get(item.id_nhan_vien);
    const id_phong_ban = item.id_phong_ban ?? nv?.phong_ban_id ?? null;
    const ten_phong_ban = item.ten_phong_ban ?? nv?.ten_phong_ban ?? null;
    if (id_phong_ban === item.id_phong_ban && ten_phong_ban === item.ten_phong_ban) {
      return item;
    }
    return { ...item, id_phong_ban, ten_phong_ban };
  });
}

export function usePhieuHanhChinh() {
  const listQuery = useQuery({
    queryKey: queryKeys.adminForms.all,
    queryFn: getPhieuHanhChinhList,
    ...listQueryOptions,
  });

  const { data: employees = [] } = useQuery({
    queryKey: [...queryKeys.employees.all, 'phieu-hanh-chinh-dept'] as const,
    queryFn: () => getEmployees({ limit: 5000, offset: 0 }),
    ...listQueryOptions,
  });

  const data = useMemo(
    () =>
      listQuery.data
        ? enrichDepartmentFromEmployees(listQuery.data, employees)
        : listQuery.data,
    [listQuery.data, employees],
  );

  return { ...listQuery, data };
}

export function useCreatePhieuHanhChinh(onSuccess?: (created: PhieuHanhChinh) => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createPhieuHanhChinh,
    onSuccess: (created) => {
      queryClient.setQueryData<PhieuHanhChinh[]>(queryKeys.adminForms.all, (old) =>
        old ? [...old, created] : [created],
      );
      invalidateAdminFormCaches(queryClient);
      toast.success(txt('adminForm.toast.createSuccess'));
      onSuccess?.(created);
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
}

export function useUpdatePhieuHanhChinh(onSuccess?: () => void) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: PhieuHanhChinhFormValues }) =>
      updatePhieuHanhChinh(id, data),
    onSuccess: (updated) => {
      queryClient.setQueryData<PhieuHanhChinh[]>(queryKeys.adminForms.all, patchList(updated));
      invalidateAdminFormCaches(queryClient);
      toast.success(txt('adminForm.toast.updateSuccess'));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
}

export function useApprovePhieuQl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ghi_chu }: { id: string; ghi_chu?: string | null }) =>
      approvePhieuQl(id, ghi_chu),
    onSuccess: (updated) => {
      queryClient.setQueryData<PhieuHanhChinh[]>(queryKeys.adminForms.all, patchList(updated));
      invalidateAdminFormCaches(queryClient);
      toast.success(txt('adminForm.toast.approveQlSuccess'));
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
}

export function useApprovePhieuHcns() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ghi_chu }: { id: string; ghi_chu?: string | null }) =>
      approvePhieuHcns(id, ghi_chu),
    onSuccess: (updated) => {
      queryClient.setQueryData<PhieuHanhChinh[]>(queryKeys.adminForms.all, patchList(updated));
      invalidateAdminFormCaches(queryClient);
      toast.success(txt('adminForm.toast.approveHcnsSuccess'));
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
}

export function useRejectPhieuHanhChinh() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ly_do_tu_choi }: { id: string; ly_do_tu_choi: string }) =>
      rejectPhieuHanhChinh(id, ly_do_tu_choi),
    onSuccess: (updated) => {
      queryClient.setQueryData<PhieuHanhChinh[]>(queryKeys.adminForms.all, patchList(updated));
      invalidateAdminFormCaches(queryClient);
      toast.success(txt('adminForm.toast.rejectSuccess'));
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
}

export function useCancelPhieuHanhChinh() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelPhieuHanhChinh(id),
    onSuccess: (updated) => {
      queryClient.setQueryData<PhieuHanhChinh[]>(queryKeys.adminForms.all, patchList(updated));
      invalidateAdminFormCaches(queryClient);
      toast.success(txt('adminForm.toast.cancelSuccess'));
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
}

export function useDeletePhieuHanhChinh() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deletePhieuHanhChinhList(ids),
    onSuccess: (_, ids) => {
      queryClient.setQueryData<PhieuHanhChinh[]>(queryKeys.adminForms.all, (old) =>
        old?.filter((item) => !ids.includes(item.id)),
      );
      invalidateAdminFormCaches(queryClient);
      toast.success(txt('adminForm.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
}

export function useImportPhieuHanhChinh() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rows, onProgress }: ImportMutationInput) =>
      importPhieuHanhChinh(rows, { onProgress }),
    onSuccess: (result) => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.adminForms.all });
      invalidateAdminFormCaches(queryClient);
      if (result.created > 0) {
        toast.success(txt('adminForm.toast.importSuccess', { count: result.created }));
      }
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
}
