import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { txt } from '@/lib/text';
import { ICON_SIZE } from '@/lib/icon-sizes';
import { useForm, Controller, useWatch, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  UserPlus, UserCircle, Mail, Briefcase,
  AlertCircle, KeyRound, IdCard,
  Landmark, GraduationCap, Shield,
} from 'lucide-react';
import FormDrawerFooter from '@/components/shared/FormDrawerFooter';
import Input from '@/components/ui/Input';
import Combobox from '@/components/ui/Combobox';
import RadioGroup from '@/components/ui/RadioGroup';
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
import {
  EDUCATION_LEVEL_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  RELATIONSHIP_OPTIONS,
  RESIGNATION_REASON_OPTIONS,
} from '../core/constants';
import { EMPLOYEE_FIELD_ICONS } from '../core/employee-field-icons';
import {
  getDefaultEmployeeCreateFormValues,
  getDefaultEmployeeFormValues,
  employeeToEditFormValues,
} from '../utils/employee-to-form';
import { normalizeLoginName } from '@/lib/validation/login-name';
import { useCreateEmployee, useUpdateEmployee, useResetEmployeePassword } from '../hooks/use-nhan-vien';
import { useLoginNameAvailability } from '../hooks/use-login-name-availability';
import { useDepartments } from '@/features/he-thong/phong-ban/hooks/use-phong-ban';
import { useActivePositions } from '@/features/he-thong/chuc-vu/hooks/use-chuc-vu';
import {
  buildEmployeePositionComboboxOptions,
  getDepartmentIdForPosition,
  getDepartmentNameForPosition,
  getDivisionNameForPosition,
  getPositionNameById,
  getCapBacForPosition,
  formatEmployeeCapBacLabel,
} from '../utils/build-employee-position-options';
import { coerceEntityId } from '@/lib/coerce-entity-id';
import { mergeActivePositionsForEmployeeForm } from '../utils/merge-active-positions-for-form';
import Button from '@/components/ui/Button';
import { useCan } from '@/hooks/use-can';
import { useCanOnRecord } from '@/hooks/use-can-on-record';
import { isApi } from '@/lib/data/config';
import { fieldIcon } from '@/lib/field-icon';
import { toast } from 'sonner';
import { useConfirmDiscardOnClose } from '@/hooks/use-confirm-discard-on-close';

interface Props {
  initialData?: Employee | null;
  /** `duplicate`: tạo mới điền sẵn từ `initialData` (reset trường định danh cá nhân, tài khoản, ảnh). */
  mode?: FormMode;
  prefillData?: Partial<EmployeeFormValues>;
  onClose: () => void;
}

const EmployeeForm: React.FC<Props> = ({ initialData, mode, prefillData, onClose }) => {
  const isDuplicate = mode === 'duplicate';
  const isEdit = !!initialData && !isDuplicate;
  const canCreate = useCan('create', 'employees');
  const canEditRecord = useCanOnRecord('edit', 'employees', {
    nguoi_tao: initialData?.nguoi_tao,
  });
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

  const { data: departments = [] } = useDepartments();
  const { data: activePositions = [], isLoading: isPositionsLoading } = useActivePositions();
  const positions = useMemo(
    () => mergeActivePositionsForEmployeeForm(activePositions, initialData),
    [activePositions, initialData],
  );

  const positionOptions = useMemo(
    () => buildEmployeePositionComboboxOptions(departments, positions),
    [departments, positions],
  );

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
    () =>
      isEdit
        ? createEmployeeEditSchema(positions, initialData?.ten_dang_nhap)
        : createEmployeeCreateSchema(positions),
    [positions, isEdit, initialData?.ten_dang_nhap],
  );

  const resolver = useMemo(
    () => zodResolver(employeeFormSchema) as Resolver<
      EmployeeFormValues | EmployeeCreateFormValues | EmployeeEditFormValues
    >,
    [employeeFormSchema],
  );

  const { register, handleSubmit, formState: { errors, isDirty }, reset, control, setValue, trigger, setError, clearErrors } = useForm<
    EmployeeFormValues | EmployeeCreateFormValues | EmployeeEditFormValues
  >({
    resolver,
    defaultValues: isEdit ? getDefaultEmployeeFormValues() : getDefaultEmployeeCreateFormValues(),
  });

  const selectedPositionId = useWatch({ control, name: 'chuc_vu_id' });
  const watchedLoginName = useWatch({ control, name: 'ten_dang_nhap' as keyof EmployeeEditFormValues });
  const watchedStatus = useWatch({ control, name: 'trang_thai' });
  const isResigned = watchedStatus === 'Nghỉ việc';

  const maritalOptions = useMemo(
    () => MARITAL_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    [],
  );
  const educationOptions = useMemo(
    () => EDUCATION_LEVEL_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    [],
  );
  const relationshipOptions = useMemo(
    () => RELATIONSHIP_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    [],
  );
  const resignationReasonOptions = useMemo(
    () => RESIGNATION_REASON_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
    [],
  );

  const initialLoginNormalized =
    initialData?.ten_dang_nhap ? normalizeLoginName(initialData.ten_dang_nhap) : '';

  const watchedLoginNormalized = useMemo(() => {
    const raw = typeof watchedLoginName === 'string' ? watchedLoginName : '';
    return raw.trim() ? normalizeLoginName(raw) : '';
  }, [watchedLoginName]);

  const isLoginChanged = Boolean(
    isEdit &&
      initialLoginNormalized &&
      watchedLoginNormalized &&
      watchedLoginNormalized !== initialLoginNormalized,
  );

  const setLoginNameFieldError = useCallback(
    (message: string) => {
      setError('ten_dang_nhap' as keyof EmployeeEditFormValues, {
        type: 'manual',
        message,
      });
    },
    [setError],
  );

  const clearLoginNameFieldError = useCallback(() => {
    clearErrors('ten_dang_nhap' as keyof EmployeeEditFormValues);
  }, [clearErrors]);

  const { isChecking: isCheckingLoginName, isDuplicate: isLoginNameDuplicate } =
    useLoginNameAvailability({
      loginName: watchedLoginNormalized,
      // Sao chép: bản ghi mới nên không loại trừ nhân viên nguồn khỏi check trùng tên đăng nhập.
      excludeEmployeeId: isEdit ? initialData?.id : undefined,
      initialLoginName: isEdit ? initialData?.ten_dang_nhap : undefined,
      setFieldError: setLoginNameFieldError,
      clearFieldError: clearLoginNameFieldError,
    });

  const departmentDisplayName = useMemo(
    () => getDepartmentNameForPosition(departments, positions, selectedPositionId),
    [departments, positions, selectedPositionId],
  );

  const divisionDisplayName = useMemo(
    () => getDivisionNameForPosition(departments, positions, selectedPositionId),
    [departments, positions, selectedPositionId],
  );

  const capBacDisplayName = useMemo(
    () => formatEmployeeCapBacLabel(getCapBacForPosition(positions, selectedPositionId)),
    [positions, selectedPositionId],
  );

  useEffect(() => {
    const deptId = getDepartmentIdForPosition(positions, selectedPositionId);
    if (deptId) {
      setValue('phong_ban_id', deptId, { shouldValidate: true });
    }
  }, [selectedPositionId, positions, setValue]);

  useEffect(() => {
    if (!selectedPositionId || isPositionsLoading) return;
    void trigger(['chuc_vu_id', 'phong_ban_id']);
  }, [positions, selectedPositionId, isPositionsLoading, trigger]);

  useEffect(() => {
    if (initialData && isDuplicate) {
      // Sao chép: giữ cấu hình chung (chức vụ, phòng ban, học vấn, nhân thân chung...);
      // bỏ trống các trường định danh cá nhân / unique (họ tên, email, SĐT, CCCD, BHXH,
      // tài khoản đăng nhập...), MỌI trường ảnh (không copy file), trạng thái về mặc định.
      reset({
        ...employeeToEditFormValues(initialData),
        ho_ten: '',
        anh_dai_dien: '',
        ngay_sinh: null,
        email: '',
        email_ca_nhan: null,
        so_dien_thoai: '',
        so_cccd: null,
        ngay_cap_cccd: null,
        noi_cap_cccd: null,
        dia_chi_thuong_tru: null,
        dia_chi_hien_tai: null,
        nguoi_lien_he_khan: null,
        sdt_khan: null,
        moi_quan_he: null,
        so_tai_khoan: null,
        ten_chu_tai_khoan: null,
        so_so_bhxh: null,
        so_bhyt: null,
        ma_so_thue_ca_nhan: null,
        ngay_nghi_viec: null,
        ly_do_nghi: null,
        trang_thai: 'Đang làm việc',
        ten_dang_nhap: '',
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
    if (isCheckingLoginName || isLoginNameDuplicate) return;
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

  const isLoading =
    createMutation.isPending ||
    updateMutation.isPending ||
    isPositionsLoading ||
    isCheckingLoginName;

  const isSubmitBlocked = isLoading || isLoginNameDuplicate || !canSave;

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
            <Input
              label={txt('employee.name')}
              required
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ho_ten)}
              {...register('ho_ten')}
              error={errors.ho_ten?.message}
            />
            <Controller
              name="gioi_tinh"
              control={control}
              render={({ field }) => (
                <RadioGroup
                  label={txt('employee.gender')}
                  labelIcon={fieldIcon(EMPLOYEE_FIELD_ICONS.gioi_tinh)}
                  options={[
                    { value: 'Nam', label: txt('employee.genderMale') },
                    { value: 'Nữ', label: txt('employee.genderFemale') },
                    { value: 'Khác', label: txt('employee.genderOther') },
                  ]}
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
            <Input
              label={txt('employee.form.birthDate')}
              type="date"
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ngay_sinh)}
              {...register('ngay_sinh')}
              error={errors.ngay_sinh?.message}
            />
            <Controller
              name="tinh_trang_hon_nhan"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={txt('employee.form.maritalStatus')}
                  icon={fieldIcon(EMPLOYEE_FIELD_ICONS.tinh_trang_hon_nhan)}
                  options={maritalOptions}
                  value={field.value ?? ''}
                  onChange={(val) => field.onChange(val === '' ? null : String(val))}
                  placeholder={txt('employee.form.maritalPlaceholder')}
                  searchable={false}
                  error={errors.tinh_trang_hon_nhan?.message}
                />
              )}
            />
            <Input
              label={txt('employee.form.nationality')}
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.quoc_tich)}
              {...register('quoc_tich')}
              error={errors.quoc_tich?.message}
            />
            <Input
              label={txt('employee.form.ethnicity')}
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.dan_toc)}
              {...register('dan_toc')}
              error={errors.dan_toc?.message}
            />
            <Input
              label={txt('employee.form.religion')}
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ton_giao)}
              {...register('ton_giao')}
              error={errors.ton_giao?.message}
            />
            <Input
              label={txt('employee.form.hometown')}
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.que_quan)}
              {...register('que_quan')}
              error={errors.que_quan?.message}
            />
          </FormGrid>
        </FormSection>

        <FormSection title={txt('employee.form.workInfo')} icon={<Briefcase size={ICON_SIZE.compact} />}>
          <FormGrid cols={2}>
            <Controller
              name="chuc_vu_id"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={txt('employee.position')}
                  required
                  options={positionOptions}
                  value={coerceEntityId(field.value)}
                  onChange={(val) => field.onChange(val === '' ? '' : String(val))}
                  placeholder={txt('employee.form.positionPlaceholder')}
                  icon={fieldIcon(EMPLOYEE_FIELD_ICONS.chuc_vu_id)}
                  dropdownInPortal
                  error={errors.chuc_vu_id?.message}
                  renderValue={() => getPositionNameById(positions, field.value) || undefined}
                />
              )}
            />
            <Input
              label={txt('employee.department')}
              value={departmentDisplayName}
              readOnly
              disabled
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.phong_ban_id)}
            />
            <Input
              label={txt('employee.division')}
              value={divisionDisplayName || '—'}
              readOnly
              disabled
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ten_bo_phan)}
            />
            <Input
              label={txt('employee.form.level')}
              value={capBacDisplayName}
              readOnly
              disabled
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.cap_bac)}
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
            <Input
              label={txt('employee.form.hireDate')}
              type="date"
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ngay_vao_lam)}
              {...register('ngay_vao_lam')}
              error={errors.ngay_vao_lam?.message}
            />
            <Input
              label={txt('employee.form.officialDate')}
              type="date"
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ngay_chinh_thuc)}
              {...register('ngay_chinh_thuc')}
              error={errors.ngay_chinh_thuc?.message}
            />
            <Input
              label={txt('employee.form.resignationDate')}
              type="date"
              required={isResigned}
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ngay_nghi_viec)}
              {...register('ngay_nghi_viec')}
              error={errors.ngay_nghi_viec?.message}
            />
            <Controller
              name="ly_do_nghi"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={txt('employee.form.resignationReason')}
                  icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ly_do_nghi)}
                  options={resignationReasonOptions}
                  value={field.value ?? ''}
                  onChange={(val) => field.onChange(val === '' ? null : String(val))}
                  placeholder={txt('employee.form.resignationReasonPlaceholder')}
                  searchable={false}
                  error={errors.ly_do_nghi?.message}
                />
              )}
            />
            <input type="hidden" {...register('phong_ban_id')} />
          </FormGrid>
        </FormSection>

        <FormSection title={txt('employee.form.identityInfo')} icon={<IdCard size={ICON_SIZE.compact} />}>
          <FormGrid cols={2}>
            <Input
              label={txt('employee.form.idCard')}
              placeholder={txt('employee.form.idCardPlaceholder')}
              hint={txt('employee.form.idCardHint')}
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.so_cccd)}
              {...register('so_cccd')}
              error={errors.so_cccd?.message}
            />
            <Input
              label={txt('employee.form.idIssueDate')}
              type="date"
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ngay_cap_cccd)}
              {...register('ngay_cap_cccd')}
              error={errors.ngay_cap_cccd?.message}
            />
            <Input
              label={txt('employee.form.idIssuePlace')}
              placeholder={txt('employee.form.idIssuePlaceholder')}
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.noi_cap_cccd)}
              {...register('noi_cap_cccd')}
              error={errors.noi_cap_cccd?.message}
            />
            <div className="col-span-full">
              <Input
                label={txt('employee.form.permanentAddress')}
                placeholder={txt('employee.form.permanentAddressPlaceholder')}
                icon={fieldIcon(EMPLOYEE_FIELD_ICONS.dia_chi_thuong_tru)}
                {...register('dia_chi_thuong_tru')}
                error={errors.dia_chi_thuong_tru?.message}
              />
            </div>
            <div className="col-span-full">
              <Input
                label={txt('employee.form.currentAddress')}
                hint={txt('employee.form.currentAddressHint')}
                icon={fieldIcon(EMPLOYEE_FIELD_ICONS.dia_chi_hien_tai)}
                {...register('dia_chi_hien_tai')}
                error={errors.dia_chi_hien_tai?.message}
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title={txt('employee.form.contactInfo')} icon={<Mail size={ICON_SIZE.compact} />}>
          <FormGrid cols={2}>
            <Input
              label={txt('employee.form.workEmail')}
              type="email"
              required={!isApi()}
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.email)}
              {...register('email')}
              error={errors.email?.message}
            />
            <Input
              label={txt('employee.form.personalEmail')}
              type="email"
              placeholder={txt('employee.form.personalEmailPlaceholder')}
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.email_ca_nhan)}
              {...register('email_ca_nhan')}
              error={errors.email_ca_nhan?.message}
            />
            <Input
              label={txt('employee.phone')}
              required={!isApi()}
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.so_dien_thoai)}
              {...register('so_dien_thoai')}
              error={errors.so_dien_thoai?.message}
            />
            <Input
              label={txt('employee.form.emergencyContact')}
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.nguoi_lien_he_khan)}
              {...register('nguoi_lien_he_khan')}
              error={errors.nguoi_lien_he_khan?.message}
            />
            <Input
              label={txt('employee.form.emergencyPhone')}
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.sdt_khan)}
              {...register('sdt_khan')}
              error={errors.sdt_khan?.message}
            />
            <Controller
              name="moi_quan_he"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={txt('employee.form.relationship')}
                  icon={fieldIcon(EMPLOYEE_FIELD_ICONS.moi_quan_he)}
                  options={relationshipOptions}
                  value={field.value ?? ''}
                  onChange={(val) => field.onChange(val === '' ? null : String(val))}
                  placeholder={txt('employee.form.relationshipPlaceholder')}
                  searchable={false}
                  error={errors.moi_quan_he?.message}
                />
              )}
            />
          </FormGrid>
        </FormSection>

        <FormSection title={txt('employee.form.educationInfo')} icon={<GraduationCap size={ICON_SIZE.compact} />}>
          <FormGrid cols={2}>
            <Controller
              name="trinh_do"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={txt('employee.form.educationLevel')}
                  icon={fieldIcon(EMPLOYEE_FIELD_ICONS.trinh_do)}
                  options={educationOptions}
                  value={field.value ?? ''}
                  onChange={(val) => field.onChange(val === '' ? null : String(val))}
                  placeholder={txt('employee.form.educationPlaceholder')}
                  searchable={false}
                  error={errors.trinh_do?.message}
                />
              )}
            />
            <Input
              label={txt('employee.form.major')}
              placeholder={txt('employee.form.majorPlaceholder')}
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.chuyen_nganh)}
              {...register('chuyen_nganh')}
              error={errors.chuyen_nganh?.message}
            />
            <div className="col-span-full">
              <Input
                label={txt('employee.form.school')}
                placeholder={txt('employee.form.schoolPlaceholder')}
                icon={fieldIcon(EMPLOYEE_FIELD_ICONS.truong)}
                {...register('truong')}
                error={errors.truong?.message}
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection title={txt('employee.form.financialInfo')} icon={<Landmark size={ICON_SIZE.compact} />}>
          <FormGrid cols={2}>
            <Input
              label={txt('employee.form.bankAccount')}
              placeholder={txt('employee.form.bankAccountPlaceholder')}
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.so_tai_khoan)}
              {...register('so_tai_khoan')}
              error={errors.so_tai_khoan?.message}
            />
            <Input
              label={txt('employee.form.bankAccountHolder')}
              hint={txt('employee.form.bankAccountHolderHint')}
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ten_chu_tai_khoan)}
              {...register('ten_chu_tai_khoan')}
              error={errors.ten_chu_tai_khoan?.message}
            />
            <Input
              label={txt('employee.form.bankName')}
              placeholder={txt('employee.form.bankNamePlaceholder')}
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ngan_hang)}
              {...register('ngan_hang')}
              error={errors.ngan_hang?.message}
            />
            <Input
              label={txt('employee.form.bankBranch')}
              placeholder={txt('employee.form.bankBranchPlaceholder')}
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.chi_nhanh)}
              {...register('chi_nhanh')}
              error={errors.chi_nhanh?.message}
            />
          </FormGrid>
        </FormSection>

        <FormSection title={txt('employee.form.insuranceInfo')} icon={<Shield size={ICON_SIZE.compact} />}>
          <FormGrid cols={2}>
            <Input
              label={txt('employee.form.socialInsurance')}
              placeholder={txt('employee.form.socialInsurancePlaceholder')}
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.so_so_bhxh)}
              {...register('so_so_bhxh')}
              error={errors.so_so_bhxh?.message}
            />
            <Input
              label={txt('employee.form.healthInsurance')}
              placeholder={txt('employee.form.healthInsurancePlaceholder')}
              hint={txt('employee.form.healthInsuranceHint')}
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.so_bhyt)}
              {...register('so_bhyt')}
              error={errors.so_bhyt?.message}
            />
            <Input
              label={txt('employee.form.taxId')}
              placeholder={txt('employee.form.taxIdPlaceholder')}
              hint={txt('employee.form.taxIdHint')}
              icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ma_so_thue_ca_nhan)}
              {...register('ma_so_thue_ca_nhan')}
              error={errors.ma_so_thue_ca_nhan?.message}
            />
          </FormGrid>
        </FormSection>

        {!isEdit && (
          <FormSection title={txt('employee.form.authAccount')} icon={<KeyRound size={ICON_SIZE.compact} />}>
            <FormGrid cols={2}>
              <Input
                label={txt('employee.form.loginName')}
                required
                icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ten_dang_nhap)}
                {...register('ten_dang_nhap' as keyof EmployeeCreateFormValues)}
                error={(errors as { ten_dang_nhap?: { message?: string } }).ten_dang_nhap?.message}
              />
              {isCheckingLoginName && !(errors as { ten_dang_nhap?: { message?: string } }).ten_dang_nhap && (
                <p className="text-xs text-muted-foreground -mt-2 col-span-2">
                  {txt('employee.validation.loginNameChecking')}
                </p>
              )}
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

        {isEdit && initialData?.ten_dang_nhap && (
          <FormSection title={txt('employee.form.authAccount')} icon={<KeyRound size={ICON_SIZE.compact} />}>
            <div className="space-y-3">
              <FormGrid cols={2}>
                <Input
                  label={txt('employee.form.loginName')}
                  icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ten_dang_nhap)}
                  {...register('ten_dang_nhap' as keyof EmployeeEditFormValues)}
                  error={(errors as { ten_dang_nhap?: { message?: string } }).ten_dang_nhap?.message}
                />
                {isCheckingLoginName && !(errors as { ten_dang_nhap?: { message?: string } }).ten_dang_nhap && (
                  <p className="text-xs text-muted-foreground -mt-2 col-span-2">
                    {txt('employee.validation.loginNameChecking')}
                  </p>
                )}
                {isLoginChanged && (
                  <Input
                    label={txt('employee.form.tempPassword')}
                    type="password"
                    required
                    icon={fieldIcon(EMPLOYEE_FIELD_ICONS.mat_khau_tam)}
                    {...register('mat_khau_tam' as keyof EmployeeEditFormValues)}
                    error={(errors as { mat_khau_tam?: { message?: string } }).mat_khau_tam?.message}
                  />
                )}
              </FormGrid>
              {isLoginChanged && (
                <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
                  {txt('employee.form.loginChangeWarning')}
                </p>
              )}
              {!isLoginChanged && (
                <>
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
                </>
              )}
            </div>
          </FormSection>
        )}

        {isEdit && initialData && !initialData.ten_dang_nhap && (
          <FormSection title={txt('employee.form.authAccount')} icon={<KeyRound size={ICON_SIZE.compact} />}>
            <p className="text-xs text-muted-foreground mb-3">{txt('employee.form.createAuthOnEditHint')}</p>
            <FormGrid cols={2}>
              <Input
                label={txt('employee.form.loginName')}
                icon={fieldIcon(EMPLOYEE_FIELD_ICONS.ten_dang_nhap)}
                {...register('ten_dang_nhap' as keyof EmployeeEditFormValues)}
                error={(errors as { ten_dang_nhap?: { message?: string } }).ten_dang_nhap?.message}
              />
              {isCheckingLoginName && !(errors as { ten_dang_nhap?: { message?: string } }).ten_dang_nhap && (
                <p className="text-xs text-muted-foreground -mt-2 col-span-2">
                  {txt('employee.validation.loginNameChecking')}
                </p>
              )}
              <Input
                label={txt('employee.form.tempPassword')}
                type="password"
                icon={fieldIcon(EMPLOYEE_FIELD_ICONS.mat_khau_tam)}
                {...register('mat_khau_tam' as keyof EmployeeEditFormValues)}
                error={(errors as { mat_khau_tam?: { message?: string } }).mat_khau_tam?.message}
              />
            </FormGrid>
          </FormSection>
        )}
      </form>
    </GenericDrawer>
  );
};

export default EmployeeForm;
