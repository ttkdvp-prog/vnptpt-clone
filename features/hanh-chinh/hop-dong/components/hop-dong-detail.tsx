import { useMemo } from 'react';
import { Briefcase, FileSignature, Printer, StickyNote, Wallet } from 'lucide-react';
import { txt } from '@/lib/text';
import { ICON_SIZE } from '@/lib/icon-sizes';
import { fieldIcon } from '@/lib/field-icon';
import { formatDate } from '@/lib/utils';
import {
  DetailField,
  DetailFieldGrid,
  DetailFooterActions,
  DetailSection,
  DetailSystemSection,
  DetailToolbar,
  GenericDrawer,
} from '@/components/views';
import type { DetailToolbarAction } from '@/components/shared/DetailToolbar';
import { DRAWER_WIDTH_DETAIL } from '@/components/shared/GenericDrawer';
import { useCan } from '@/hooks/use-can';
import { useCanOnRecord } from '@/hooks/use-can-on-record';
import type { HopDong } from '../core/types';
import { SALARY_MODE_LABELS } from '../core/types';
import { HOP_DONG_FIELD_ICONS } from '../core/hop-dong-field-icons';
import { ContractStatusBadge, ContractTypeBadge } from './hop-dong-badges';
import { openContractPrintTab } from '../utils/open-contract-print';

interface Props {
  data: HopDong;
  onClose: () => void;
  onEdit: (item: HopDong) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (item: HopDong) => void;
  maxWidthClass?: string;
  stackLevel?: number;
}

const HopDongDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  maxWidthClass = DRAWER_WIDTH_DETAIL,
  stackLevel = 0,
}) => {
  const recordCtx = { nguoi_tao: data.nguoi_tao };
  const canEdit = useCanOnRecord('edit', 'contracts', recordCtx);
  const canDelete = useCanOnRecord('delete', 'contracts', recordCtx);
  const canCreate = useCan('create', 'contracts');

  const toolbarActions = useMemo(
    (): DetailToolbarAction[] => [
      {
        label: txt('contract.detail.print'),
        icon: <Printer />,
        onClick: () => openContractPrintTab(data.id),
        variant: 'primary',
      },
    ],
    [data.id],
  );

  const salaryModeLabel =
    SALARY_MODE_LABELS[data.hinh_thuc_tra_luong as keyof typeof SALARY_MODE_LABELS] ??
    data.hinh_thuc_tra_luong;

  return (
    <GenericDrawer
      title={txt('contract.detail.title')}
      subtitle={txt('contract.detail.subtitle')}
      icon={<FileSignature size={ICON_SIZE.prominent} />}
      onClose={onClose}
      maxWidthClass={maxWidthClass}
      stackLevel={stackLevel}
      footerCompact
      footer={
        <DetailFooterActions
          onClose={onClose}
          onDuplicate={
            canCreate && onDuplicate
              ? () => {
                  onDuplicate(data);
                  onClose();
                }
              : undefined
          }
          onEdit={
            canEdit
              ? () => {
                  onEdit(data);
                  onClose();
                }
              : undefined
          }
          onDelete={
            canDelete
              ? () => {
                  onDelete(data.id);
                  onClose();
                }
              : undefined
          }
        />
      }
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shrink-0">
            <FileSignature size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground truncate">
              {data.ma_hop_dong}
            </h2>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <ContractTypeBadge value={data.loai_hop_dong} />
              <ContractStatusBadge value={data.trang_thai} />
              {data.ten_nhan_vien ? (
                <span className="text-xs text-muted-foreground">{data.ten_nhan_vien}</span>
              ) : null}
            </div>
          </div>
        </div>

        <DetailToolbar
          actions={toolbarActions}
          className="bg-card rounded-xl border border-border"
        />

        <DetailSection
          title={txt('contract.detail.generalInfo')}
          icon={<FileSignature size={14} />}
        >
          <DetailFieldGrid>
            <DetailField
              label={txt('contract.form.code')}
              value={data.ma_hop_dong}
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.ma_hop_dong)}
            />
            <DetailField
              label={txt('contract.form.type')}
              value={<ContractTypeBadge value={data.loai_hop_dong} />}
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.loai_hop_dong)}
            />
            <DetailField
              label={txt('contract.form.signDate')}
              value={data.ngay_ky ? formatDate(data.ngay_ky) : '—'}
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.ngay_ky)}
            />
            <DetailField
              label={txt('contract.form.effectiveDate')}
              value={data.ngay_hieu_luc ? formatDate(data.ngay_hieu_luc) : '—'}
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.ngay_hieu_luc)}
            />
            <DetailField
              label={txt('contract.form.endDate')}
              value={
                data.ngay_ket_thuc
                  ? formatDate(data.ngay_ket_thuc)
                  : txt('contract.print.field.indefinite')
              }
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.ngay_ket_thuc)}
            />
            <DetailField
              label={txt('contract.form.status')}
              value={<ContractStatusBadge value={data.trang_thai} />}
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.trang_thai)}
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection
          title={txt('contract.detail.partyInfo')}
          icon={<Briefcase size={14} />}
        >
          <DetailFieldGrid>
            <DetailField
              label={txt('contract.form.employee')}
              value={data.ten_nhan_vien || data.id_nhan_vien}
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.id_nhan_vien)}
            />
            <DetailField
              label={txt('contract.form.position')}
              value={data.ten_chuc_vu || data.id_chuc_vu}
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.id_chuc_vu)}
            />
            <DetailField
              label={txt('contract.form.department')}
              value={data.ten_phong_ban || data.id_phong_ban}
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.id_phong_ban)}
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection
          title={txt('contract.detail.salaryInfo')}
          icon={<Wallet size={14} />}
        >
          <DetailFieldGrid>
            <DetailField
              label={txt('contract.form.salary')}
              value={data.muc_luong || '—'}
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.muc_luong)}
            />
            <DetailField
              label={txt('contract.form.salaryMode')}
              value={salaryModeLabel}
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.hinh_thuc_tra_luong)}
            />
            <DetailField
              label={txt('contract.form.workplace')}
              value={data.noi_lam_viec || '—'}
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.noi_lam_viec)}
            />
            <DetailField
              label={txt('contract.form.workingTime')}
              value={data.thoi_gian_lam_viec || '—'}
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.thoi_gian_lam_viec)}
            />
            <DetailField
              label={txt('contract.form.otherBenefits')}
              value={data.che_do_khac || '—'}
              className="sm:col-span-2"
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.che_do_khac)}
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection
          title={txt('contract.detail.noteInfo')}
          icon={<StickyNote size={14} />}
        >
          <DetailFieldGrid>
            <DetailField
              label={txt('contract.form.otherNotes')}
              value={data.luu_y_khac || '—'}
              className="sm:col-span-2"
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.luu_y_khac)}
            />
            <DetailField
              label={txt('contract.form.note')}
              value={data.ghi_chu || '—'}
              className="sm:col-span-2"
              icon={fieldIcon(HOP_DONG_FIELD_ICONS.ghi_chu)}
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSystemSection
          title={txt('contract.detail.systemInfo')}
          createdAt={data.tg_tao}
          updatedAt={data.tg_cap_nhat}
          createdBy={data.ten_nguoi_tao ?? data.nguoi_tao ?? undefined}
          labels={{
            createdAt: txt('contract.detail.createdAt'),
            updated: txt('contract.detail.updated'),
          }}
        />
      </div>
    </GenericDrawer>
  );
};

export default HopDongDetail;
