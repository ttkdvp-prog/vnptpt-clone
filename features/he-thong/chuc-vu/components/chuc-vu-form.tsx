import React, { useEffect, useMemo } from 'react';
import { txt } from '@/lib/text';
import { ICON_SIZE } from '@/lib/icon-sizes';
import { useForm, Controller, SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Briefcase } from 'lucide-react';
import { TRANG_THAI_HOAT_DONG } from '@/lib/constants/trang-thai';
import Input from '@/components/ui/Input';
import Combobox from '@/components/ui/Combobox';
import Textarea from '@/components/ui/Textarea';
import StatusToggle from '@/components/ui/StatusToggle';
import { PositionFormValues, positionSchema } from '../core/schema';
import { Position } from '../core/types';
import { POSITION_FIELD_ICONS } from '../core/position-field-icons';
import { useCreatePosition, useUpdatePosition } from '../hooks/use-chuc-vu';
import GenericDrawer from '@/components/shared/GenericDrawer';
import { getDrawerWidthClass } from '@/lib/dialog-sizes';
import type { FormMode } from '@/lib/last-view-flow';
import FormDrawerFooter from '@/components/shared/FormDrawerFooter';
import FormSection from '@/components/shared/FormSection';
import FormGrid from '@/components/shared/FormGrid';
import { useCan } from '@/hooks/use-can';
import { useCanOnRecord } from '@/hooks/use-can-on-record';
import { isApi } from '@/lib/data/config';
import { fieldIcon } from '@/lib/field-icon';
import { toast } from 'sonner';
import { useConfirmDiscardOnClose } from '@/hooks/use-confirm-discard-on-close';

import { useDepartments } from '@/features/he-thong/phong-ban/hooks/use-phong-ban';
import { usePositions } from '../hooks/use-chuc-vu';

const DEFAULT_VALUES: PositionFormValues = {
  ma_chuc_vu: '',
  ten_chuc_vu: '',
  cap_bac: null,
  phong_ban_id: '',
  mo_ta: '',
  thu_tu: 1,
  trang_thai: 'Đang hoạt động',
};

interface Props {
  initialData?: Position | null;
  /** `duplicate`: tạo mới điền sẵn từ `initialData` (reset mã, trạng thái). */
  mode?: FormMode;
  onClose: () => void;
  /** Prefill phòng ban when creating from department row in list */
  defaultPhongBanId?: string | null;
  stackLevel?: number;
}

const PositionForm: React.FC<Props> = ({ initialData, mode, onClose, defaultPhongBanId, stackLevel = 0 }) => {
  const isDuplicate = mode === 'duplicate';
  const isEdit = !!initialData && !isDuplicate;
  const canCreate = useCan('create', 'positions');
  const canEditRecord = useCanOnRecord('edit', 'positions', {
    nguoi_tao: initialData?.nguoi_tao,
  });
  const canSave = isEdit ? canEditRecord : canCreate;

  useEffect(() => {
    if (!canSave) {
      toast.error(txt('shared.error.forbidden'));
      onClose();
    }
  }, [canSave, onClose]);

  const createMutation = useCreatePosition(onClose);
  const updateMutation = useUpdatePosition(onClose);

  const { data: departments = [] } = useDepartments();
  const { data: positions = [] } = usePositions();

  const departmentOptions = useMemo(
    () =>
      departments
        .filter((dept) => dept.trang_thai === 'Đang hoạt động')
        .map((dept) => ({
          label: dept.ten_phong_ban,
          value: dept.id,
          subLabel: dept.ma_phong_ban,
        })),
    [departments]
  );

  const { register, handleSubmit, formState: { errors, isDirty }, reset, control } = useForm<PositionFormValues>({
    resolver: zodResolver(positionSchema) as Resolver<PositionFormValues>,
    defaultValues: DEFAULT_VALUES,
  });
  const attemptClose = useConfirmDiscardOnClose(isDirty, onClose);

  useEffect(() => {
    if (initialData) {
      reset({
        ma_chuc_vu: initialData.ma_chuc_vu,
        ten_chuc_vu: initialData.ten_chuc_vu,
        cap_bac: initialData.cap_bac ?? null,
        phong_ban_id: initialData.phong_ban_id || '',
        mo_ta: initialData.mo_ta || '',
        thu_tu: initialData.thu_tu ?? 0,
        trang_thai: initialData.trang_thai,
        // Sao chép: mã phải nhập lại (unique), trạng thái về mặc định theo ngữ cảnh mới.
        ...(isDuplicate && {
          ma_chuc_vu: DEFAULT_VALUES.ma_chuc_vu,
          trang_thai: DEFAULT_VALUES.trang_thai,
        }),
      });
    } else {
      const nextThuTu = positions.length
        ? Math.max(...positions.map((p) => p.thu_tu ?? 0)) + 1
        : 1;
      reset({ ...DEFAULT_VALUES, thu_tu: nextThuTu, phong_ban_id: defaultPhongBanId ?? '' });
    }
  }, [initialData, isDuplicate, positions, reset, defaultPhongBanId]);

  const onSubmit: SubmitHandler<PositionFormValues> = (data) => {
    const sanitizedData = {
        ...data,
        cap_bac: data.cap_bac ?? null,
        phong_ban_id: data.phong_ban_id || null,
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
        title={isEdit ? txt('position.form.editTitle') : txt('position.form.createTitle')}
        subtitle={
          isEdit && initialData
            ? `${txt('position.form.editSubtitle')} · ${initialData.ma_chuc_vu}`
            : txt('position.form.createSubtitle')
        }
        icon={<Briefcase size={ICON_SIZE.prominent} />}
        onClose={attemptClose}
        footer={
          <FormDrawerFooter
            formId="pos-form"
            onCancel={attemptClose}
            isLoading={isLoading}
            isEdit={isEdit}
            compact
            createIcon={<Briefcase className="w-3.5 h-3.5 mr-1.5 shrink-0" />}
          />
        }
        footerCompact
        maxWidthClass={getDrawerWidthClass(stackLevel)}
        stackLevel={stackLevel}
    >
          <form id="pos-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormSection
              title={txt('position.detail.basicInfo')}
              icon={<Briefcase size={ICON_SIZE.compact} />}
              variant="primary"
            >
              <FormGrid cols={3}>
                <div className="sm:col-span-1">
                  <Controller
                    name="ma_chuc_vu"
                    control={control}
                    render={({ field }) => (
                      <Input
                        label={txt('position.form.code')}
                        placeholder={txt('position.form.codePlaceholder')}
              hint={txt('position.form.codeHint')}
                        icon={fieldIcon(POSITION_FIELD_ICONS.ma_chuc_vu)}
                        required
                        value={field.value}
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                        onBlur={field.onBlur}
                        error={errors.ma_chuc_vu?.message}
                      />
                    )}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label={txt('position.form.name')}
                    placeholder={txt('position.form.namePlaceholder')}
                    icon={fieldIcon(POSITION_FIELD_ICONS.ten_chuc_vu)}
                    required
                    {...register('ten_chuc_vu')}
                    error={errors.ten_chuc_vu?.message}
                  />
                </div>
                <Input
                  label={txt('position.form.level')}
                  type="number"
                  min={0}
                  max={32767}
                  hint={txt('position.form.levelHint')}
                  icon={fieldIcon(POSITION_FIELD_ICONS.cap_bac)}
                  {...register('cap_bac', {
                    setValueAs: (v) =>
                      v === '' || v == null ? null : Number(v),
                  })}
                  error={errors.cap_bac?.message}
                />
                <Controller
                  name="phong_ban_id"
                  control={control}
                  render={({ field }) => (
                    <Combobox
                      label={txt('position.form.department')}
                      options={departmentOptions}
                      value={field.value}
                      onChange={field.onChange}
                      placeholder={txt('position.form.departmentPlaceholder')}
                      error={errors.phong_ban_id?.message}
                      icon={fieldIcon(POSITION_FIELD_ICONS.phong_ban_id)}
                    />
                  )}
                />
                {!isApi() && (
                  <div className="col-span-1 sm:col-span-3">
                    <Textarea
                      label={txt('position.form.description')}
                      placeholder={txt('position.form.descriptionPlaceholder')}
                      icon={fieldIcon(POSITION_FIELD_ICONS.mo_ta)}
                      rows={3}
                      className="resize-y min-h-[80px]"
                      {...register('mo_ta')}
                      error={errors.mo_ta?.message}
                    />
                  </div>
                )}
                {!isApi() && (
                  <div className="sm:col-span-1">
                    <Input
                      label={txt('position.detail.order')}
                      type="number"
                      min={0}
                      icon={fieldIcon(POSITION_FIELD_ICONS.thu_tu)}
                      {...register('thu_tu')}
                      error={errors.thu_tu?.message}
                    />
                  </div>
                )}
                {!isApi() && (
                  <div className="col-span-1 sm:col-span-3">
                    <Controller
                      name="trang_thai"
                      control={control}
                      render={({ field }) => (
                        <StatusToggle
                          label={txt('position.form.status')}
                          value={field.value}
                          onChange={field.onChange}
                          icon={fieldIcon(POSITION_FIELD_ICONS.trang_thai)}
                          activeLabel={TRANG_THAI_HOAT_DONG[1]}
                          inactiveLabel={TRANG_THAI_HOAT_DONG[0]}
                          required
                        />
                      )}
                    />
                  </div>
                )}
              </FormGrid>
            </FormSection>
          </form>
    </GenericDrawer>
  );
};

export default PositionForm;
