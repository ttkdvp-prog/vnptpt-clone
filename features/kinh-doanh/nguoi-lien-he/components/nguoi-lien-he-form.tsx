import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useForm, type Resolver, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ContactRound, FileText, Phone } from 'lucide-react';
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
import { useKhachHang } from '@/features/kinh-doanh/khach-hang/hooks/use-khach-hang';
import { nguoiLienHeSchema, type NguoiLienHeFormValues } from '../core/schema';
import { NGUOI_LIEN_HE_FIELD_DATA_TYPE } from '../core/nguoi-lien-he-field-meta';
import type { NguoiLienHe } from '../core/types';
import { useCreateNguoiLienHe, useUpdateNguoiLienHe } from '../hooks/use-nguoi-lien-he';
import { NgaySinhField } from './ngay-sinh-field';
import { fieldIcon } from '@/lib/field-icon';
import { NGUOI_LIEN_HE_FIELD_ICONS } from '../core/nguoi-lien-he-field-icons';

const KhachHangForm = lazy(
  () => import('@/features/kinh-doanh/khach-hang/components/khach-hang-form'),
);

const FORM_ID = 'nguoi-lien-he-form';

const DEFAULT_VALUES: NguoiLienHeFormValues = {
  id_khach_hang: '',
  ho_ten: '',
  ngay_sinh: null,
  chuc_vu: null,
  so_dien_thoai: null,
  email: null,
  dia_chi: null,
  ghi_chu: null,
};

interface Props {
  initialData: NguoiLienHe | null;
  /** `duplicate`: tạo mới điền sẵn từ `initialData`. */
  mode?: FormMode;
  onClose: () => void;
  /** Prefill khách hàng khi tạo từ detail KH */
  defaultKhachHangId?: string | null;
  stackLevel?: number;
}

const NguoiLienHeForm: React.FC<Props> = ({
  initialData,
  mode,
  onClose,
  defaultKhachHangId,
  stackLevel = 0,
}) => {
  const isDuplicate = mode === 'duplicate';
  const isEdit = !!initialData && !isDuplicate;
  const canCreate = useCan('create', 'contacts');
  const canCreateCustomer = useCan('create', 'customers');
  const canEditRecord = useCanOnRecord('edit', 'contacts', {
    nguoi_tao: initialData?.nguoi_tao,
  });
  const canSave = isEdit ? canEditRecord : canCreate;
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  useEffect(() => {
    if (!canSave) {
      toast.error(txt('shared.error.forbidden'));
      onClose();
    }
  }, [canSave, onClose]);

  const createMutation = useCreateNguoiLienHe(onClose);
  const updateMutation = useUpdateNguoiLienHe(onClose);
  const { data: customers = [] } = useKhachHang();

  const customerOptions = useMemo(
    () =>
      customers.map((c) => ({
        value: c.id,
        label: c.ten_khach_hang,
        subLabel: c.ma_khach_hang,
      })),
    [customers],
  );

  const { control, handleSubmit, reset, setValue } = useForm<NguoiLienHeFormValues>({
    resolver: zodResolver(nguoiLienHeSchema) as Resolver<NguoiLienHeFormValues>,
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        id_khach_hang: initialData.id_khach_hang,
        ho_ten: initialData.ho_ten,
        ngay_sinh: initialData.ngay_sinh,
        chuc_vu: initialData.chuc_vu,
        so_dien_thoai: initialData.so_dien_thoai,
        email: initialData.email,
        dia_chi: initialData.dia_chi,
        ghi_chu: initialData.ghi_chu,
      });
    } else {
      reset({
        ...DEFAULT_VALUES,
        id_khach_hang: defaultKhachHangId ?? '',
      });
    }
  }, [initialData, defaultKhachHangId, reset]);

  const onSubmit: SubmitHandler<NguoiLienHeFormValues> = (values) => {
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const lockCustomer = !!defaultKhachHangId && !isEdit;
  const nestedStackLevel = stackLevel + 1;
  const addNewLabel = txt('contact.form.addNewOption');

  return (
    <>
      <GenericDrawer
        title={isEdit ? txt('contact.form.editTitle') : txt('contact.form.createTitle')}
        subtitle={isEdit ? txt('contact.form.editSubtitle') : txt('contact.form.createSubtitle')}
        icon={<ContactRound size={ICON_SIZE.prominent} />}
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
            createIcon={<ContactRound className="w-3.5 h-3.5 mr-1.5 shrink-0" />}
          />
        }
      >
        <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <FormSection
            title={txt('contact.form.generalInfo')}
            icon={<FileText size={ICON_SIZE.compact} />}
          >
            <FormGrid>
              <RhfDataField
                control={control}
                name="id_khach_hang"
              icon={fieldIcon(NGUOI_LIEN_HE_FIELD_ICONS.id_khach_hang)}
                dataType={NGUOI_LIEN_HE_FIELD_DATA_TYPE.id_khach_hang}
                label={txt('contact.form.customer')}
                placeholder={txt('contact.form.customerPlaceholder')}
                options={customerOptions}
                required
                disabled={lockCustomer}
                onAddNew={
                  !lockCustomer && canCreateCustomer
                    ? () => setShowCustomerForm(true)
                    : undefined
                }
                addNewLabel={addNewLabel}
              />
              <RhfDataField
                control={control}
                name="ho_ten"
              icon={fieldIcon(NGUOI_LIEN_HE_FIELD_ICONS.ho_ten)}
                dataType={NGUOI_LIEN_HE_FIELD_DATA_TYPE.ho_ten}
                label={txt('contact.form.name')}
                placeholder={txt('contact.form.namePlaceholder')}
                required
              />
              <NgaySinhField control={control} name="ngay_sinh" icon={fieldIcon(NGUOI_LIEN_HE_FIELD_ICONS.ngay_sinh)} />
              <RhfDataField
                control={control}
                name="chuc_vu"
              icon={fieldIcon(NGUOI_LIEN_HE_FIELD_ICONS.chuc_vu)}
                dataType={NGUOI_LIEN_HE_FIELD_DATA_TYPE.chuc_vu}
                label={txt('contact.form.title')}
                placeholder={txt('contact.form.titlePlaceholder')}
              />
            </FormGrid>
          </FormSection>

          <FormSection
            title={txt('contact.form.contactInfo')}
            icon={<Phone size={ICON_SIZE.compact} />}
          >
            <FormGrid>
              <RhfDataField
                control={control}
                name="so_dien_thoai"
              icon={fieldIcon(NGUOI_LIEN_HE_FIELD_ICONS.so_dien_thoai)}
                dataType={NGUOI_LIEN_HE_FIELD_DATA_TYPE.so_dien_thoai}
                label={txt('contact.form.phone')}
                placeholder={txt('contact.form.phonePlaceholder')}
              />
              <RhfDataField
                control={control}
                name="email"
              icon={fieldIcon(NGUOI_LIEN_HE_FIELD_ICONS.email)}
                dataType={NGUOI_LIEN_HE_FIELD_DATA_TYPE.email}
                label={txt('contact.form.email')}
                placeholder={txt('contact.form.emailPlaceholder')}
              />
              <RhfDataField
                control={control}
                name="dia_chi"
              icon={fieldIcon(NGUOI_LIEN_HE_FIELD_ICONS.dia_chi)}
                dataType={NGUOI_LIEN_HE_FIELD_DATA_TYPE.dia_chi}
                label={txt('contact.form.address')}
                placeholder={txt('contact.form.addressPlaceholder')}
              />
              <div className="sm:col-span-2">
                <RhfDataField
                  control={control}
                  name="ghi_chu"
              icon={fieldIcon(NGUOI_LIEN_HE_FIELD_ICONS.ghi_chu)}
                  dataType={NGUOI_LIEN_HE_FIELD_DATA_TYPE.ghi_chu}
                  label={txt('contact.form.note')}
                  hint={txt('contact.form.noteHint')}
                />
              </div>
            </FormGrid>
          </FormSection>
        </form>
      </GenericDrawer>

      {showCustomerForm ? (
        <Suspense fallback={null}>
          <KhachHangForm
            initialData={null}
            stackLevel={nestedStackLevel}
            onClose={() => setShowCustomerForm(false)}
            onCreated={(created) => {
              setValue('id_khach_hang', created.id, { shouldValidate: true });
            }}
          />
        </Suspense>
      ) : null}
    </>
  );
};

export default NguoiLienHeForm;
