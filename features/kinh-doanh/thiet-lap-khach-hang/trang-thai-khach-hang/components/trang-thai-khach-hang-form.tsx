import { useEffect } from 'react';
import { useForm, type Resolver, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Tag } from 'lucide-react';
import { txt } from '@/lib/text';
import { ICON_SIZE } from '@/lib/icon-sizes';
import {
  FormGrid,
  FormSection,
  GenericDrawer,
  RhfDataField,
} from '@/components/views';
import FormDrawerFooter from '@/components/shared/FormDrawerFooter';
import { getDrawerWidthClass } from '@/lib/dialog-sizes';
import type { FormMode } from '@/lib/last-view-flow';
import { useCan } from '@/hooks/use-can';
import { useCanOnRecord } from '@/hooks/use-can-on-record';
import { trangThaiKhachHangSchema, type TrangThaiKhachHangFormValues } from '../core/schema';
import { TRANG_THAI_KHACH_HANG_FIELD_DATA_TYPE } from '../core/trang-thai-khach-hang-field-meta';
import type { TrangThaiKhachHang } from '../core/types';
import { useCreateTrangThaiKhachHang, useUpdateTrangThaiKhachHang } from '../hooks/use-trang-thai-khach-hang';
import { fieldIcon } from '@/lib/field-icon';
import { TRANG_THAI_KHACH_HANG_FIELD_ICONS } from '../core/trang-thai-khach-hang-field-icons';

const FORM_ID = 'trang-thai-khach-hang-form';

const DEFAULT_VALUES: TrangThaiKhachHangFormValues = {
  ten_trang_thai: '',
  mo_ta: null,
};

interface Props {
  initialData: TrangThaiKhachHang | null;
  /** `duplicate`: tạo mới điền sẵn từ `initialData`. */
  mode?: FormMode;
  onClose: () => void;
  /** Gọi sau khi tạo thành công (trước khi đóng) — dùng để auto-select từ form cha. */
  onCreated?: (created: TrangThaiKhachHang) => void;
  stackLevel?: number;
}

const TrangThaiKhachHangForm: React.FC<Props> = ({
  initialData,
  mode,
  onClose,
  onCreated,
  stackLevel = 0,
}) => {
  const isDuplicate = mode === 'duplicate';
  const isEdit = !!initialData && !isDuplicate;
  const canCreate = useCan('create', 'customerSettings');
  const canEditRecord = useCanOnRecord('edit', 'customerSettings', {
    nguoi_tao: initialData?.nguoi_tao,
  });
  const canSave = isEdit ? canEditRecord : canCreate;

  useEffect(() => {
    if (!canSave) {
      toast.error(txt('shared.error.forbidden'));
      onClose();
    }
  }, [canSave, onClose]);

  const createMutation = useCreateTrangThaiKhachHang((created) => {
    onCreated?.(created);
    onClose();
  });
  const updateMutation = useUpdateTrangThaiKhachHang(onClose);

  const { control, handleSubmit, reset } = useForm<TrangThaiKhachHangFormValues>({
    resolver: zodResolver(trangThaiKhachHangSchema) as Resolver<TrangThaiKhachHangFormValues>,
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ten_trang_thai: initialData.ten_trang_thai,
        mo_ta: initialData.mo_ta,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<TrangThaiKhachHangFormValues> = (values) => {
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={
        isEdit
          ? txt('customerSettings.trangThai.form.editTitle')
          : txt('customerSettings.trangThai.form.createTitle')
      }
      subtitle={
        isEdit
          ? txt('customerSettings.trangThai.form.editSubtitle')
          : txt('customerSettings.trangThai.form.createSubtitle')
      }
      icon={<Tag size={ICON_SIZE.prominent} />}
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
          createIcon={<Tag className="w-3.5 h-3.5 mr-1.5 shrink-0" />}
        />
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection
          title={txt('customerSettings.trangThai.form.generalInfo')}
          icon={<Tag size={ICON_SIZE.compact} />}
        >
          <FormGrid>
            <RhfDataField
              control={control}
              name="ten_trang_thai"
              icon={fieldIcon(TRANG_THAI_KHACH_HANG_FIELD_ICONS.ten_trang_thai)}
              dataType={TRANG_THAI_KHACH_HANG_FIELD_DATA_TYPE.ten_trang_thai}
              label={txt('customerSettings.trangThai.form.name')}
              placeholder={txt('customerSettings.trangThai.form.namePlaceholder')}
              required
            />
            <div className="sm:col-span-2">
              <RhfDataField
                control={control}
                name="mo_ta"
              icon={fieldIcon(TRANG_THAI_KHACH_HANG_FIELD_ICONS.mo_ta)}
                dataType={TRANG_THAI_KHACH_HANG_FIELD_DATA_TYPE.mo_ta}
                label={txt('customerSettings.trangThai.form.description')}
              />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default TrangThaiKhachHangForm;
