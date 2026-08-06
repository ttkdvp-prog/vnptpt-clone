import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useForm, type Resolver, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { FileText, Phone, Users } from 'lucide-react';
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
import { useNhomKhachHang } from '@/features/kinh-doanh/thiet-lap-khach-hang/nhom-khach-hang/hooks/use-nhom-khach-hang';
import { useTrangThaiKhachHang } from '@/features/kinh-doanh/thiet-lap-khach-hang/trang-thai-khach-hang/hooks/use-trang-thai-khach-hang';
import { khachHangSchema, type KhachHangFormValues } from '../core/schema';
import { KHACH_HANG_FIELD_DATA_TYPE } from '../core/khach-hang-field-meta';
import type { KhachHang } from '../core/types';
import {
  useCreateKhachHang,
  useNextMaKhachHang,
  useUpdateKhachHang,
} from '../hooks/use-khach-hang';
import { fieldIcon } from '@/lib/field-icon';
import { KHACH_HANG_FIELD_ICONS } from '../core/khach-hang-field-icons';
import { queryKeys } from '@/lib/query-keys';
import { copyNguoiLienHeToCustomer } from '@/features/kinh-doanh/nguoi-lien-he/services/nguoi-lien-he-service';

const NhomKhachHangForm = lazy(
  () =>
    import(
      '@/features/kinh-doanh/thiet-lap-khach-hang/nhom-khach-hang/components/nhom-khach-hang-form'
    ),
);
const TrangThaiKhachHangForm = lazy(
  () =>
    import(
      '@/features/kinh-doanh/thiet-lap-khach-hang/trang-thai-khach-hang/components/trang-thai-khach-hang-form'
    ),
);

const FORM_ID = 'khach-hang-form';

const DEFAULT_VALUES: KhachHangFormValues = {
  ma_khach_hang: '',
  ten_khach_hang: '',
  so_dien_thoai: null,
  dia_chi: null,
  ghi_chu: null,
  id_nhom: '',
  id_trang_thai: '',
};

type NestedMasterForm = 'group' | 'status' | null;

interface Props {
  initialData: KhachHang | null;
  /** `duplicate`: tạo mới điền sẵn từ `initialData` (reset mã, trạng thái). */
  mode?: FormMode;
  onClose: () => void;
  /** Gọi sau khi tạo mới (vd. chọn ngay trong dropdown form NLH). */
  onCreated?: (created: KhachHang) => void;
  stackLevel?: number;
}

const KhachHangForm: React.FC<Props> = ({
  initialData,
  mode,
  onClose,
  onCreated,
  stackLevel = 0,
}) => {
  const isDuplicate = mode === 'duplicate';
  const isEdit = !!initialData && !isDuplicate;
  const canCreate = useCan('create', 'customers');
  const canCreateSettings = useCan('create', 'customerSettings');
  const canEditRecord = useCanOnRecord('edit', 'customers', {
    nguoi_tao: initialData?.nguoi_tao,
  });
  const canSave = isEdit ? canEditRecord : canCreate;
  const [nestedForm, setNestedForm] = useState<NestedMasterForm>(null);

  useEffect(() => {
    if (!canSave) {
      toast.error(txt('shared.error.forbidden'));
      onClose();
    }
  }, [canSave, onClose]);

  const queryClient = useQueryClient();
  const duplicateSourceId = isDuplicate ? initialData?.id : undefined;
  const createMutation = useCreateKhachHang((created) => {
    onCreated?.(created);
    // Sao chép kèm bảng con: nhân bản người liên hệ của khách nguồn sang khách mới.
    if (duplicateSourceId) {
      void copyNguoiLienHeToCustomer(duplicateSourceId, created.id)
        .then((count) => {
          if (count > 0) {
            void queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
            void queryClient.invalidateQueries({ queryKey: queryKeys.customers.all });
            toast.success(txt('customer.toast.duplicateContactsSuccess', { count }));
          }
        })
        .catch(() => toast.error(txt('customer.toast.duplicateContactsError')));
    }
    onClose();
  });
  const updateMutation = useUpdateKhachHang(onClose);

  const { data: groups = [] } = useNhomKhachHang();
  const { data: statuses = [] } = useTrangThaiKhachHang();
  const { data: suggestedMa } = useNextMaKhachHang(!isEdit);

  const groupOptions = useMemo(
    () => groups.map((g) => ({ value: g.id, label: g.ten_nhom })),
    [groups],
  );
  const statusOptions = useMemo(
    () => statuses.map((s) => ({ value: s.id, label: s.ten_trang_thai })),
    [statuses],
  );

  const { control, handleSubmit, reset, getValues, setValue } = useForm<KhachHangFormValues>({
    resolver: zodResolver(khachHangSchema) as Resolver<KhachHangFormValues>,
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        ma_khach_hang: initialData.ma_khach_hang,
        ten_khach_hang: initialData.ten_khach_hang,
        so_dien_thoai: initialData.so_dien_thoai,
        dia_chi: initialData.dia_chi,
        ghi_chu: initialData.ghi_chu,
        id_nhom: initialData.id_nhom,
        id_trang_thai: initialData.id_trang_thai,
        // Sao chép: mã phải nhập lại (unique — gợi ý mã mới tự điền), trạng thái chọn lại theo ngữ cảnh mới.
        ...(isDuplicate && {
          ma_khach_hang: DEFAULT_VALUES.ma_khach_hang,
          id_trang_thai: DEFAULT_VALUES.id_trang_thai,
        }),
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, isDuplicate, reset]);

  // Prefill gợi ý mã tăng dần khi tạo mới — user vẫn sửa được.
  useEffect(() => {
    if (isEdit || !suggestedMa) return;
    if (!getValues('ma_khach_hang')) {
      setValue('ma_khach_hang', suggestedMa);
    }
  }, [isEdit, suggestedMa, getValues, setValue]);

  const onSubmit: SubmitHandler<KhachHangFormValues> = (values) => {
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const nestedStackLevel = stackLevel + 1;
  const addNewLabel = txt('customer.form.addNewOption');

  return (
    <>
      <GenericDrawer
        title={isEdit ? txt('customer.form.editTitle') : txt('customer.form.createTitle')}
        subtitle={isEdit ? txt('customer.form.editSubtitle') : txt('customer.form.createSubtitle')}
        icon={<Users size={ICON_SIZE.prominent} />}
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
            createIcon={<Users className="w-3.5 h-3.5 mr-1.5 shrink-0" />}
          />
        }
      >
        <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormSection
            title={txt('customer.form.generalInfo')}
            icon={<FileText size={ICON_SIZE.compact} />}
          >
            <FormGrid>
              <RhfDataField
                control={control}
                name="ma_khach_hang"
              icon={fieldIcon(KHACH_HANG_FIELD_ICONS.ma_khach_hang)}
                dataType={KHACH_HANG_FIELD_DATA_TYPE.ma_khach_hang}
                label={txt('customer.form.code')}
                placeholder={txt('customer.form.codePlaceholder')}
                required
              />
              <RhfDataField
                control={control}
                name="ten_khach_hang"
              icon={fieldIcon(KHACH_HANG_FIELD_ICONS.ten_khach_hang)}
                dataType={KHACH_HANG_FIELD_DATA_TYPE.ten_khach_hang}
                label={txt('customer.form.name')}
                placeholder={txt('customer.form.namePlaceholder')}
                required
              />
              <RhfDataField
                control={control}
                name="id_nhom"
              icon={fieldIcon(KHACH_HANG_FIELD_ICONS.id_nhom)}
                dataType={KHACH_HANG_FIELD_DATA_TYPE.id_nhom}
                label={txt('customer.form.group')}
                placeholder={txt('customer.form.groupPlaceholder')}
                options={groupOptions}
                required
                onAddNew={
                  canCreateSettings ? () => setNestedForm('group') : undefined
                }
                addNewLabel={addNewLabel}
              />
              <RhfDataField
                control={control}
                name="id_trang_thai"
              icon={fieldIcon(KHACH_HANG_FIELD_ICONS.id_trang_thai)}
                dataType={KHACH_HANG_FIELD_DATA_TYPE.id_trang_thai}
                label={txt('customer.form.status')}
                placeholder={txt('customer.form.statusPlaceholder')}
                options={statusOptions}
                required
                onAddNew={
                  canCreateSettings ? () => setNestedForm('status') : undefined
                }
                addNewLabel={addNewLabel}
              />
            </FormGrid>
          </FormSection>

          <FormSection
            title={txt('customer.form.contactInfo')}
            icon={<Phone size={ICON_SIZE.compact} />}
          >
            <FormGrid>
              <RhfDataField
                control={control}
                name="so_dien_thoai"
              icon={fieldIcon(KHACH_HANG_FIELD_ICONS.so_dien_thoai)}
                dataType={KHACH_HANG_FIELD_DATA_TYPE.so_dien_thoai}
                label={txt('customer.form.phone')}
                placeholder={txt('customer.form.phonePlaceholder')}
              />
              <RhfDataField
                control={control}
                name="dia_chi"
              icon={fieldIcon(KHACH_HANG_FIELD_ICONS.dia_chi)}
                dataType={KHACH_HANG_FIELD_DATA_TYPE.dia_chi}
                label={txt('customer.form.address')}
                placeholder={txt('customer.form.addressPlaceholder')}
              />
              <div className="sm:col-span-2">
                <RhfDataField
                  control={control}
                  name="ghi_chu"
              icon={fieldIcon(KHACH_HANG_FIELD_ICONS.ghi_chu)}
                  dataType={KHACH_HANG_FIELD_DATA_TYPE.ghi_chu}
                  label={txt('customer.form.note')}
                  hint={txt('customer.form.noteHint')}
                />
              </div>
            </FormGrid>
          </FormSection>
        </form>
      </GenericDrawer>

      {nestedForm === 'group' && (
        <Suspense fallback={null}>
          <NhomKhachHangForm
            initialData={null}
            stackLevel={nestedStackLevel}
            onClose={() => setNestedForm(null)}
            onCreated={(created) => setValue('id_nhom', created.id, { shouldValidate: true })}
          />
        </Suspense>
      )}
      {nestedForm === 'status' && (
        <Suspense fallback={null}>
          <TrangThaiKhachHangForm
            initialData={null}
            stackLevel={nestedStackLevel}
            onClose={() => setNestedForm(null)}
            onCreated={(created) =>
              setValue('id_trang_thai', created.id, { shouldValidate: true })
            }
          />
        </Suspense>
      )}
    </>
  );
};

export default KhachHangForm;
