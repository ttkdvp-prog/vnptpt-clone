import React, { useEffect, useMemo, useRef, useState } from 'react';
import { txt } from '@/lib/text';
import { ICON_SIZE } from '@/lib/icon-sizes';
import { useForm, Controller, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FilePlus2, FileText, AlertCircle, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { uploadDocumentToServer } from '@/lib/media/providers/uploads-provider';
import FormDrawerFooter from '@/components/shared/FormDrawerFooter';
import Input from '@/components/ui/Input';
import Combobox from '@/components/ui/Combobox';
import RhfDataField from '@/components/data-types/RhfDataField';
import GenericDrawer, { DRAWER_WIDTH_FORM } from '@/components/shared/GenericDrawer';
import FormSection from '@/components/shared/FormSection';
import FormGrid from '@/components/shared/FormGrid';
import type { FormMode } from '@/lib/last-view-flow';
import { createTaiLieuSchema, type TaiLieuFormValues } from '../core/schema';
import { TaiLieu } from '../core/types';
import { TINH_TRANG_OPTIONS } from '../core/constants';
import { TAI_LIEU_FIELD_ICONS } from '../core/tai-lieu-field-icons';
import {
  useCreateTaiLieu,
  useUpdateTaiLieu,
  useTaiLieuDistinctDanhMuc,
  useTaiLieuDistinctTenHoSo,
  useTaiLieuDistinctTo,
} from '../hooks/use-tai-lieu';
import { useCan } from '@/hooks/use-can';
import { fieldIcon } from '@/lib/field-icon';
import { useConfirmDiscardOnClose } from '@/hooks/use-confirm-discard-on-close';

const MAX_DOCUMENT_MB = 20;

interface Props {
  initialData?: TaiLieu | null;
  mode?: FormMode;
  onClose: () => void;
}

function toFormValues(item?: TaiLieu | null): TaiLieuFormValues {
  return {
    ten_ho_so: item?.ten_ho_so ?? '',
    danh_muc: item?.danh_muc ?? '',
    to: item?.to ?? '',
    ngay_ban_hanh: item?.ngay_ban_hanh ?? '',
    ngay_ket_thuc: item?.ngay_ket_thuc ?? '',
    tinh_trang: item?.tinh_trang ?? 'Dự thảo',
    url: item?.url ?? '',
    mo_ta: item?.mo_ta ?? '',
  };
}

const TaiLieuForm: React.FC<Props> = ({ initialData, mode, onClose }) => {
  const isDuplicate = mode === 'duplicate';
  const isEdit = !!initialData && !isDuplicate;
  const canCreate = useCan('create', 'tai-lieu');
  const canEditRecord = useCan('edit', 'tai-lieu');
  const canSave = isEdit ? canEditRecord : canCreate;

  useEffect(() => {
    if (!canSave) {
      toast.error(txt('shared.error.forbidden'));
      onClose();
    }
  }, [canSave, onClose]);

  const createMutation = useCreateTaiLieu(onClose);
  const updateMutation = useUpdateTaiLieu(onClose);
  const { data: danhMucList = [] } = useTaiLieuDistinctDanhMuc();
  const { data: toList = [] } = useTaiLieuDistinctTo();
  const { data: tenHoSoList = [] } = useTaiLieuDistinctTenHoSo();

  const toOptions = useMemo(() => toList.map((t) => ({ label: t, value: t })), [toList]);
  const danhMucOptions = useMemo(() => danhMucList.map((d) => ({ label: d, value: d })), [danhMucList]);

  const resolver = useMemo(() => zodResolver(createTaiLieuSchema()) as Resolver<TaiLieuFormValues>, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    control,
    setValue,
  } = useForm<TaiLieuFormValues>({
    resolver,
    defaultValues: toFormValues(isDuplicate ? null : initialData),
  });

  useEffect(() => {
    if (initialData && isDuplicate) {
      reset({ ...toFormValues(initialData), ten_ho_so: '', tinh_trang: 'Dự thảo' });
    } else if (initialData) {
      reset(toFormValues(initialData));
    }
  }, [initialData, isDuplicate, reset]);

  const onSubmit = (data: TaiLieuFormValues) => {
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

  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePickFile = () => {
    if (!isUploadingDoc) fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.type.toLowerCase() !== 'application/pdf') {
      toast.error(txt('congViecTaiLieu.form.uploadPdfNotPdf'));
      return;
    }
    if (file.size > MAX_DOCUMENT_MB * 1024 * 1024) {
      toast.error(txt('congViecTaiLieu.form.uploadPdfTooLarge'));
      return;
    }

    setIsUploadingDoc(true);
    try {
      const result = await uploadDocumentToServer(file, { folder: 'tai-lieu' });
      setValue('url', result.url, { shouldDirty: true, shouldValidate: true });
    } catch {
      toast.error(txt('congViecTaiLieu.form.uploadPdfError'));
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const footer = useMemo(
    () => (
      <FormDrawerFooter
        formId="tai-lieu-form"
        onCancel={attemptClose}
        isLoading={isSubmitBlocked}
        isEdit={isEdit}
        compact
        createIcon={<FilePlus2 className="w-3.5 h-3.5 mr-1.5 shrink-0" />}
      />
    ),
    [attemptClose, isSubmitBlocked, isEdit],
  );

  return (
    <GenericDrawer
      title={isEdit ? txt('congViecTaiLieu.form.editTitle') : txt('congViecTaiLieu.form.createTitle')}
      subtitle={isEdit && initialData ? initialData.ten_ho_so : txt('congViecTaiLieu.form.createSubtitle')}
      icon={<FileText size={ICON_SIZE.prominent} />}
      onClose={attemptClose}
      footer={footer}
      footerCompact
      maxWidthClass={DRAWER_WIDTH_FORM}
    >
      <form id="tai-lieu-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {Object.keys(errors).length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" aria-hidden />
            <p className="text-xs font-medium text-amber-800 dark:text-amber-200">
              {txt('congViecTaiLieu.form.validationError')}
            </p>
          </div>
        )}

        <FormSection title={txt('congViecTaiLieu.form.docInfo')} icon={<FileText size={ICON_SIZE.compact} />}>
          <FormGrid cols={2}>
            <Input
              label={txt('congViecTaiLieu.field.tenHoSo')}
              required
              list="tai-lieu-ten-ho-so-suggestions"
              icon={fieldIcon(TAI_LIEU_FIELD_ICONS.ten_ho_so)}
              placeholder={txt('congViecTaiLieu.form.tenHoSoPlaceholder')}
              {...register('ten_ho_so')}
              error={errors.ten_ho_so?.message}
            />
            <datalist id="tai-lieu-ten-ho-so-suggestions">
              {tenHoSoList.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            <Controller
              name="danh_muc"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={txt('congViecTaiLieu.field.danhMuc')}
                  required
                  options={danhMucOptions}
                  value={String(field.value ?? '')}
                  onChange={(val) => field.onChange(val)}
                  placeholder={txt('congViecTaiLieu.form.danhMucPlaceholder')}
                  icon={fieldIcon(TAI_LIEU_FIELD_ICONS.danh_muc)}
                  error={errors.danh_muc?.message}
                />
              )}
            />
            <Controller
              name="to"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={txt('congViecTaiLieu.field.to')}
                  required
                  options={toOptions}
                  value={String(field.value ?? '')}
                  onChange={(val) => field.onChange(val)}
                  placeholder={txt('congViecTaiLieu.form.toPlaceholder')}
                  icon={fieldIcon(TAI_LIEU_FIELD_ICONS.to)}
                  error={errors.to?.message}
                />
              )}
            />
            <Controller
              name="tinh_trang"
              control={control}
              render={({ field }) => (
                <Combobox
                  label={txt('congViecTaiLieu.field.tinhTrang')}
                  required
                  options={TINH_TRANG_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
                  value={String(field.value)}
                  onChange={(val) => field.onChange(val)}
                  placeholder={txt('congViecTaiLieu.form.tinhTrangPlaceholder')}
                  icon={fieldIcon(TAI_LIEU_FIELD_ICONS.tinh_trang)}
                  searchable={false}
                  error={errors.tinh_trang?.message}
                />
              )}
            />
            <RhfDataField
              control={control}
              name="ngay_ban_hanh"
              dataType="date"
              label={txt('congViecTaiLieu.field.ngayBanHanh')}
              required
              icon={fieldIcon(TAI_LIEU_FIELD_ICONS.ngay_ban_hanh)}
            />
            <RhfDataField
              control={control}
              name="ngay_ket_thuc"
              dataType="date"
              label={txt('congViecTaiLieu.field.ngayKetThuc')}
              icon={fieldIcon(TAI_LIEU_FIELD_ICONS.ngay_ket_thuc)}
            />
          </FormGrid>
        </FormSection>

        <FormSection title={txt('congViecTaiLieu.form.content')} icon={<FileText size={ICON_SIZE.compact} />}>
          <FormGrid cols={1}>
            <RhfDataField
              control={control}
              name="url"
              dataType="text"
              label={txt('congViecTaiLieu.field.url')}
              icon={fieldIcon(TAI_LIEU_FIELD_ICONS.url)}
              placeholder={txt('congViecTaiLieu.form.urlPlaceholder')}
            />
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
                {isUploadingDoc ? txt('congViecTaiLieu.form.uploadPdfUploading') : txt('congViecTaiLieu.form.uploadPdf')}
              </button>
              <span className="text-xs text-muted-foreground">{txt('congViecTaiLieu.form.uploadPdfHint')}</span>
            </div>
            <RhfDataField
              control={control}
              name="mo_ta"
              dataType="long_text"
              label={txt('congViecTaiLieu.field.moTa')}
              icon={fieldIcon(TAI_LIEU_FIELD_ICONS.mo_ta)}
              placeholder={txt('congViecTaiLieu.form.moTaPlaceholder')}
            />
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default TaiLieuForm;
