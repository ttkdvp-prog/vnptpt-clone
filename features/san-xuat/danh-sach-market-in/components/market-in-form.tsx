import { useEffect, useMemo } from 'react';
import { useForm, type Resolver, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { FileText, Link2, Printer } from 'lucide-react';
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
import { listQueryOptions } from '@/lib/query/query-config';
import { queryKeys } from '@/lib/query-keys';
import { getKhachHangList } from '@/features/kinh-doanh/khach-hang/services/khach-hang-service';
import { getEmployees } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import { marketInSchema, type MarketInFormValues } from '../core/schema';
import { MARKET_IN_FIELD_DATA_TYPE } from '../core/market-in-field-meta';
import type { MarketIn } from '../core/types';
import {
  useCreateMarketIn,
  useNextMaMarket,
  useUpdateMarketIn,
} from '../hooks/use-market-in';
import { fieldIcon } from '@/lib/field-icon';
import { MARKET_IN_FIELD_ICONS } from '../core/market-in-field-icons';

const FORM_ID = 'market-in-form';

const DEFAULT_VALUES: MarketInFormValues = {
  thu_tu: 0,
  id_khach_hang: '',
  ma_san_pham: '',
  ma_market: '',
  mo_ta: null,
  link_file: null,
  id_nguoi_ve: null,
  ngay_hieu_luc: null,
};

interface Props {
  initialData: MarketIn | null;
  /** `duplicate`: tạo mới điền sẵn từ `initialData` (reset mã market, link file). */
  mode?: FormMode;
  onClose: () => void;
  stackLevel?: number;
}

const MarketInForm: React.FC<Props> = ({
  initialData,
  mode,
  onClose,
  stackLevel = 0,
}) => {
  const isDuplicate = mode === 'duplicate';
  const isEdit = !!initialData && !isDuplicate;
  const canCreate = useCan('create', 'printMarkets');
  const canEditRecord = useCanOnRecord('edit', 'printMarkets', {
    nguoi_tao: initialData?.nguoi_tao,
  });
  const canSave = isEdit ? canEditRecord : canCreate;

  useEffect(() => {
    if (!canSave) {
      toast.error(txt('shared.error.forbidden'));
      onClose();
    }
  }, [canSave, onClose]);

  const createMutation = useCreateMarketIn(onClose);
  const updateMutation = useUpdateMarketIn(onClose);

  const { data: customers = [] } = useQuery({
    queryKey: queryKeys.customers.all,
    queryFn: getKhachHangList,
    ...listQueryOptions,
  });
  const { data: employees = [] } = useQuery({
    queryKey: [...queryKeys.employees.all, 'picker'] as const,
    queryFn: () => getEmployees({ limit: 100, offset: 0 }),
    ...listQueryOptions,
  });
  const { data: suggestedMa } = useNextMaMarket(!isEdit);

  const customerOptions = useMemo(
    () =>
      customers.map((c) => ({
        value: c.id,
        label: `${c.ma_khach_hang} — ${c.ten_khach_hang}`,
      })),
    [customers],
  );
  const employeeOptions = useMemo(
    () => employees.map((e) => ({ value: e.id, label: e.ho_ten })),
    [employees],
  );

  const { control, handleSubmit, reset, getValues, setValue } = useForm<MarketInFormValues>({
    resolver: zodResolver(marketInSchema) as Resolver<MarketInFormValues>,
    defaultValues: DEFAULT_VALUES,
  });

  useEffect(() => {
    if (initialData) {
      reset({
        thu_tu: initialData.thu_tu,
        id_khach_hang: initialData.id_khach_hang,
        ma_san_pham: initialData.ma_san_pham,
        ma_market: initialData.ma_market,
        mo_ta: initialData.mo_ta,
        link_file: initialData.link_file,
        id_nguoi_ve: initialData.id_nguoi_ve,
        ngay_hieu_luc: initialData.ngay_hieu_luc,
        // Sao chép: mã market phải nhập lại (unique), không copy link file đính kèm.
        ...(isDuplicate && {
          ma_market: DEFAULT_VALUES.ma_market,
          link_file: DEFAULT_VALUES.link_file,
        }),
      });
    } else {
      reset(DEFAULT_VALUES);
    }
  }, [initialData, isDuplicate, reset]);

  useEffect(() => {
    if (isEdit || !suggestedMa) return;
    if (!getValues('ma_market')) {
      setValue('ma_market', suggestedMa);
    }
  }, [isEdit, suggestedMa, getValues, setValue]);

  const onSubmit: SubmitHandler<MarketInFormValues> = (values) => {
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <GenericDrawer
      title={isEdit ? txt('printMarket.form.editTitle') : txt('printMarket.form.createTitle')}
      subtitle={
        isEdit ? txt('printMarket.form.editSubtitle') : txt('printMarket.form.createSubtitle')
      }
      icon={<Printer size={ICON_SIZE.prominent} />}
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
          createIcon={<Printer className="w-3.5 h-3.5 mr-1.5 shrink-0" />}
        />
      }
    >
      <form id={FORM_ID} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <FormSection
          title={txt('printMarket.form.generalInfo')}
          icon={<FileText size={ICON_SIZE.compact} />}
        >
          <FormGrid>
            <RhfDataField
              control={control}
              name="thu_tu"
              icon={fieldIcon(MARKET_IN_FIELD_ICONS.thu_tu)}
              dataType={MARKET_IN_FIELD_DATA_TYPE.thu_tu}
              label={txt('printMarket.form.order')}
              required
            />
            <RhfDataField
              control={control}
              name="ma_market"
              icon={fieldIcon(MARKET_IN_FIELD_ICONS.ma_market)}
              dataType={MARKET_IN_FIELD_DATA_TYPE.ma_market}
              label={txt('printMarket.form.marketCode')}
              placeholder={txt('printMarket.form.marketCodePlaceholder')}
              required
            />
            <RhfDataField
              control={control}
              name="ma_san_pham"
              icon={fieldIcon(MARKET_IN_FIELD_ICONS.ma_san_pham)}
              dataType={MARKET_IN_FIELD_DATA_TYPE.ma_san_pham}
              label={txt('printMarket.form.productCode')}
              placeholder={txt('printMarket.form.productCodePlaceholder')}
              required
            />
            <RhfDataField
              control={control}
              name="id_khach_hang"
              icon={fieldIcon(MARKET_IN_FIELD_ICONS.id_khach_hang)}
              dataType={MARKET_IN_FIELD_DATA_TYPE.id_khach_hang}
              label={txt('printMarket.form.customer')}
              placeholder={txt('printMarket.form.customerPlaceholder')}
              options={customerOptions}
              required
            />
            <RhfDataField
              control={control}
              name="id_nguoi_ve"
              icon={fieldIcon(MARKET_IN_FIELD_ICONS.id_nguoi_ve)}
              dataType={MARKET_IN_FIELD_DATA_TYPE.id_nguoi_ve}
              label={txt('printMarket.form.artist')}
              placeholder={txt('printMarket.form.artistPlaceholder')}
              options={employeeOptions}
            />
            <div className="sm:col-span-2">
              <RhfDataField
                control={control}
                name="mo_ta"
              icon={fieldIcon(MARKET_IN_FIELD_ICONS.mo_ta)}
                dataType={MARKET_IN_FIELD_DATA_TYPE.mo_ta}
                label={txt('printMarket.form.description')}
              />
            </div>
          </FormGrid>
        </FormSection>

        <FormSection
          title={txt('printMarket.form.fileInfo')}
          icon={<Link2 size={ICON_SIZE.compact} />}
        >
          <FormGrid>
            <RhfDataField
              control={control}
              name="link_file"
              icon={fieldIcon(MARKET_IN_FIELD_ICONS.link_file)}
              dataType={MARKET_IN_FIELD_DATA_TYPE.link_file}
              label={txt('printMarket.form.linkFile')}
              placeholder={txt('printMarket.form.linkFilePlaceholder')}
            />
            <RhfDataField
              control={control}
              name="ngay_hieu_luc"
              icon={fieldIcon(MARKET_IN_FIELD_ICONS.ngay_hieu_luc)}
              dataType={MARKET_IN_FIELD_DATA_TYPE.ngay_hieu_luc}
              label={txt('printMarket.form.effectiveDate')}
            />
          </FormGrid>
        </FormSection>
      </form>
    </GenericDrawer>
  );
};

export default MarketInForm;
