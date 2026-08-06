import { useEffect, useMemo } from 'react';
import { useForm, type Resolver, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Bell, FileText, Shield } from 'lucide-react';
import { txt } from '@/lib/text';
import { ICON_SIZE } from '@/lib/icon-sizes';
import { FormGrid, FormSection, GenericDrawer, RhfDataField } from '@/components/views';
import FormDrawerFooter from '@/components/shared/FormDrawerFooter';
import { getDrawerWidthClass } from '@/lib/dialog-sizes';
import type { FormMode } from '@/lib/last-view-flow';
import { useCan } from '@/hooks/use-can';
import { useCanOnRecord } from '@/hooks/use-can-on-record';
import { useActivePositions } from '@/features/he-thong/chuc-vu/hooks/use-chuc-vu';
import { thongBaoSchema, type ThongBaoFormValues } from '../core/schema';
import { THONG_BAO_FIELD_DATA_TYPE } from '../core/thong-bao-field-meta';
import type { ThongBao } from '../core/types';
import { useCreateThongBao, useUpdateThongBao } from '../hooks/use-thong-bao';
import { fieldIcon } from '@/lib/field-icon';
import { THONG_BAO_FIELD_ICONS } from '../core/thong-bao-field-icons';

const FORM_ID = 'thong-bao-form';

const DEFAULT_VALUES: ThongBaoFormValues = {
  tg_dang: new Date().toISOString(),
  tieu_de: '',
  noi_dung: '',
  id_chuc_vu: [],
};

interface Props {
  initialData: ThongBao | null;
  /** `duplicate`: tạo mới điền sẵn từ `initialData` (thời gian đăng lấy hiện tại). */
  mode?: FormMode;
  onClose: () => void;
  stackLevel?: number;
}

const ThongBaoForm: React.FC<Props> = ({ initialData, mode, onClose, stackLevel = 0 }) => {
  const isDuplicate = mode === 'duplicate';
  const isEdit = !!initialData && !isDuplicate;
  const canCreate = useCan('create', 'announcements');
  const canEditRecord = useCanOnRecord('edit', 'announcements', {
    nguoi_tao: initialData?.nguoi_tao,
  });
  const canSave = isEdit ? canEditRecord : canCreate;

  useEffect(() => {
    if (!canSave) {
      toast.error(txt('shared.error.forbidden'));
      onClose();
    }
  }, [canSave, onClose]);

  const createMutation = useCreateThongBao(onClose);
  const updateMutation = useUpdateThongBao(onClose);
  const { data: positions = [] } = useActivePositions();

  const positionOptions = useMemo(
    () => positions.map((p) => ({ value: p.id, label: p.ten_chuc_vu })),
    [positions],
  );

  const { control, handleSubmit, reset } = useForm<ThongBaoFormValues>({
    resolver: zodResolver(thongBaoSchema) as Resolver<ThongBaoFormValues>,
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        tg_dang: initialData.tg_dang,
        tieu_de: initialData.tieu_de,
        noi_dung: initialData.noi_dung,
        id_chuc_vu: initialData.id_chuc_vu ?? [],
        // Sao chép: thời gian đăng lấy thời điểm hiện tại cho thông báo mới.
        ...(isDuplicate && { tg_dang: new Date().toISOString() }),
      });
    } else {
      reset({ ...DEFAULT_VALUES, tg_dang: new Date().toISOString() });
    }
  }, [initialData, isDuplicate, reset]);

  const onSubmit: SubmitHandler<ThongBaoFormValues> = (values) => {
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? txt('announcement.form.editTitle') : txt('announcement.form.createTitle')}
      subtitle={
        isEdit ? txt('announcement.form.editSubtitle') : txt('announcement.form.createSubtitle')
      }
      icon={<Bell size={ICON_SIZE.prominent} />}
      onClose={onClose}
      maxWidthClass={getDrawerWidthClass(stackLevel)}
      stackLevel={stackLevel}
      footerCompact
      footer={
        <FormDrawerFooter
          formId={FORM_ID}
          onCancel={onClose}
          isLoading={isPending}
          isEdit={isEdit}
          compact
          createIcon={<Bell className="w-3.5 h-3.5 mr-1.5 shrink-0" />}
        />
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection
          title={txt('announcement.form.generalInfo')}
          icon={<FileText size={ICON_SIZE.compact} />}
        >
          <FormGrid>
            <RhfDataField
              control={control}
              name="tg_dang"
              icon={fieldIcon(THONG_BAO_FIELD_ICONS.tg_dang)}
              dataType={THONG_BAO_FIELD_DATA_TYPE.tg_dang}
              label={txt('announcement.form.datetime')}
              required
            />
            <div className="sm:col-span-2">
              <RhfDataField
                control={control}
                name="tieu_de"
              icon={fieldIcon(THONG_BAO_FIELD_ICONS.tieu_de)}
                dataType={THONG_BAO_FIELD_DATA_TYPE.tieu_de}
                label={txt('announcement.form.title')}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <RhfDataField
                control={control}
                name="noi_dung"
              icon={fieldIcon(THONG_BAO_FIELD_ICONS.noi_dung)}
                dataType={THONG_BAO_FIELD_DATA_TYPE.noi_dung}
                label={txt('announcement.form.content')}
                required
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection
          title={txt('announcement.form.accessInfo')}
          icon={<Shield size={ICON_SIZE.compact} />}
        >
          <FormGrid>
            <div className="sm:col-span-2">
              <RhfDataField
                control={control}
                name="id_chuc_vu"
              icon={fieldIcon(THONG_BAO_FIELD_ICONS.id_chuc_vu)}
                dataType={THONG_BAO_FIELD_DATA_TYPE.id_chuc_vu}
                label={txt('announcement.form.positions')}
                placeholder={txt('announcement.form.positionsPlaceholder')}
                options={positionOptions}
              />
              <p className="mt-1.5 text-xs text-muted-foreground">
                {txt('announcement.form.positionsHint')}
              </p>
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default ThongBaoForm;
