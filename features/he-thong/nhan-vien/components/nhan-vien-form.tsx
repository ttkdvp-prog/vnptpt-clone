import React, { useEffect, useMemo, useState } from 'react';
import { txt } from '@/lib/text';
import { ICON_SIZE } from '@/lib/icon-sizes';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserPlus, UserCircle, AlertCircle, KeyRound } from 'lucide-react';
import FormDrawerFooter from '@/components/shared/FormDrawerFooter';
import Input from '@/components/ui/Input';
import Combobox from '@/components/ui/Combobox';
import SingleImageInput from '@/components/ui/SingleImageInput';
import { CLOUDINARY_FOLDERS } from '@/lib/media/cloudinary-folders';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '@/components/shared/GenericDrawer';
import FormSection from '@/components/shared/FormSection';
import FormGrid from '@/components/shared/FormGrid';
import type { FormMode } from '@/lib/last-view-flow';
import {
  createEmployeeCreateSchema,
  createEmployeeEditSchema,
  type EmployeeCreateFormValues,
  type EmployeeEditFormValues,
  type EmployeeFormValues,
} from '../core/schema';
import { Employee } from '../core/types';
import { EMPLOYEE_FIELD_ICONS } from '../core/employee-field-icons';
import {
  getDefaultEmployeeCreateFormValues,
  getDefaultEmployeeFormValues,
  employeeToEditFormValues,
} from '../utils/employee-to-form';
import { useCreateEmployee, useUpdateEmployee, useResetEmployeePassword } from '../hooks/use-nhan-vien';
import Button from '@/components/ui/Button';
import { useCan } from '@/hooks/use-can';
import { fieldIcon } from '@/lib/field-icon';
import { toast } from 'sonner';
import { useConfirmDiscardOnClose } from '@/hooks/use-confirm-discard-on-close';

interface Props {
  initialData?: Employee | null;
  /** `duplicate`: tạo mới điền sẵn từ `initialData` (reset trường định danh, ảnh, mật khẩu). */
  mode?: FormMode;
  prefillData?: Partial<EmployeeFormValues>;
  onClose: () => void;
}

const EmployeeForm: React.FC<Props> = ({ initialData, mode, prefillData, onClose }) => {
  const isDuplicate = mode === 'duplicate';
  const isEdit = !!initialData && !isDuplicate;
  const canCreate = useCan('create', 'employees');
  const canEditRecord = useCan('edit', 'employees');
  const canSave = isEdit ? canEditRecord : canCreate;

  useEffect(() => {
    if (!canSave) {
      toast.error(txt('shared.error.forbidden'));
      onClose();
    }
  }, [canSave, onClose]);
  const createMutation = useCreateEmployee(onClose);
  const updateMutation = useUpdateEmployee(onClose);
  const resetPasswordMutation = useResetEmployeePassword();
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [newTempPassword, setNewTempPassword] = useState('');

  const statusOptions = useMemo(
    () => [
      { value: 'Đang làm việc', label: txt('employee.statusActive') },
      { value: 'Thử việc', label: txt('employee.statusProbation') },
      { value: 'Nghỉ phép', label: txt('employee.statusLeave') },
      { value: 'Nghỉ việc', label: txt('employee.statusResigned') },
    ],
    [],
  );

  const employeeFormSchema = useMemo(
    () => (isEdit ? createEmployeeEditSchema() : createEmployeeCreateSchema()),
    [isEdit],
  );

  const resolver = useMemo(
    () => zodResolver(employeeFormSchema) as Resolver<
      EmployeeFormValues | EmployeeCreateFormValues | EmployeeEditFormValues
    >,
    [employeeFormSchema],
  );

  const { register, handleSubmit, formState: { errors, isDirty }, reset, control } = useForm<
    EmployeeFormValues | EmployeeCreateFormValues | EmployeeEditFormValues
  >({
    resolver,
    defaultValues: isEdit ? getDefaultEmployeeFormValues() : getDefaultEmployeeCreateFormValues(),
  });

  useEffect(() => {
    if (initialData && isDuplicate) {
      // Sao chép: bỏ trống họ tên, ảnh, mật khẩu; giữ trạng thái mặc định.
      reset({
        ...employeeToEditFormValues(initialData),
        ho_ten: '',
        anh_dai_dien: '',
        trang_thai: 'Đang làm việc',
        mat_khau_tam: '',
      });
    } else if (initialData) {
      reset(employeeToEditFormValues(initialData));
    } else if (prefillData) {
      reset((prev) => ({
        ...prev,
        ...prefillData,
        trang_thai: prefillData.trang_thai ?? 'Đang làm việc',
      }));
    }
  }, [initialData, isDuplicate, prefillData, reset]);

  const onSubmit = (data: EmployeeFormValues | EmployeeCreateFormValues | EmployeeEditFormValues) => {
    if (!canSave) return;
    if (isEdit && initialData) {
      updateMutation.mutate({
        id: initialData.id,
        data: data as EmployeeEditFormValues,
      });
    } else {
      createMutation.mutate(data as EmployeeCreateFormValues);
    }
  };

  const handleResetPassword = async () => {
    if (!initialData?.id || newTempPassword.length < 6) return;
    await resetPasswordMutation.mutateAsync({ id: initialData.id, password: newTempPassword });
    setResetPasswordOpen(false);
    setNewTempPassword('');
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  const isSubmitBlocked = isLoading || !canSave;

  const attemptClose = useConfirmDiscardOnClose(isDirty, onClose);

  const footer = useMemo(
    () => (
      <FormDrawerFooter
        formId="emp-form"
        onCancel={attemptClose}
        isLoading={isSubmitBlocked}
        isEdit={isEdit}
        compact
        createIcon={<UserPlus className="w-3.5 h-3.5 mr-1.5 shrink-0" />}
      />
    ),
    [attemptClose, isSubmitBlocked, isEdit],
  );

  return (
    <GenericDrawer
      title={isEdit ? txt('employee.form.editTitle') : txt('employee.form.createTitle')}
      subtitle={isEdit && initialData ? initialData.ho_ten : txt('employee.form.createSubtitle')}
      icon={<UserCircle size={ICON_SIZE.prominent} />}
      onClose={attemptClose}
      footer={footer}
      footerCompact
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="emp-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {Object.keys(errors).length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden />
            <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
              {txt('employee.form.validationError')}
            </p>
          </div>
        )}

        <FormSection title={txt('employee.form.personalInfo')} icon={<UserCircle size={ICON_SIZE.compact} />}>
          <div className="flex justify-center mb-4">
            <Controller
              name="anh_dai_dien"
              control={control}
              render={({ field }) => (
                <SingleImageInput
                  label={txt('employee.form.avatar')}
                  icon={fieldIcon(EMPLOYEE_FIELD_ICONS.anh_dai_dien)}
                  value={field.value}
                  onChange={field.onChange}
                  shape="circle"
                  className="w-24"
                  aspectRatio="1/1"
                  maxSizeMB={10}
                  hint={txt('employee.form.avatarHint')}
                  uploadContext={{ folder: CLOUDINARY_FOLDERS.employeeAvatar }}
                />
              )}
            />
          </div>
          <FormGrid cols={2}>
            {!isEdit && (
              <Input
                label={txt('employee.code')}
                required
                {...register('id' as 'ho_ten')}
                error={(errors as typeof errors & { id?: { message?: string } }).id?.message}
              />
            )}
            <Input
              label={txt('employee.name')}
              required
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ho_ten)}
              {...register('ho_ten')}
              error={errors.ho_ten?.message}
            />
            <Controller
              name="trang_thai"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={txt('employee.form.workStatus')}
                  options={statusOptions}
                  value={String(field.value)}
                  onChange={(val) => field.onChange(val)}
                  placeholder={txt('employee.form.workStatusPlaceholder')}
                  icon={fieldIcon(EMPLOYEE_FIELD_ICONS.trang_thai)}
                  searchable={false}
                  error={errors.trang_thai?.message}
                />
              )}
            />
          </FormGrid>
        </FormSection>

        {!isEdit && (
          <FormSection title={txt('employee.form.authAccount')} icon={<KeyRound size={ICON_SIZE.compact} />}>
            <FormGrid cols={2}>
              <Input
                label={txt('employee.form.loginName')}
                placeholder={txt('employee.form.loginNamePlaceholder')}
                icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ten_dang_nhap)}
                {...register('ten_dang_nhap')}
                error={errors.ten_dang_nhap?.message}
              />
              <Input
                label={txt('employee.form.tempPassword')}
                type="password"
                required
                icon={fieldIcon(EMPLOYEE_FIELD_ICONS.mat_khau_tam)}
                {...register('mat_khau_tam' as keyof EmployeeCreateFormValues)}
                error={(errors as { mat_khau_tam?: { message?: string } }).mat_khau_tam?.message}
              />
            </FormGrid>
          </FormSection>
        )}

        {isEdit && initialData && (
          <FormSection title={txt('employee.form.authAccount')} icon={<KeyRound size={ICON_SIZE.compact} />}>
            <div className="space-y-3">
              <FormGrid cols={2}>
                <Input
                  label={txt('employee.form.username')}
                  icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ten_dang_nhap)}
                  {...register('ten_dang_nhap')}
                  error={errors.ten_dang_nhap?.message}
                />
              </FormGrid>
              {!resetPasswordOpen ? (
                <Button type="button" variant="outline" size="sm" onClick={() => setResetPasswordOpen(true)}>
                  {txt('employee.form.resetPassword')}
                </Button>
              ) : (
                <div className="flex flex-col sm:flex-row gap-2">
                  <Input
                    type="password"
                    label={txt('employee.form.newTempPassword')}
                    icon={fieldIcon(EMPLOYEE_FIELD_ICONS.mat_khau_tam)}
                    value={newTempPassword}
                    onChange={(e) => setNewTempPassword(e.target.value)}
                  />
                  <div className="flex gap-2 items-end">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleResetPassword}
                      isLoading={resetPasswordMutation.isPending}
                      disabled={newTempPassword.length < 6}
                    >
                      {txt('common.save')}
                    </Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setResetPasswordOpen(false)}>
                      {txt('common.cancel')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </FormSection>
        )}
      </form>
    </GenericDrawer>
  );
};

export default EmployeeForm;
