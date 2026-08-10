import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  createEmployee,
  updateEmployee,
  deleteEmployees,
  updateEmployeeStatus,
  bulkUpdateEmployees,
  restoreEmployees,
  resetEmployeePassword,
  bulkResetEmployeePasswords,
  importEmployees,
} from '../services/nhan-vien-service';
import { EmployeeCreateFormValues, EmployeeEditFormValues } from '../core/schema';
import { Employee } from '../core/types';
import type { TrangThaiNhanVien } from '../core/constants';
import { toast } from 'sonner';
import { txt } from '@/lib/text';
import { queryKeys } from '@/lib/query-keys';
import { employeeDetailQueryOptions } from '../queries/employees';
import { getErrorMessage } from '@/lib/utils';
import { isApi } from '@/lib/data/config';
import type { ImportMutationInput } from '@/lib/import';
import { useEmployeeStore } from '../store/useEmployeeStore';
import { useShallow } from 'zustand/react/shallow';
import { useEmployeesList } from './use-employees-list';

function invalidateEmployeeListQueries(queryClient: ReturnType<typeof useQueryClient>) {
  void queryClient.invalidateQueries({ queryKey: queryKeys.employees.pagePrefix });
  void queryClient.invalidateQueries({ queryKey: queryKeys.employees.countPrefix });
  void queryClient.invalidateQueries({ queryKey: queryKeys.employees.filterCountsPrefix });
  void queryClient.invalidateQueries({ queryKey: queryKeys.employees.statsAggregatesPrefix });
}

/** Danh sách nhân viên — luôn server-side filter + pagination. */
export const useEmployees = () => {
  const { pagination, sort, searchTerm, filters, setPage } = useEmployeeStore(
    useShallow((s) => ({
      pagination: s.pagination,
      sort: s.sort,
      searchTerm: s.searchTerm,
      filters: s.filters,
      setPage: s.setPage,
    })),
  );

  useEffect(() => {
    setPage(1);
  }, [
    searchTerm,
    filters.trang_thai,
    filters.columnSearch,
    setPage,
  ]);

  const result = useEmployeesList({
    page: pagination.page,
    pageSize: pagination.pageSize,
    sort,
    searchTerm,
    filters,
  });
  return {
    data: result.employees,
    total: result.total,
    mode: result.mode,
    isServerPaginated: result.isServerPaginated,
    isLoading: result.isLoading,
    isFetching: result.isFetching,
  };
};

export const useEmployee = (id: string | null) => {
  return useQuery({
    ...employeeDetailQueryOptions(id ?? ''),
    enabled: !!id,
  });
};

export const useCreateEmployee = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: EmployeeCreateFormValues) => createEmployee(data),
    onSuccess: () => {
      invalidateEmployeeListQueries(queryClient);
      toast.success(txt('employee.toast.createSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
};

export const useUpdateEmployee = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: EmployeeEditFormValues }) =>
      updateEmployee(id, data),
    onSuccess: (updated, variables) => {
      invalidateEmployeeListQueries(queryClient);
      queryClient.setQueryData(queryKeys.employees.detail(variables.id), updated);
      toast.success(txt('employee.toast.updateSuccess'));
      if (onSuccess) onSuccess();
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
};

export const useUpdateStatusEmployee = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: TrangThaiNhanVien }) =>
      updateEmployeeStatus(ids, status),
    onSuccess: (_, variables) => {
      invalidateEmployeeListQueries(queryClient);
      variables.ids.forEach((id) => {
        queryClient.setQueryData<Employee | undefined>(queryKeys.employees.detail(id), (prev) =>
          prev ? { ...prev, trang_thai: variables.status } : prev,
        );
      });
      toast.success(txt('employee.toast.statusUpdateSuccess', { count: variables.ids.length }));
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
};

export const useBulkUpdateEmployees = (onSuccess?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, fields }: { ids: string[]; fields: Record<string, unknown> }) =>
      bulkUpdateEmployees(ids, fields),
    onSuccess: (_, variables) => {
      invalidateEmployeeListQueries(queryClient);
      void queryClient.invalidateQueries({ queryKey: queryKeys.employees.anyDetail });
      toast.success(txt('employee.toast.bulkUpdateSuccess', { count: variables.ids.length }));
      onSuccess?.();
    },
    onError: (err: unknown) => toast.error(`Lỗi: ${getErrorMessage(err)}`),
  });
};

export const useDeleteEmployees = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteEmployees(ids),
    onSuccess: (_, ids) => {
      invalidateEmployeeListQueries(queryClient);
      ids.forEach((id) => queryClient.removeQueries({ queryKey: queryKeys.employees.detail(id) }));
      toast.success(txt('employee.toast.deleteSuccess', { count: ids.length }));
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
};

/**
 * Hook xóa có thể hoàn tác (undo).
 * Xóa trước → hiện toast có nút "Hoàn tác" → nếu nhấn thì restore lại.
 */
export const useDeleteWithUndo = () => {
  const queryClient = useQueryClient();

  const deleteMut = useMutation({
    mutationFn: (ids: string[]) => deleteEmployees(ids),
    onSuccess: (_, ids) => {
      invalidateEmployeeListQueries(queryClient);
      ids.forEach((id) => queryClient.removeQueries({ queryKey: queryKeys.employees.detail(id) }));
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });

  const restoreMut = useMutation({
    mutationFn: (employees: Employee[]) => restoreEmployees(employees),
    onSuccess: () => {
      invalidateEmployeeListQueries(queryClient);
      void queryClient.invalidateQueries({ queryKey: queryKeys.employees.anyDetail });
      toast.success(txt('employee.toast.undoSuccess'));
    },
  });

  const deleteWithUndo = async (
    employees: Employee[],
    callbacks?: { onDone?: () => void },
  ) => {
    const ids = employees.map((e) => e.id);
    const snapshot = [...employees];

    await deleteMut.mutateAsync(ids);
    callbacks?.onDone?.();

    const message = txt('employee.toast.deleteCount', { count: ids.length });
    // Xóa cứng (DB không có soft delete) ⇒ ở chế độ API không thể hoàn tác:
    // tạo lại sẽ sinh id mới, mất liên kết hợp đồng / phiếu và mất mật khẩu.
    // Xem `restoreEmployees`.
    if (isApi()) {
      toast(message);
      return;
    }

    toast(message, {
      duration: 6000,
      action: {
        label: txt('employee.toast.undo'),
        onClick: () => restoreMut.mutate(snapshot),
      },
    });
  };

  return { deleteWithUndo, isPending: deleteMut.isPending };
};

export const useResetEmployeePassword = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, password }: { id: string; password: string }) =>
      resetEmployeePassword(id, password),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.employees.detail(variables.id) });
      toast.success(txt('employee.form.resetPasswordSuccess'));
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
};

/** Đặt lại mật khẩu hàng loạt — một mật khẩu tạm dùng chung, buộc đổi ở lần đăng nhập kế tiếp. */
export const useBulkResetEmployeePasswords = (onDone?: () => void) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, password }: { ids: string[]; password: string }) =>
      bulkResetEmployeePasswords(ids, password),
    onSuccess: (result) => {
      invalidateEmployeeListQueries(queryClient);
      void queryClient.invalidateQueries({ queryKey: queryKeys.employees.anyDetail });
      if (result.updated > 0) {
        toast.success(txt('employee.bulkPassword.success', { count: result.updated }));
      }
      if (result.skipped.length > 0) {
        toast.warning(txt('employee.bulkPassword.skipped', { count: result.skipped.length }), {
          description: result.skipped.slice(0, 3).join(', '),
        });
      }
      onDone?.();
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
};

export const useImportEmployees = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rows, onProgress }: ImportMutationInput) =>
      importEmployees(rows, { onProgress }),
    onSuccess: (result) => {
      invalidateEmployeeListQueries(queryClient);
      if (result.created > 0) {
        toast.success(txt('employee.toast.importSuccess', { count: result.created }));
      }
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
};
