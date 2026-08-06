import { useEffect } from 'react';
import { useForm, type Resolver, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { UsersRound } from 'lucide-react';
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
import { nhomKhachHangSchema, type NhomKhachHangFormValues } from '../core/schema';
import { NHOM_KHACH_HANG_FIELD_DATA_TYPE } from '../core/nhom-khach-hang-field-meta';
import type { NhomKhachHang } from '../core/types';
import { useCreateNhomKhachHang, useUpdateNhomKhachHang } from '../hooks/use-nhom-khach-hang';
import { fieldIcon } from '@/lib/field-icon';
import { NHOM_KHACH_HANG_FIELD_ICONS } from '../core/nhom-khach-hang-field-icons';

const FORM_ID = 'nhom-khach-hang-form';

const DEFAULT_VALUES: NhomKhachHangFormValues = {
  ten_nhom: '',
  mo_ta: null,
};

interface Props {
  initialData: NhomKhachHang | null;
  /** `duplicate`: tạo mới điền sẵn từ `initialData`. */
  mode?: FormMode;
  onClose: () => void;
  /** Gọi sau khi tạo thành công (trước khi đóng) — dùng để auto-select từ form cha. */
  onCreated?: (created: NhomKhachHang) => void;
  stackLevel?: number;
}

const NhomKhachHangForm: React.FC<Props> = ({
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

  const createMutation = useCreateNhomKhachHang((created) => {
    onCreated?.(created);
    onClose();
  });
  const updateMutation = useUpdateNhomKhachHang(onClose);

  const { control, handleSubmit, reset } = useForm<NhomKhachHangFormValues>({
    resolver: zodResolver(nhomKhachHangSchema) as Resolver<NhomKhachHangFormValues>,
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ten_nhom: initialData.ten_nhom,
        mo_ta: initialData.mo_ta,
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, reset]);

  const onSubmit: SubmitHandler<NhomKhachHangFormValues> = (values) => {
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
          ? txt('customerSettings.nhom.form.editTitle')
          : txt('customerSettings.nhom.form.createTitle')
      }
      subtitle={
        isEdit
          ? txt('customerSettings.nhom.form.editSubtitle')
          : txt('customerSettings.nhom.form.createSubtitle')
      }
      icon={<UsersRound size={ICON_SIZE.prominent} />}
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
          createIcon={<UsersRound className="w-3.5 h-3.5 mr-1.5 shrink-0" />}
        />
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection
          title={txt('customerSettings.nhom.form.generalInfo')}
          icon={<UsersRound size={ICON_SIZE.compact} />}
        >
          <FormGrid>
            <RhfDataField
              control={control}
              name="ten_nhom"
              icon={fieldIcon(NHOM_KHACH_HANG_FIELD_ICONS.ten_nhom)}
              dataType={NHOM_KHACH_HANG_FIELD_DATA_TYPE.ten_nhom}
              label={txt('customerSettings.nhom.form.name')}
              placeholder={txt('customerSettings.nhom.form.namePlaceholder')}
              required
            />
            <div className="sm:col-span-2">
              <RhfDataField
                control={control}
                name="mo_ta"
              icon={fieldIcon(NHOM_KHACH_HANG_FIELD_ICONS.mo_ta)}
                dataType={NHOM_KHACH_HANG_FIELD_DATA_TYPE.mo_ta}
                label={txt('customerSettings.nhom.form.description')}
              />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default NhomKhachHangForm;
