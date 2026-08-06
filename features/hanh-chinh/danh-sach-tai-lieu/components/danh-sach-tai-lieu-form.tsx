import { useEffect, useMemo } from 'react';
import { useForm, type Resolver, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Files, FileText, Shield } from 'lucide-react';
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
import { listQueryOptions, masterDataQueryOptions } from '@/lib/query/query-config';
import { queryKeys } from '@/lib/query-keys';
import { getActivePositions } from '@/features/he-thong/chuc-vu/services/chuc-vu-service';
import { getEmployees } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import { useLoaiTaiLieu } from '@/features/hanh-chinh/thiet-lap-tai-lieu/loai-tai-lieu/hooks/use-loai-tai-lieu';
import { danhSachTaiLieuSchema, type DanhSachTaiLieuFormValues } from '../core/schema';
import { DANH_SACH_TAI_LIEU_FIELD_DATA_TYPE } from '../core/danh-sach-tai-lieu-field-meta';
import { DOCUMENT_STATUS, DOCUMENT_STATUS_OPTIONS } from '../core/types';
import type { DanhSachTaiLieu } from '../core/types';
import {
  useCreateDanhSachTaiLieu,
  useUpdateDanhSachTaiLieu,
} from '../hooks/use-danh-sach-tai-lieu';
import { fieldIcon } from '@/lib/field-icon';
import { DANH_SACH_TAI_LIEU_FIELD_ICONS } from '../core/danh-sach-tai-lieu-field-icons';

const FORM_ID = 'danh-sach-tai-lieu-form';

const DEFAULT_VALUES: DanhSachTaiLieuFormValues = {
  id_loai_tai_lieu: '',
  ten_tai_lieu: '',
  mo_ta: null,
  link_tai_lieu: null,
  ghi_chu: null,
  trang_thai: DOCUMENT_STATUS.DU_THAO,
  id_chuc_vu: [],
  id_nhan_vien: [],
};

interface Props {
  initialData: DanhSachTaiLieu | null;
  /** `duplicate`: tạo mới điền sẵn từ `initialData` (reset trạng thái, link tài liệu). */
  mode?: FormMode;
  onClose: () => void;
  stackLevel?: number;
}

const DanhSachTaiLieuForm: React.FC<Props> = ({
  initialData,
  mode,
  onClose,
  stackLevel = 0,
}) => {
  const isDuplicate = mode === 'duplicate';
  const isEdit = !!initialData && !isDuplicate;
  const canCreate = useCan('create', 'documentList');
  const canEditRecord = useCanOnRecord('edit', 'documentList', {
    nguoi_tao: initialData?.nguoi_tao,
  });
  const canSave = isEdit ? canEditRecord : canCreate;

  useEffect(() => {
    if (!canSave) {
      toast.error(txt('shared.error.forbidden'));
      onClose();
    }
  }, [canSave, onClose]);

  const createMutation = useCreateDanhSachTaiLieu(onClose);
  const updateMutation = useUpdateDanhSachTaiLieu(onClose);

  const { data: types = [] } = useLoaiTaiLieu();
  const { data: positions = [] } = useQuery({
    queryKey: queryKeys.positions.active,
    queryFn: getActivePositions,
    ...masterDataQueryOptions,
  });
  const { data: employees = [] } = useQuery({
    queryKey: [...queryKeys.employees.all, 'picker'] as const,
    queryFn: () => getEmployees({ limit: 500, offset: 0 }),
    ...listQueryOptions,
  });

  const typeOptions = useMemo(
    () => types.map((t) => ({ value: t.id, label: t.ten_loai_tai_lieu })),
    [types],
  );
  const positionOptions = useMemo(
    () => positions.map((p) => ({ value: p.id, label: p.ten_chuc_vu })),
    [positions],
  );
  const employeeOptions = useMemo(
    () => employees.map((e) => ({ value: e.id, label: e.ho_ten })),
    [employees],
  );

  const { control, handleSubmit, reset } = useForm<DanhSachTaiLieuFormValues>({
    resolver: zodResolver(danhSachTaiLieuSchema) as Resolver<DanhSachTaiLieuFormValues>,
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        id_loai_tai_lieu: initialData.id_loai_tai_lieu,
        ten_tai_lieu: initialData.ten_tai_lieu,
        mo_ta: initialData.mo_ta,
        link_tai_lieu: initialData.link_tai_lieu,
        ghi_chu: initialData.ghi_chu,
        trang_thai: (initialData.trang_thai as DanhSachTaiLieuFormValues['trang_thai']) ||
          DOCUMENT_STATUS.DU_THAO,
        id_chuc_vu: initialData.id_chuc_vu ?? [],
        id_nhan_vien: initialData.id_nhan_vien ?? [],
        // Sao chép: trạng thái về mặc định, không copy link file tài liệu.
        ...(isDuplicate && {
          trang_thai: DEFAULT_VALUES.trang_thai,
          link_tai_lieu: DEFAULT_VALUES.link_tai_lieu,
        }),
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, isDuplicate, reset]);

  const onSubmit: SubmitHandler<DanhSachTaiLieuFormValues> = (values) => {
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
        isEdit ? txt('document.form.editTitle') : txt('document.form.createTitle')
      }
      subtitle={
        isEdit
          ? txt('document.form.editSubtitle')
          : txt('document.form.createSubtitle')
      }
      icon={<Files size={ICON_SIZE.prominent} />}
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
          createIcon={<Files className="w-3.5 h-3.5 mr-1.5 shrink-0" />}
        />
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection
          title={txt('document.form.generalInfo')}
          icon={<FileText size={ICON_SIZE.compact} />}
        >
          <FormGrid>
            <RhfDataField
              control={control}
              name="id_loai_tai_lieu"
              icon={fieldIcon(DANH_SACH_TAI_LIEU_FIELD_ICONS.id_loai_tai_lieu)}
              dataType={DANH_SACH_TAI_LIEU_FIELD_DATA_TYPE.id_loai_tai_lieu}
              label={txt('document.form.type')}
              placeholder={txt('document.form.typePlaceholder')}
              options={typeOptions}
              required
            />
            <RhfDataField
              control={control}
              name="trang_thai"
              icon={fieldIcon(DANH_SACH_TAI_LIEU_FIELD_ICONS.trang_thai)}
              dataType={DANH_SACH_TAI_LIEU_FIELD_DATA_TYPE.trang_thai}
              label={txt('document.form.status')}
              options={DOCUMENT_STATUS_OPTIONS}
              required
            />
            <div className="sm:col-span-2">
              <RhfDataField
                control={control}
                name="ten_tai_lieu"
              icon={fieldIcon(DANH_SACH_TAI_LIEU_FIELD_ICONS.ten_tai_lieu)}
                dataType={DANH_SACH_TAI_LIEU_FIELD_DATA_TYPE.ten_tai_lieu}
                label={txt('document.form.name')}
                placeholder={txt('document.form.namePlaceholder')}
                required
              />
            </div>
            <div className="sm:col-span-2">
              <RhfDataField
                control={control}
                name="link_tai_lieu"
              icon={fieldIcon(DANH_SACH_TAI_LIEU_FIELD_ICONS.link_tai_lieu)}
                dataType={DANH_SACH_TAI_LIEU_FIELD_DATA_TYPE.link_tai_lieu}
                label={txt('document.form.link')}
                placeholder={txt('document.form.linkPlaceholder')}
              />
            </div>
            <div className="sm:col-span-2">
              <RhfDataField
                control={control}
                name="mo_ta"
              icon={fieldIcon(DANH_SACH_TAI_LIEU_FIELD_ICONS.mo_ta)}
                dataType={DANH_SACH_TAI_LIEU_FIELD_DATA_TYPE.mo_ta}
                label={txt('document.form.description')}
              />
            </div>
            <div className="sm:col-span-2">
              <RhfDataField
                control={control}
                name="ghi_chu"
              icon={fieldIcon(DANH_SACH_TAI_LIEU_FIELD_ICONS.ghi_chu)}
                dataType={DANH_SACH_TAI_LIEU_FIELD_DATA_TYPE.ghi_chu}
                label={txt('document.form.note')}
                hint={txt('document.form.noteHint')}
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection
          title={txt('document.form.accessInfo')}
          icon={<Shield size={ICON_SIZE.compact} />}
        >
          <FormGrid>
            <div className="sm:col-span-2">
              <RhfDataField
                control={control}
                name="id_chuc_vu"
              icon={fieldIcon(DANH_SACH_TAI_LIEU_FIELD_ICONS.id_chuc_vu)}
                dataType={DANH_SACH_TAI_LIEU_FIELD_DATA_TYPE.id_chuc_vu}
                label={txt('document.form.positions')}
                placeholder={txt('document.form.positionsPlaceholder')}
                options={positionOptions}
              />
            </div>
            <div className="sm:col-span-2">
              <RhfDataField
                control={control}
                name="id_nhan_vien"
              icon={fieldIcon(DANH_SACH_TAI_LIEU_FIELD_ICONS.id_nhan_vien)}
                dataType={DANH_SACH_TAI_LIEU_FIELD_DATA_TYPE.id_nhan_vien}
                label={txt('document.form.employees')}
                placeholder={txt('document.form.employeesPlaceholder')}
                options={employeeOptions}
              />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default DanhSachTaiLieuForm;
