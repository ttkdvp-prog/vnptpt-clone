import { useEffect, useMemo } from 'react';
import { Controller, useForm, type Resolver, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Clock, FileText, ImageIcon } from 'lucide-react';
import { txt } from '@/lib/text';
import { ICON_SIZE } from '@/lib/icon-sizes';
import {
  FormGrid,
  FormSection,
  GenericDrawer,
  RhfDataField,
} from '@/components/views';
import FormDrawerFooter from '@/components/shared/FormDrawerFooter';
import MultiImageInput, { type ImageItem } from '@/components/ui/MultiImageInput';
import { getDrawerWidthClass } from '@/lib/dialog-sizes';
import type { FormMode } from '@/lib/last-view-flow';
import { CLOUDINARY_FOLDERS } from '@/lib/media/cloudinary-folders';
import { useCan } from '@/hooks/use-can';
import { useCanOnRecord } from '@/hooks/use-can-on-record';
import { listQueryOptions } from '@/lib/query/query-config';
import { queryKeys } from '@/lib/query-keys';
import { getEmployees } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import { loaiPhieuSelectOptions } from '../core/loai-phieu';
import { phieuHanhChinhSchema, type PhieuHanhChinhFormValues } from '../core/schema';
import { PHIEU_HANH_CHINH_FIELD_DATA_TYPE } from '../core/phieu-hanh-chinh-field-meta';
import { PHIEU_BUOI, PHIEU_BUOI_OPTIONS, type PhieuHanhChinh } from '../core/types';
import {
  useCreatePhieuHanhChinh,
  useUpdatePhieuHanhChinh,
} from '../hooks/use-phieu-hanh-chinh';
import { useCanManageLockedPhieuHanhChinh } from '../hooks/use-phieu-hanh-chinh-privileged';
import { canEditPhieu } from '../utils/approve-workflow';
import { fieldIcon } from '@/lib/field-icon';
import { PHIEU_HANH_CHINH_FIELD_ICONS } from '../core/phieu-hanh-chinh-field-icons';

const FORM_ID = 'phieu-hanh-chinh-form';

const DEFAULT_VALUES: PhieuHanhChinhFormValues = {
  ma_phieu: 'XN',
  id_nhan_vien: '',
  tu_ngay: '',
  buoi_bat_dau: PHIEU_BUOI.SANG,
  den_ngay: '',
  buoi_ket_thuc: PHIEU_BUOI.CHIEU,
  gio_bat_dau: null,
  gio_ket_thuc: null,
  ly_do: null,
  hinh_anh: [],
};

function urlsToImageItems(urls: string[]): ImageItem[] {
  return urls.map((src, index) => ({ id: `img-${index}-${src.slice(-12)}`, src }));
}

interface Props {
  initialData: PhieuHanhChinh | null;
  /** `duplicate`: tạo mới điền sẵn từ `initialData` (không copy hình ảnh). */
  mode?: FormMode;
  onClose: () => void;
  stackLevel?: number;
}

const PhieuHanhChinhForm: React.FC<Props> = ({
  initialData,
  mode,
  onClose,
  stackLevel = 0,
}) => {
  const isDuplicate = mode === 'duplicate';
  const isEdit = !!initialData && !isDuplicate;
  const canCreate = useCan('create', 'adminForms');
  const canEditRecord = useCanOnRecord('edit', 'adminForms', {
    nguoi_tao: initialData?.nguoi_tao,
  });
  const canManageLocked = useCanManageLockedPhieuHanhChinh();
  const canSave =
    isEdit
      ? canEditRecord &&
        canEditPhieu(initialData?.trang_thai ?? '', canManageLocked)
      : canCreate;

  useEffect(() => {
    if (!canSave) {
      toast.error(txt('shared.error.forbidden'));
      onClose();
    }
  }, [canSave, onClose]);

  const createMutation = useCreatePhieuHanhChinh(onClose);
  const updateMutation = useUpdatePhieuHanhChinh(onClose);

  const { data: employees = [] } = useQuery({
    queryKey: [...queryKeys.employees.all, 'picker'] as const,
    queryFn: () => getEmployees({ limit: 100, offset: 0 }),
    ...listQueryOptions,
  });

  const typeOptions = useMemo(() => loaiPhieuSelectOptions(), []);
  const employeeOptions = useMemo(
    () => employees.map((e) => ({ value: e.id, label: e.ho_ten })),
    [employees],
  );

  const { control, handleSubmit, reset } = useForm<PhieuHanhChinhFormValues>({
    resolver: zodResolver(phieuHanhChinhSchema) as Resolver<PhieuHanhChinhFormValues>,
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ma_phieu: initialData.ma_phieu as PhieuHanhChinhFormValues['ma_phieu'],
        id_nhan_vien: initialData.id_nhan_vien,
        tu_ngay: initialData.tu_ngay,
        buoi_bat_dau: initialData.buoi_bat_dau as PhieuHanhChinhFormValues['buoi_bat_dau'],
        den_ngay: initialData.den_ngay,
        buoi_ket_thuc: initialData.buoi_ket_thuc as PhieuHanhChinhFormValues['buoi_ket_thuc'],
        gio_bat_dau: initialData.gio_bat_dau,
        gio_ket_thuc: initialData.gio_ket_thuc,
        ly_do: initialData.ly_do,
        hinh_anh: initialData.hinh_anh ?? [],
        // Sao chép: không copy hình ảnh đính kèm, phiếu mới đính kèm lại từ đầu.
        ...(isDuplicate && {
          hinh_anh: DEFAULT_VALUES.hinh_anh,
        }),
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, isDuplicate, reset]);

  const onSubmit: SubmitHandler<PhieuHanhChinhFormValues> = (values) => {
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? txt('adminForm.form.editTitle') : txt('adminForm.form.createTitle')}
      subtitle={
        isEdit ? txt('adminForm.form.editSubtitle') : txt('adminForm.form.createSubtitle')
      }
      icon={<FileText size={ICON_SIZE.prominent} />}
      onClose={onClose}
      maxWidthClass={getDrawerWidthClass(stackLevel)}
      stackLevel={stackLevel}
      footerCompact
      footer={
        <FormDrawerFooter
          formId={FORM_ID}
          onCancel={onClose}
          isLoading={isLoading}
          isEdit={isEdit}
          compact
          createIcon={<FileText className="w-3.5 h-3.5 mr-1.5 shrink-0" />}
        />
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection
          title={txt('adminForm.form.generalInfo')}
          icon={<FileText size={ICON_SIZE.compact} />}
        >
          <FormGrid>
            <RhfDataField
              control={control}
              name="ma_phieu"
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.ma_phieu)}
              dataType={PHIEU_HANH_CHINH_FIELD_DATA_TYPE.ma_phieu}
              label={txt('adminForm.form.type')}
              placeholder={txt('adminForm.form.typePlaceholder')}
              options={typeOptions}
              required
            />
            <RhfDataField
              control={control}
              name="id_nhan_vien"
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.id_nhan_vien)}
              dataType={PHIEU_HANH_CHINH_FIELD_DATA_TYPE.id_nhan_vien}
              label={txt('adminForm.form.employee')}
              placeholder={txt('adminForm.form.employeePlaceholder')}
              options={employeeOptions}
              required
            />
            <div className="sm:col-span-2">
              <RhfDataField
                control={control}
                name="ly_do"
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.ly_do)}
                dataType={PHIEU_HANH_CHINH_FIELD_DATA_TYPE.ly_do}
                label={txt('adminForm.form.reason')}
                placeholder={txt('adminForm.form.reasonPlaceholder')}
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection
          title={txt('adminForm.form.timeInfo')}
          icon={<Clock size={ICON_SIZE.compact} />}
        >
          <FormGrid>
            <RhfDataField
              control={control}
              name="tu_ngay"
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.tu_ngay)}
              dataType={PHIEU_HANH_CHINH_FIELD_DATA_TYPE.tu_ngay}
              label={txt('adminForm.form.fromDate')}
              required
            />
            <RhfDataField
              control={control}
              name="buoi_bat_dau"
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.buoi_bat_dau)}
              dataType={PHIEU_HANH_CHINH_FIELD_DATA_TYPE.buoi_bat_dau}
              label={txt('adminForm.form.startShift')}
              options={PHIEU_BUOI_OPTIONS}
              required
            />
            <RhfDataField
              control={control}
              name="den_ngay"
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.den_ngay)}
              dataType={PHIEU_HANH_CHINH_FIELD_DATA_TYPE.den_ngay}
              label={txt('adminForm.form.toDate')}
              required
            />
            <RhfDataField
              control={control}
              name="buoi_ket_thuc"
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.buoi_ket_thuc)}
              dataType={PHIEU_HANH_CHINH_FIELD_DATA_TYPE.buoi_ket_thuc}
              label={txt('adminForm.form.endShift')}
              options={PHIEU_BUOI_OPTIONS}
              required
            />
            <RhfDataField
              control={control}
              name="gio_bat_dau"
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.gio_bat_dau)}
              dataType={PHIEU_HANH_CHINH_FIELD_DATA_TYPE.gio_bat_dau}
              label={txt('adminForm.form.startTime')}
            />
            <RhfDataField
              control={control}
              name="gio_ket_thuc"
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.gio_ket_thuc)}
              dataType={PHIEU_HANH_CHINH_FIELD_DATA_TYPE.gio_ket_thuc}
              label={txt('adminForm.form.endTime')}
            />
          </FormGrid>
        </FormSection>

        <FormSection
          title={txt('adminForm.form.attachmentInfo')}
          icon={<ImageIcon size={ICON_SIZE.compact} />}
        >
          <Controller
            control={control}
            name="hinh_anh"
            render={({ field, fieldState }) => (
              <MultiImageInput
                label={txt('adminForm.form.images')}
                icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.hinh_anh)}
                value={urlsToImageItems(field.value ?? [])}
                onChange={(items) => field.onChange(items.map((i) => i.src))}
                error={fieldState.error?.message}
                uploadContext={{ folder: CLOUDINARY_FOLDERS.adminFormImages }}
                maxFiles={10}
              />
            )}
          />
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default PhieuHanhChinhForm;
