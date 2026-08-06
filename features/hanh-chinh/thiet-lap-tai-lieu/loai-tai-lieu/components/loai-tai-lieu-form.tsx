import { useEffect } from 'react';
import { useForm, type Resolver, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { FolderCog } from 'lucide-react';
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
import { loaiTaiLieuSchema, type LoaiTaiLieuFormValues } from '../core/schema';
import { LOAI_TAI_LIEU_FIELD_DATA_TYPE } from '../core/loai-tai-lieu-field-meta';
import type { LoaiTaiLieu } from '../core/types';
import { useCreateLoaiTaiLieu, useUpdateLoaiTaiLieu, useLoaiTaiLieu } from '../hooks/use-loai-tai-lieu';
import { fieldIcon } from '@/lib/field-icon';
import { LOAI_TAI_LIEU_FIELD_ICONS } from '../core/loai-tai-lieu-field-icons';

const FORM_ID = 'loai-tai-lieu-form';

const DEFAULT_VALUES: LoaiTaiLieuFormValues = {
  thu_tu: 0,
  ten_loai_tai_lieu: '',
  mo_ta: null,
};

interface Props {
  initialData: LoaiTaiLieu | null;
  /** `duplicate`: tạo mới điền sẵn từ `initialData` (thứ tự lấy giá trị kế tiếp). */
  mode?: FormMode;
  onClose: () => void;
  onCreated?: (created: LoaiTaiLieu) => void;
  stackLevel?: number;
}

const LoaiTaiLieuForm: React.FC<Props> = ({
  initialData,
  mode,
  onClose,
  onCreated,
  stackLevel = 0,
}) => {
  const isDuplicate = mode === 'duplicate';
  const isEdit = !!initialData && !isDuplicate;
  const canCreate = useCan('create', 'documentSettings');
  const canEditRecord = useCanOnRecord('edit', 'documentSettings', {
    nguoi_tao: initialData?.nguoi_tao,
  });
  const canSave = isEdit ? canEditRecord : canCreate;
  const { data: items = [] } = useLoaiTaiLieu();

  useEffect(() => {
    if (!canSave) {
      toast.error(txt('shared.error.forbidden'));
      onClose();
    }
  }, [canSave, onClose]);

  const createMutation = useCreateLoaiTaiLieu((created) => {
    onCreated?.(created);
    onClose();
  });
  const updateMutation = useUpdateLoaiTaiLieu(onClose);

  const { control, handleSubmit, reset } = useForm<LoaiTaiLieuFormValues>({
    resolver: zodResolver(loaiTaiLieuSchema) as Resolver<LoaiTaiLieuFormValues>,
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    const nextThuTu =
      items.length > 0 ? Math.max(...items.map((p) => p.thu_tu ?? 0)) + 1 : 1;
    if (initialData) {
      reset({
        thu_tu: initialData.thu_tu,
        ten_loai_tai_lieu: initialData.ten_loai_tai_lieu,
        mo_ta: initialData.mo_ta,
        // Sao chép: thứ tự lấy giá trị kế tiếp để tránh trùng.
        ...(isDuplicate && { thu_tu: nextThuTu }),
      });
    } else {
      reset({ ...DEFAULT_VALUES, thu_tu: nextThuTu });
    }
  }, [initialData, isDuplicate, items, reset]);

  const onSubmit: SubmitHandler<LoaiTaiLieuFormValues> = (values) => {
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
          ? txt('documentSettings.loai.form.editTitle')
          : txt('documentSettings.loai.form.createTitle')
      }
      subtitle={
        isEdit
          ? txt('documentSettings.loai.form.editSubtitle')
          : txt('documentSettings.loai.form.createSubtitle')
      }
      icon={<FolderCog size={ICON_SIZE.prominent} />}
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
          createIcon={<FolderCog className="w-3.5 h-3.5 mr-1.5 shrink-0" />}
        />
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection
          title={txt('documentSettings.loai.form.generalInfo')}
          icon={<FolderCog size={ICON_SIZE.compact} />}
        >
          <FormGrid>
            <RhfDataField
              control={control}
              name="thu_tu"
              icon={fieldIcon(LOAI_TAI_LIEU_FIELD_ICONS.thu_tu)}
              dataType={LOAI_TAI_LIEU_FIELD_DATA_TYPE.thu_tu}
              label={txt('documentSettings.loai.form.order')}
              required
            />
            <RhfDataField
              control={control}
              name="ten_loai_tai_lieu"
              icon={fieldIcon(LOAI_TAI_LIEU_FIELD_ICONS.ten_loai_tai_lieu)}
              dataType={LOAI_TAI_LIEU_FIELD_DATA_TYPE.ten_loai_tai_lieu}
              label={txt('documentSettings.loai.form.name')}
              placeholder={txt('documentSettings.loai.form.namePlaceholder')}
              required
            />
            <div className="sm:col-span-2">
              <RhfDataField
                control={control}
                name="mo_ta"
              icon={fieldIcon(LOAI_TAI_LIEU_FIELD_ICONS.mo_ta)}
                dataType={LOAI_TAI_LIEU_FIELD_DATA_TYPE.mo_ta}
                label={txt('documentSettings.loai.form.description')}
              />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default LoaiTaiLieuForm;
