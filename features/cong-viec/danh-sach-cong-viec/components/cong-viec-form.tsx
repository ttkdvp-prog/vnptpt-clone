import React, { useEffect, useMemo, useRef, useState } from 'react';
import { txt } from '@/lib/text';
import { ICON_SIZE } from '@/lib/icon-sizes';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ListTodo, ClipboardList, Users, CalendarClock, FileType, AlertCircle, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { uploadDocument } from '@/lib/media/upload-document';
import FormDrawerFooter from '@/components/shared/FormDrawerFooter';
import Input from '@/components/ui/Input';
import Combobox from '@/components/ui/Combobox';
import MultiSelect from '@/components/ui/MultiSelect';
import RhfDataField from '@/components/data-types/RhfDataField';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '@/components/shared/GenericDrawer';
import FormSection from '@/components/shared/FormSection';
import FormGrid from '@/components/shared/FormGrid';
import type { FormMode } from '@/lib/last-view-flow';
import { createCongViecSchema, type CongViecFormValues } from '../core/schema';
import { CongViec } from '../core/types';
import { CAP_OPTIONS, UU_TIEN_OPTIONS, BAN_GIAM_DOC_MEMBERS } from '../core/constants';
import { CONG_VIEC_FIELD_ICONS } from '../core/cong-viec-field-icons';
import {
  useCreateCongViec,
  useUpdateCongViec,
  useCongViecDistinctTieuDe,
  useCongViecDistinctTo,
} from '../hooks/use-cong-viec';
import { useEmployees, findToTruong } from '../hooks/use-employee-options';
import { useCan } from '@/hooks/use-can';
import { fieldIcon } from '@/lib/field-icon';
import { useConfirmDiscardOnClose } from '@/hooks/use-confirm-discard-on-close';

const MAX_DOCUMENT_MB = 20;

function csvToArray(value?: string | null): string[] {
  return value?.trim() ? value.split(',').map((s) => s.trim()).filter(Boolean) : [];
}

interface Props {
  initialData?: CongViec | null;
  mode?: FormMode;
  onClose: () => void;
}

function toFormValues(item?: CongViec | null): CongViecFormValues {
  return {
    cap: item?.cap ?? 'Trung tâm',
    tieu_de: item?.tieu_de ?? '',
    mo_ta: item?.mo_ta ?? '',
    to_ar: item?.to_ar ?? '',
    to_r: item?.to_r ?? '',
    mnv_a: item?.mnv_a ?? '',
    mnv_r: item?.mnv_r ?? '',
    mnv_c: item?.mnv_c ?? '',
    mnv_bgd: item?.mnv_bgd ?? '',
    uu_tien: item?.uu_tien ?? 'Trung bình',
    ngay_bd: item?.ngay_bd ?? new Date().toISOString().slice(0, 10),
    ngay_kt: item?.ngay_kt ?? '',
    ghi_chu: item?.ghi_chu ?? '',
    ngay_ht: item?.ngay_ht ?? '',
    tep_dinh_kem: item?.tep_dinh_kem ?? '',
    ke_hoach: item?.ke_hoach ?? null,
    thuc_hien: item?.thuc_hien ?? null,
  };
}

const CongViecForm: React.FC<Props> = ({ initialData, mode, onClose }) => {
  const isDuplicate = mode === 'duplicate';
  const isEdit = !!initialData && !isDuplicate;
  const canCreate = useCan('create', 'cong-viec');
  const canEditRecord = useCan('edit', 'cong-viec');
  const canSave = isEdit ? canEditRecord : canCreate;

  useEffect(() => {
    if (!canSave) {
      toast.error(txt('shared.error.forbidden'));
      onClose();
    }
  }, [canSave, onClose]);

  const createMutation = useCreateCongViec(onClose);
  const updateMutation = useUpdateCongViec(onClose);
  const { data: tieuDeList = [] } = useCongViecDistinctTieuDe();
  const { data: toList = [] } = useCongViecDistinctTo();
  const employees = useEmployees();

  const toOptions = useMemo(() => toList.map((t) => ({ label: t, value: t })), [toList]);

  const resolver = useMemo(() => zodResolver(createCongViecSchema()) as Resolver<CongViecFormValues>, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    control,
    setValue,
    watch,
  } = useForm<CongViecFormValues>({
    resolver,
    defaultValues: toFormValues(isDuplicate ? null : initialData),
  });

  useEffect(() => {
    if (initialData && isDuplicate) {
      reset({ ...toFormValues(initialData), tieu_de: '', ngay_ht: '' });
    } else if (initialData) {
      reset(toFormValues(initialData));
    }
  }, [initialData, isDuplicate, reset]);

  const onSubmit = (data: CongViecFormValues) => {
    if (!canSave) return;
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const isSubmitBlocked = isLoading || !canSave;
  const attemptClose = useConfirmDiscardOnClose(isDirty, onClose);

  const [capNguoi, setCapNguoi] = useState<string>('Trung tâm');
  /** Chỉ loại người có `cap` khác cấp đang chọn; người chưa điền `cap` trong sheet vẫn được giữ lại (không rõ cấp thì không giấu). */
  const capFilteredEmployees = useMemo(
    () => (capNguoi ? employees.filter((e) => !e.cap || e.cap === capNguoi) : employees),
    [employees, capNguoi],
  );
  const capFilteredEmployeeOptions = useMemo(
    () => capFilteredEmployees.map((e) => ({ label: e.ho_ten, value: e.id })),
    [capFilteredEmployees],
  );
  /**
   * Ban giám đốc giao việc/giám sát toàn bộ — mặc định chỉ 3 người cố định
   * (`BAN_GIAM_DOC_MEMBERS`), giữ nguyên thứ tự; lấy `ho_ten` mới nhất từ danh
   * sách nhân viên nếu đã tải được, không thì dùng tên mặc định.
   */
  const banGiamDocOptions = useMemo(
    () =>
      BAN_GIAM_DOC_MEMBERS.map((m) => ({
        label: employees.find((e) => e.id === m.id)?.ho_ten ?? m.ho_ten,
        value: m.id,
      })),
    [employees],
  );

  /** Giao của tổ ∩ cấp — lọc cứng theo cấp đang chọn, không rơi về cả tổ để tránh hiện nhầm người sai cấp. */
  function teamOptionsFor(toPhong: string | null | undefined): { label: string; value: string }[] {
    if (!toPhong) return capFilteredEmployeeOptions;
    return capFilteredEmployees
      .filter((e) => e.to_phong === toPhong)
      .map((e) => ({ label: e.ho_ten, value: e.id }));
  }

  const toAr = watch('to_ar');
  const toArTeamOptions = (() => {
    const base = teamOptionsFor(toAr);
    const toTruong = toAr ? findToTruong(employees, toAr) : undefined;
    if (toTruong && !base.some((o) => o.value === toTruong.id)) {
      return [{ label: toTruong.ho_ten, value: toTruong.id }, ...base];
    }
    return base;
  })();

  const toR = watch('to_r');
  const toRTeamOptions = teamOptionsFor(toR);

  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const tepDinhKem = watch('tep_dinh_kem');

  const handlePickFile = () => {
    if (!isUploadingDoc) fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.type.toLowerCase() !== 'application/pdf') {
      toast.error(txt('congViec.form.uploadPdfNotPdf'));
      return;
    }
    if (file.size > MAX_DOCUMENT_MB * 1024 * 1024) {
      toast.error(txt('congViec.form.uploadPdfTooLarge'));
      return;
    }

    setIsUploadingDoc(true);
    try {
      const result = await uploadDocument(file, { context: { folder: 'cong-viec' } });
      setValue('tep_dinh_kem', result.url, { shouldDirty: true, shouldValidate: true });
    } catch {
      toast.error(txt('congViec.form.uploadPdfError'));
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const footer = useMemo(
    () => (
      <FormDrawerFooter
        formId="cong-viec-form"
        onCancel={attemptClose}
        isLoading={isSubmitBlocked}
        isEdit={isEdit}
        compact
        createIcon={<ListTodo className="w-3.5 h-3.5 mr-1.5 shrink-0" />}
      />
    ),
    [attemptClose, isSubmitBlocked, isEdit],
  );

  return (
    <GenericDrawer
      title={isEdit ? txt('congViec.form.editTitle') : txt('congViec.form.createTitle')}
      subtitle={isEdit && initialData ? initialData.tieu_de : txt('congViec.form.createSubtitle')}
      icon={<ListTodo size={ICON_SIZE.prominent} />}
      onClose={attemptClose}
      footer={footer}
      footerCompact
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="cong-viec-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {Object.keys(errors).length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden />
            <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
              {txt('congViec.form.validationError')}
            </p>
          </div>
        )}

        <FormSection title={txt('congViec.form.generalInfo')} icon={<ClipboardList size={ICON_SIZE.compact} />}>
          <FormGrid cols={2}>
            <Input
              label={txt('congViec.field.tieuDe')}
              required
              list="cong-viec-tieu-de-suggestions"
              icon={fieldIcon(CONG_VIEC_FIELD_ICONS.tieu_de)}
              placeholder={txt('congViec.form.tieuDePlaceholder')}
              {...register('tieu_de')}
              error={errors.tieu_de?.message}
            />
            <datalist id="cong-viec-tieu-de-suggestions">
              {tieuDeList.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            <Controller
              name="cap"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={txt('congViec.field.cap')}
                  required
                  options={CAP_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
                  value={String(field.value)}
                  onChange={(val) => field.onChange(val)}
                  placeholder={txt('congViec.form.capPlaceholder')}
                  icon={fieldIcon(CONG_VIEC_FIELD_ICONS.cap)}
                  searchable={false}
                  error={errors.cap?.message}
                />
              )}
            />
            <Controller
              name="uu_tien"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={txt('congViec.field.uuTien')}
                  required
                  options={UU_TIEN_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
                  value={String(field.value)}
                  onChange={(val) => field.onChange(val)}
                  placeholder={txt('congViec.form.uuTienPlaceholder')}
                  icon={fieldIcon(CONG_VIEC_FIELD_ICONS.uu_tien)}
                  searchable={false}
                  error={errors.uu_tien?.message}
                />
              )}
            />
          </FormGrid>
        </FormSection>

        <FormSection title={txt('congViec.form.assignment')} icon={<Users size={ICON_SIZE.compact} />}>
          <FormGrid cols={2}>
            <Combobox
              label={txt('congViec.form.capNguoiLabel')}
              options={CAP_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
              value={capNguoi}
              onChange={(val) => setCapNguoi(String(val ?? ''))}
              placeholder={txt('congViec.form.capNguoiPlaceholder')}
              icon={fieldIcon(CONG_VIEC_FIELD_ICONS.cap)}
              searchable={false}
            />
            <div />
            <Controller
              name="to_ar"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={txt('congViec.field.toAr')}
                  required
                  options={toOptions}
                  value={String(field.value ?? '')}
                  onChange={(val) => {
                    field.onChange(val);
                    const toTruong = findToTruong(employees, String(val));
                    if (toTruong) {
                      setValue('mnv_a', toTruong.id, { shouldDirty: true, shouldValidate: true });
                    }
                  }}
                  placeholder={txt('congViec.form.toArPlaceholder')}
                  icon={fieldIcon(CONG_VIEC_FIELD_ICONS.to_ar)}
                  error={errors.to_ar?.message}
                />
              )}
            />
            <Controller
              name="to_r"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={txt('congViec.field.toR')}
                  options={toOptions}
                  value={String(field.value ?? '')}
                  onChange={(val) => field.onChange(val)}
                  placeholder={txt('congViec.form.toRPlaceholder')}
                  icon={fieldIcon(CONG_VIEC_FIELD_ICONS.to_r)}
                  error={errors.to_r?.message}
                />
              )}
            />
            <Controller
              name="mnv_a"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={txt('congViec.field.mnvA')}
                  required
                  options={toArTeamOptions}
                  value={String(field.value ?? '')}
                  onChange={(val) => field.onChange(val)}
                  placeholder={txt('congViec.form.mnvAPlaceholder')}
                  icon={fieldIcon(CONG_VIEC_FIELD_ICONS.mnv_a)}
                  error={errors.mnv_a?.message}
                />
              )}
            />
            <div />
            <Controller
              name="mnv_r"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  label={txt('congViec.field.mnvR')}
                  options={toRTeamOptions}
                  value={csvToArray(field.value)}
                  onChange={(vals) => field.onChange(vals.join(','))}
                  placeholder={txt('congViec.form.mnvRPlaceholder')}
                  icon={CONG_VIEC_FIELD_ICONS.mnv_r}
                />
              )}
            />
            <Controller
              name="mnv_c"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  label={txt('congViec.field.mnvC')}
                  options={capFilteredEmployeeOptions}
                  value={csvToArray(field.value)}
                  onChange={(vals) => field.onChange(vals.join(','))}
                  placeholder={txt('congViec.form.mnvCPlaceholder')}
                  icon={CONG_VIEC_FIELD_ICONS.mnv_c}
                />
              )}
            />
            <Controller
              name="mnv_bgd"
              control={control}
              render={({ field }) => (
                <MultiSelect
                  label={txt('congViec.field.mnvBgd')}
                  options={banGiamDocOptions}
                  value={csvToArray(field.value)}
                  onChange={(vals) => field.onChange(vals.join(','))}
                  placeholder={txt('congViec.form.mnvBgdPlaceholder')}
                  icon={CONG_VIEC_FIELD_ICONS.mnv_bgd}
                />
              )}
            />
          </FormGrid>
        </FormSection>

        <FormSection title={txt('congViec.form.schedule')} icon={<CalendarClock size={ICON_SIZE.compact} />}>
          <FormGrid cols={2}>
            <RhfDataField
              control={control}
              name="ngay_bd"
              dataType="date"
              label={txt('congViec.field.ngayBd')}
              required
              icon={fieldIcon(CONG_VIEC_FIELD_ICONS.ngay_bd)}
            />
            <RhfDataField
              control={control}
              name="ngay_kt"
              dataType="date"
              label={txt('congViec.field.ngayKt')}
              required
              icon={fieldIcon(CONG_VIEC_FIELD_ICONS.ngay_kt)}
            />
            <RhfDataField
              control={control}
              name="ngay_ht"
              dataType="date"
              label={txt('congViec.field.ngayHt')}
              icon={fieldIcon(CONG_VIEC_FIELD_ICONS.ngay_ht)}
            />
            <RhfDataField
              control={control}
              name="ke_hoach"
              dataType="number"
              label={txt('congViec.field.keHoach')}
              icon={fieldIcon(CONG_VIEC_FIELD_ICONS.ke_hoach)}
            />
            <RhfDataField
              control={control}
              name="thuc_hien"
              dataType="number"
              label={txt('congViec.field.thucHien')}
              icon={fieldIcon(CONG_VIEC_FIELD_ICONS.thuc_hien)}
            />
          </FormGrid>
        </FormSection>

        <FormSection title={txt('congViec.form.content')} icon={<FileType size={ICON_SIZE.compact} />}>
          <FormGrid cols={1}>
            <div className="flex items-center gap-3 -mt-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => void handleFileChange(e)}
              />
              <button
                type="button"
                onClick={handlePickFile}
                disabled={isUploadingDoc}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isUploadingDoc ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                {isUploadingDoc ? txt('congViec.form.uploadPdfUploading') : txt('congViec.form.uploadPdf')}
              </button>
              <span className="text-xs text-muted-foreground">
                {tepDinhKem ? tepDinhKem : txt('congViec.form.uploadPdfHint')}
              </span>
            </div>
            <RhfDataField
              control={control}
              name="mo_ta"
              dataType="long_text"
              label={txt('congViec.field.moTa')}
              icon={fieldIcon(CONG_VIEC_FIELD_ICONS.mo_ta)}
              placeholder={txt('congViec.form.moTaPlaceholder')}
            />
            <RhfDataField
              control={control}
              name="ghi_chu"
              dataType="long_text"
              label={txt('congViec.field.ghiChu')}
              icon={fieldIcon(CONG_VIEC_FIELD_ICONS.ghi_chu)}
              placeholder={txt('congViec.form.ghiChuPlaceholder')}
            />
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default CongViecForm;
