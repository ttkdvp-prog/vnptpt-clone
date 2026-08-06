import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createDepartment,
  updateDepartment,
  deleteDepartment,
  deleteDepartmentsMany,
  updateDepartmentStatus,
  updateDepartmentStatusMany,
  importDepartments,
} from "../services/phong-ban-service";
import { DepartmentFormValues } from "../core/schema";
import type { Department } from '../core/types';
import type { TrangThaiHoatDong } from '@/lib/constants/trang-thai';
import { toast } from "sonner";
import { txt } from '@/lib/text';
import { queryKeys } from '@/lib/query-keys';
import { departmentsQueryOptions } from '@/features/he-thong/queries/master-data';
import { getErrorMessage } from '@/lib/utils';
import { createCrudHooks } from '@/lib/factories/create-crud-hooks';

const departmentCrudHooks = createCrudHooks<Department, DepartmentFormValues, DepartmentFormValues>({
  queryKey: queryKeys.departments.all,
  countKey: queryKeys.departments.count,
  pagePrefixKey: queryKeys.departments.pagePrefix,
  listQueryOptions: departmentsQueryOptions,
  createFn: createDepartment,
  updateFn: updateDepartment,
  importFn: importDepartments,
  getId: (d) => d.id,
  sortCache: (a, b) => a.duong_dan.localeCompare(b.duong_dan),
  toast: {
    createSuccess: txt('department.toast.createSuccess'),
    updateSuccess: txt('department.toast.updateSuccess'),
    importSuccess: (count) => txt('department.toast.importSuccess', { count }),
  },
});

export const useDepartments = departmentCrudHooks.useList;
export const useCreateDepartment = departmentCrudHooks.useCreate;
export const useUpdateDepartment = departmentCrudHooks.useUpdate;
export const useImportDepartments = departmentCrudHooks.useImport;

export const useUpdateStatusDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: TrangThaiHoatDong }) => updateDepartmentStatus(id, status),
    onSuccess: (_, variables) => {
      queryClient.setQueryData<Department[]>(queryKeys.departments.all, (old) =>
        old?.map((d) =>
          d.id === variables.id ? { ...d, trang_thai: variables.status } : d,
        ),
      );
      toast.success(txt('department.toast.updateSuccess'));
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
};

export const useDeleteDepartment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.departments.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.positions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.positions.active });
      toast.success(txt('department.toast.deleteSuccess'));
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err))
  });
};

/** Bulk — dùng bởi phong-ban.module.tsx qua `useStatusManyMutation`, một request thay vì lặp N lần. */
export const useUpdateStatusDepartmentMany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, status }: { ids: string[]; status: TrangThaiHoatDong }) => updateDepartmentStatusMany(ids, status),
    onSuccess: (_, variables) => {
      queryClient.setQueryData<Department[]>(queryKeys.departments.all, (old) =>
        old?.map((d) => (variables.ids.includes(d.id) ? { ...d, trang_thai: variables.status } : d)),
      );
      toast.success(txt('department.toast.statusUpdate', { count: variables.ids.length }));
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
};

/** Bulk — dùng bởi phong-ban.module.tsx qua `useDeleteManyMutation`, một request thay vì lặp N lần. */
export const useDeleteDepartmentsMany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => deleteDepartmentsMany(ids),
    onSuccess: (result) => {
      queryClient.setQueryData<Department[]>(queryKeys.departments.all, (old) =>
        old?.filter((d) => !result.deletedIds.includes(d.id)),
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.positions.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.positions.active });
      if (result.skippedIds.length > 0) {
        toast.warning(txt('department.toast.deleteSkipped', { count: result.skippedIds.length }));
      }
      if (result.deletedIds.length > 0) {
        toast.success(txt('department.toast.deleteSuccess'));
      }
    },
    onError: (err: unknown) => toast.error(getErrorMessage(err)),
  });
};
