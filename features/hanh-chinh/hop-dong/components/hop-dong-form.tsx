import { useEffect, useMemo, useRef } from 'react';
import { useForm, useWatch, type Resolver, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, FileSignature, StickyNote, Wallet } from 'lucide-react';
import { txt } from '@/lib/text';
import { ICON_SIZE } from '@/lib/icon-sizes';
import { FormGrid, FormSection, GenericDrawer, RhfDataField } from '@/components/views';
import FormDrawerFooter from '@/components/shared/FormDrawerFooter';
import { getDrawerWidthClass } from '@/lib/dialog-sizes';
import type { FormMode } from '@/lib/last-view-flow';
import { useCan } from '@/hooks/use-can';
import { useCanOnRecord } from '@/hooks/use-can-on-record';
import { listQueryOptions } from '@/lib/query/query-config';
import { queryKeys } from '@/lib/query-keys';
import { getEmployees } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import { useDepartments } from '@/features/he-thong/phong-ban/hooks/use-phong-ban';
import { usePositions } from '@/features/he-thong/chuc-vu/hooks/use-chuc-vu';
import { hopDongSchema, type HopDongFormValues } from '../core/schema';
import { HOP_DONG_FIELD_DATA_TYPE } from '../core/hop-dong-field-meta';
import {
  CONTRACT_STATUS,
  CONTRACT_TYPE,
  CONTRACT_STATUS_OPTIONS,
  CONTRACT_TYPE_OPTIONS,
  SALARY_MODE,
  SALARY_MODE_OPTIONS,
  type HopDong,
} from '../core/types';
import { useCreateHopDong, useUpdateHopDong } from '../hooks/use-hop-dong';
import { fieldIcon } from '@/lib/field-icon';
import { HOP_DONG_FIELD_ICONS } from '../core/hop-dong-field-icons';

const FORM_ID = 'hop-dong-form';

const DEFAULT_VALUES: HopDongFormValues = {
  loai_hop_dong: CONTRACT_TYPE.THU_VIEC,
  ma_hop_dong: '',
  ngay_ky: '',
  ngay_hieu_luc: '',
  ngay_ket_thuc: null,
  id_nhan_vien: '',
  id_chuc_vu: '',
  id_phong_ban: '',
  muc_luong: '',
  hinh_thuc_tra_luong: SALARY_MODE.THEO_THANG,
  che_do_khac: null,
  noi_lam_viec: null,
  thoi_gian_lam_viec: null,
  luu_y_khac: null,
  ghi_chu: null,
  trang_thai: CONTRACT_STATUS.CHUA_XONG,
};

interface Props {
  initialData: HopDong | null;
  /** `duplicate`: tạo mới điền sẵn từ `initialData` (reset mã, trạng thái). */
  mode?: FormMode;
  onClose: () => void;
  /** Prefill nhân viên khi tạo từ detail NV */
  defaultNhanVienId?: string | null;
  stackLevel?: number;
}

const HopDongForm: React.FC<Props> = ({
  initialData,
  mode,
  onClose,
  defaultNhanVienId,
  stackLevel = 0,
}) => {
  const isDuplicate = mode === 'duplicate';
  const isEdit = !!initialData && !isDuplicate;
  const canCreate = useCan('create', 'contracts');
  const canEditRecord = useCanOnRecord('edit', 'contracts', {
    nguoi_tao: initialData?.nguoi_tao,
  });
  const canSave = isEdit ? canEditRecord : canCreate;

  useEffect(() => {
    if (!canSave) {
      toast.error(txt('shared.error.forbidden'));
      onClose();
    }
  }, [canSave, onClose]);

  const createMutation = useCreateHopDong(onClose);
  const updateMutation = useUpdateHopDong(onClose);

  const { data: employees = [] } = useQuery({
    queryKey: [...queryKeys.employees.all, 'picker'] as const,
    queryFn: () => getEmployees({ limit: 500, offset: 0 }),
    ...listQueryOptions,
  });
  const { data: positions = [] } = usePositions();
  const { data: departments = [] } = useDepartments();

  const employeeOptions = useMemo(
    () => employees.map((e) => ({ value: e.id, label: e.ho_ten })),
    [employees],
  );
  const positionOptions = useMemo(
    () => positions.map((p) => ({ value: p.id, label: p.ten_chuc_vu })),
    [positions],
  );
  const departmentOptions = useMemo(
    () => departments.map((d) => ({ value: d.id, label: d.ten_phong_ban })),
    [departments],
  );

  const { control, handleSubmit, reset, setValue } = useForm<HopDongFormValues>({
    resolver: zodResolver(hopDongSchema) as Resolver<HopDongFormValues>,
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        loai_hop_dong:
          initialData.loai_hop_dong as HopDongFormValues['loai_hop_dong'],
        ma_hop_dong: initialData.ma_hop_dong,
        ngay_ky: initialData.ngay_ky,
        ngay_hieu_luc: initialData.ngay_hieu_luc,
        ngay_ket_thuc: initialData.ngay_ket_thuc,
        id_nhan_vien: initialData.id_nhan_vien,
        id_chuc_vu: initialData.id_chuc_vu,
        id_phong_ban: initialData.id_phong_ban,
        muc_luong: initialData.muc_luong,
        hinh_thuc_tra_luong:
          initialData.hinh_thuc_tra_luong as HopDongFormValues['hinh_thuc_tra_luong'],
        che_do_khac: initialData.che_do_khac,
        noi_lam_viec: initialData.noi_lam_viec,
        thoi_gian_lam_viec: initialData.thoi_gian_lam_viec,
        luu_y_khac: initialData.luu_y_khac,
        ghi_chu: initialData.ghi_chu,
        trang_thai: initialData.trang_thai as HopDongFormValues['trang_thai'],
        // Sao chép: mã phải nhập lại (unique), trạng thái về mặc định theo ngữ cảnh mới.
        ...(isDuplicate && {
          ma_hop_dong: DEFAULT_VALUES.ma_hop_dong,
          trang_thai: DEFAULT_VALUES.trang_thai,
        }),
      });
    } else {
      reset({
        ...DEFAULT_VALUES,
        id_nhan_vien: defaultNhanVienId ?? '',
      });
    }
  }, [initialData, isDuplicate, defaultNhanVienId, reset]);

  // Auto-điền chức vụ + phòng ban từ nhân viên đã chọn (vẫn cho sửa tay).
  const selectedEmployeeId = useWatch({ control, name: 'id_nhan_vien' });
  const prevEmployeeId = useRef<string | undefined>(initialData?.id_nhan_vien);
  useEffect(() => {
    if (!selectedEmployeeId) return;
    if (selectedEmployeeId === prevEmployeeId.current) return;
    prevEmployeeId.current = selectedEmployeeId;
    const emp = employees.find((e) => e.id === selectedEmployeeId);
    if (!emp) return;
    if (emp.chuc_vu_id) {
      setValue('id_chuc_vu', emp.chuc_vu_id, { shouldValidate: true });
    }
    if (emp.phong_ban_id) {
      setValue('id_phong_ban', emp.phong_ban_id, { shouldValidate: true });
    }
  }, [selectedEmployeeId, employees, setValue]);

  const onSubmit: SubmitHandler<HopDongFormValues> = (values) => {
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;
  const lockEmployee = !!defaultNhanVienId && !isEdit;

  return (
    <GenericDrawer
      title={isEdit ? txt('contract.form.editTitle') : txt('contract.form.createTitle')}
      subtitle={
        isEdit ? txt('contract.form.editSubtitle') : txt('contract.form.createSubtitle')
      }
      icon={<FileSignature size={ICON_SIZE.prominent} />}
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
          createIcon={<FileSignature className="w-3.5 h-3.5 mr-1.5 shrink-0" />}
        />
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection
          title={txt('contract.form.generalInfo')}
          icon={<FileSignature size={ICON_SIZE.compact} />}
        >
          <FormGrid>
            <RhfDataField
              control={control}
              name="loai_hop_dong"
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.loai_hop_dong)}
              dataType={HOP_DONG_FIELD_DATA_TYPE.loai_hop_dong}
              label={txt('contract.form.type')}
              placeholder={txt('contract.form.typePlaceholder')}
              options={CONTRACT_TYPE_OPTIONS}
              required
            />
            <RhfDataField
              control={control}
              name="ma_hop_dong"
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.ma_hop_dong)}
              dataType={HOP_DONG_FIELD_DATA_TYPE.ma_hop_dong}
              label={txt('contract.form.code')}
              placeholder={txt('contract.form.codePlaceholder')}
              required
            />
            <RhfDataField
              control={control}
              name="ngay_ky"
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.ngay_ky)}
              dataType={HOP_DONG_FIELD_DATA_TYPE.ngay_ky}
              label={txt('contract.form.signDate')}
              required
            />
            <RhfDataField
              control={control}
              name="ngay_hieu_luc"
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.ngay_hieu_luc)}
              dataType={HOP_DONG_FIELD_DATA_TYPE.ngay_hieu_luc}
              label={txt('contract.form.effectiveDate')}
              required
            />
            <RhfDataField
              control={control}
              name="ngay_ket_thuc"
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.ngay_ket_thuc)}
              dataType={HOP_DONG_FIELD_DATA_TYPE.ngay_ket_thuc}
              label={txt('contract.form.endDate')}
            />
            <RhfDataField
              control={control}
              name="trang_thai"
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.trang_thai)}
              dataType={HOP_DONG_FIELD_DATA_TYPE.trang_thai}
              label={txt('contract.form.status')}
              options={CONTRACT_STATUS_OPTIONS}
              required
            />
          </FormGrid>
        </FormSection>

        <FormSection
          title={txt('contract.form.partyInfo')}
          icon={<Briefcase size={ICON_SIZE.compact} />}
        >
          <FormGrid>
            <RhfDataField
              control={control}
              name="id_nhan_vien"
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.id_nhan_vien)}
              dataType={HOP_DONG_FIELD_DATA_TYPE.id_nhan_vien}
              label={txt('contract.form.employee')}
              placeholder={txt('contract.form.employeePlaceholder')}
              options={employeeOptions}
              required
              disabled={lockEmployee}
            />
            <RhfDataField
              control={control}
              name="id_chuc_vu"
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.id_chuc_vu)}
              dataType={HOP_DONG_FIELD_DATA_TYPE.id_chuc_vu}
              label={txt('contract.form.position')}
              placeholder={txt('contract.form.positionPlaceholder')}
              options={positionOptions}
              required
            />
            <RhfDataField
              control={control}
              name="id_phong_ban"
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.id_phong_ban)}
              dataType={HOP_DONG_FIELD_DATA_TYPE.id_phong_ban}
              label={txt('contract.form.department')}
              placeholder={txt('contract.form.departmentPlaceholder')}
              options={departmentOptions}
              required
            />
          </FormGrid>
        </FormSection>

        <FormSection
          title={txt('contract.form.salaryInfo')}
          icon={<Wallet size={ICON_SIZE.compact} />}
        >
          <FormGrid>
            <RhfDataField
              control={control}
              name="muc_luong"
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.muc_luong)}
              dataType={HOP_DONG_FIELD_DATA_TYPE.muc_luong}
              label={txt('contract.form.salary')}
              placeholder={txt('contract.form.salaryPlaceholder')}
              required
            />
            <RhfDataField
              control={control}
              name="hinh_thuc_tra_luong"
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.hinh_thuc_tra_luong)}
              dataType={HOP_DONG_FIELD_DATA_TYPE.hinh_thuc_tra_luong}
              label={txt('contract.form.salaryMode')}
              placeholder={txt('contract.form.salaryModePlaceholder')}
              options={SALARY_MODE_OPTIONS}
              required
            />
            <RhfDataField
              control={control}
              name="noi_lam_viec"
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.noi_lam_viec)}
              dataType={HOP_DONG_FIELD_DATA_TYPE.noi_lam_viec}
              label={txt('contract.form.workplace')}
              placeholder={txt('contract.form.workplacePlaceholder')}
            />
            <RhfDataField
              control={control}
              name="thoi_gian_lam_viec"
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.thoi_gian_lam_viec)}
              dataType={HOP_DONG_FIELD_DATA_TYPE.thoi_gian_lam_viec}
              label={txt('contract.form.workingTime')}
              placeholder={txt('contract.form.workingTimePlaceholder')}
            />
            <div className="sm:col-span-2">
              <RhfDataField
                control={control}
                name="che_do_khac"
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.che_do_khac)}
                dataType={HOP_DONG_FIELD_DATA_TYPE.che_do_khac}
                label={txt('contract.form.otherBenefits')}
                placeholder={txt('contract.form.otherBenefitsPlaceholder')}
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection
          title={txt('contract.form.noteInfo')}
          icon={<StickyNote size={ICON_SIZE.compact} />}
        >
          <FormGrid>
            <div className="sm:col-span-2">
              <RhfDataField
                control={control}
                name="luu_y_khac"
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.luu_y_khac)}
                dataType={HOP_DONG_FIELD_DATA_TYPE.luu_y_khac}
                label={txt('contract.form.otherNotes')}
                placeholder={txt('contract.form.otherNotesPlaceholder')}
              />
            </div>
            <div className="sm:col-span-2">
              <RhfDataField
                control={control}
                name="ghi_chu"
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.ghi_chu)}
                dataType={HOP_DONG_FIELD_DATA_TYPE.ghi_chu}
                label={txt('contract.form.note')}
                hint={txt('contract.form.noteHint')}
              />
            </div>
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default HopDongForm;
