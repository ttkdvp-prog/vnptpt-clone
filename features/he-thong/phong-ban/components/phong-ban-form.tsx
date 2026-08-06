import React, { useEffect, useMemo } from 'react';
import { txt } from '@/lib/text';
import { ICON_SIZE } from '@/lib/icon-sizes';
import { useForm, Controller, SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Building, Building2 } from 'lucide-react';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import StatusToggle from '@/components/ui/StatusToggle';
import ParentSelect from '@/components/ui/ParentSelect';
import { DepartmentFormValues, createDepartmentSchema } from '../core/schema';
import { Department } from '../core/types';
import { DEPARTMENT_FIELD_ICONS } from '../core/department-field-icons';
import {
  departmentHasChildren,
  getEligibleParentDepartments,
} from '../utils/department-hierarchy';
import { useCreateDepartment, useUpdateDepartment } from '../hooks/use-phong-ban';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '@/components/shared/GenericDrawer';
import FormSection from '@/components/shared/FormSection';
import FormGrid from '@/components/shared/FormGrid';
import FormDrawerFooter from '@/components/shared/FormDrawerFooter';
import type { FormMode } from '@/lib/last-view-flow';
import { useCan } from '@/hooks/use-can';
import { useCanOnRecord } from '@/hooks/use-can-on-record';
import { isApi } from '@/lib/data/config';
import { fieldIcon } from '@/lib/field-icon';
import { toast } from 'sonner';
import { useConfirmDiscardOnClose } from '@/hooks/use-confirm-discard-on-close';

interface Props {
  initialData?: Department | null;
  /** `duplicate`: tạo mới điền sẵn từ `initialData` (reset mã, trạng thái; giữ cha để bản sao cùng cấp). */
  mode?: FormMode;
  allDepartments: Department[];
  onClose: () => void;
  /** Khi thêm phòng ban con từ detail: id cha được chọn sẵn */
  defaultParentId?: string | null;
}

const DepartmentForm: React.FC<Props> = ({ initialData, mode, allDepartments, onClose, defaultParentId }) => {
  const isDuplicate = mode === 'duplicate';
  const isEdit = !!initialData && !isDuplicate;
  const canCreate = useCan('create', 'departments');
  const canEditRecord = useCanOnRecord('edit', 'departments', {
    nguoi_tao: initialData?.nguoi_tao,
  });
  const canSave = isEdit ? canEditRecord : canCreate;

  useEffect(() => {
    if (!canSave) {
      toast.error(txt('shared.error.forbidden'));
      onClose();
    }
  }, [canSave, onClose]);

  const createMutation = useCreateDepartment(onClose);
  const updateMutation = useUpdateDepartment(onClose);

  // Sao chép: bản ghi mới nên không loại trừ id nguồn khỏi check unique / chọn cha.
  const editingId = isEdit ? initialData?.id : undefined;

  const resolver = useMemo(
    () =>
      zodResolver(
        createDepartmentSchema({ allDepartments, editingId }) as z.ZodType<
          DepartmentFormValues,
          z.core.$ZodTypeInternals<DepartmentFormValues>
        >,
      ) as unknown as Resolver<DepartmentFormValues>,
    [allDepartments, editingId],
  );

  const eligibleParents = useMemo(
    () => getEligibleParentDepartments(allDepartments, { excludeId: editingId }),
    [allDepartments, editingId],
  );

  const isParentLocked = useMemo(
    () => Boolean(isEdit && initialData && departmentHasChildren(initialData.id, allDepartments)),
    [isEdit, initialData, allDepartments],
  );

  const defaultValues = useMemo<Partial<DepartmentFormValues>>(
    () => ({
      ma_phong_ban: '',
      ten_phong_ban: '',
      mo_ta: '',
      cha_id: '',
      trang_thai: 'Đang hoạt động',
      thu_tu: 1,
    }),
    [],
  );

  const { register, handleSubmit, formState: { errors, isDirty }, reset, control } = useForm<DepartmentFormValues>({
    resolver,
    defaultValues,
  });
  const attemptClose = useConfirmDiscardOnClose(isDirty, onClose);

  useEffect(() => {
    if (initialData) {
      reset({
        ma_phong_ban: initialData.ma_phong_ban,
        ten_phong_ban: initialData.ten_phong_ban,
        mo_ta: initialData.mo_ta ?? '',
        cha_id: initialData.cha_id || '',
        trang_thai: initialData.trang_thai,
        thu_tu: initialData.thu_tu,
        // Sao chép: mã phải nhập lại (unique), trạng thái về mặc định; giữ cha để bản sao cùng cấp.
        ...(isDuplicate && {
          ma_phong_ban: defaultValues.ma_phong_ban,
          trang_thai: defaultValues.trang_thai,
        }),
      });
    } else {
      const nextThuTu = allDepartments.length
        ? Math.max(...allDepartments.map((d) => d.thu_tu ?? 0)) + 1
        : 1;
      reset({
        ...defaultValues,
        thu_tu: nextThuTu,
        cha_id: defaultParentId ?? '',
      });
    }
  }, [initialData, isDuplicate, defaultParentId, allDepartments, reset, defaultValues]);

  const onSubmit: SubmitHandler<DepartmentFormValues> = (data) => {
    const sanitizedData = {
      ...data,
      cha_id: data.cha_id === '' || data.cha_id === undefined ? null : data.cha_id,
      mo_ta: data.mo_ta?.trim() || undefined,
    };
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: sanitizedData });
    } else {
      createMutation.mutate(sanitizedData);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? txt('department.form.editTitle') : txt('department.form.createTitle')}
      icon={<Building size={ICON_SIZE.prominent} />}
      onClose={attemptClose}
      footer={
        <FormDrawerFooter
          formId="dept-form"
          onCancel={attemptClose}
          isLoading={isLoading}
          isEdit={isEdit}
          compact
        />
      }
      footerCompact
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="dept-form" onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Một section giống detail: Thông tin cơ bản, thứ tự trường trùng với detail */}
        <FormSection
          title={txt('department.detail.basicInfo')}
          icon={<Building2 size={ICON_SIZE.compact} />}
          variant="primary"
        >
          <FormGrid cols={2}>
            <Input
              label={txt('department.name')}
              placeholder={txt('department.form.namePlaceholder')}
              icon={fieldIcon(DEPARTMENT_FIELD_ICONS.ten_phong_ban)}
              required
              {...register('ten_phong_ban')}
              error={errors.ten_phong_ban?.message}
            />
            <Input
              label={txt('department.code')}
              placeholder={txt('department.form.codePlaceholder')}
              hint={txt('department.form.codeHint')}
              icon={fieldIcon(DEPARTMENT_FIELD_ICONS.ma_phong_ban)}
              required
              {...register('ma_phong_ban')}
              error={errors.ma_phong_ban?.message}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                register('ma_phong_ban').onChange(e);
              }}
            />
            {!isApi() && (
              <div className="col-span-1 sm:col-span-2">
                <Textarea
                  {...register('mo_ta')}
                  label={txt('department.detail.description')}
                  icon={fieldIcon(DEPARTMENT_FIELD_ICONS.mo_ta)}
                  rows={3}
                  className="resize-y min-h-[80px]"
                  error={errors.mo_ta?.message}
                />
              </div>
            )}
            <div className="col-span-1 sm:col-span-2">
              <Controller
                name="cha_id"
                control={control}
                render={({ field }) => (
                  <ParentSelect<Department>
                    items={eligibleParents}
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    excludeId={editingId}
                    getId={(d) => d.id}
                    getParentId={(d) => d.cha_id}
                    getLevel={(d) => d.cap_do}
                    getOptionLabel={(d) => d.ten_phong_ban}
                    label={txt('department.form.parent')}
                    icon={fieldIcon(DEPARTMENT_FIELD_ICONS.cha_id)}
                    placeholder={txt('department.form.parentNone')}
                    hint={
                      isParentLocked
                        ? txt('department.form.parentLockedHasChildren')
                        : txt('department.form.parentHint')
                    }
                    disabled={isParentLocked}
                    error={errors.cha_id?.message}
                  />
                )}
              />
            </div>
            {isEdit && initialData && !isApi() && (
              <div className="flex flex-col gap-1">
                <span className="text-xs font-medium text-foreground/80 flex items-center gap-1.5">
                  {fieldIcon(DEPARTMENT_FIELD_ICONS.cap_do)}
                  {txt('department.detail.level')}
                </span>
                <span className="text-body-sm text-muted-foreground">{String(initialData.cap_do)}</span>
              </div>
            )}
            {!isApi() && (
              <Input
                type="number"
                label={txt('department.detail.order')}
                icon={fieldIcon(DEPARTMENT_FIELD_ICONS.thu_tu)}
                required
                {...register('thu_tu')}
                error={errors.thu_tu?.message}
              />
            )}
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <StatusToggle
                  label={txt('common.status')}
                  value={field.value}
                  onChange={field.onChange}
                  activeLabel="Đang hoạt động"
                  inactiveLabel="Ngừng hoạt động"
                  icon={fieldIcon(DEPARTMENT_FIELD_ICONS.trang_thai)}
                  required
                />
              )}
            />
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default DepartmentForm;
