import { useCallback, useMemo } from 'react';
import {
  Ban,
  CheckCircle2,
  FileText,
  ImageIcon,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';
import { toast } from 'sonner';
import PreviewableImage from '@/components/ui/PreviewableImage';
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
import { CONFIRM_YES } from '@/lib/button-labels';
import { useCan } from '@/hooks/use-can';
import { useCanOnRecord } from '@/hooks/use-can-on-record';
import { useAuthStore } from '@/store/useStore';
import { useConfirmStore } from '@/store/useConfirmStore';
import type { PhieuHanhChinh } from '../core/types';
import { PHIEU_HANH_CHINH_FIELD_ICONS } from '../core/phieu-hanh-chinh-field-icons';
import {
  useApprovePhieuHcns,
  useApprovePhieuQl,
  useCancelPhieuHanhChinh,
  useRejectPhieuHanhChinh,
} from '../hooks/use-phieu-hanh-chinh';
import { useCanManageLockedPhieuHanhChinh } from '../hooks/use-phieu-hanh-chinh-privileged';
import {
  canApproveHcns,
  canApproveQl,
  canCancelPhieu,
  canDeletePhieu,
  canEditPhieu,
  canRejectPhieu,
  getApproveHcnsConfirm,
  getApproveQlConfirm,
  getCancelConfirm,
  getRejectConfirm,
} from '../utils/approve-workflow';
import { PhieuBuoiBadge, PhieuHanhChinhStatusBadge } from './phieu-hanh-chinh-badges';

interface Props {
  data: PhieuHanhChinh;
  onClose: () => void;
  onEdit: (item: PhieuHanhChinh) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (item: PhieuHanhChinh) => void;
  maxWidthClass?: string;
  stackLevel?: number;
}

const PhieuHanhChinhDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  maxWidthClass = DRAWER_WIDTH_DETAIL,
  stackLevel = 0,
}) => {
  const confirm = useConfirmStore((s) => s.confirm);
  const approveQlMutation = useApprovePhieuQl();
  const approveHcnsMutation = useApprovePhieuHcns();
  const rejectMutation = useRejectPhieuHanhChinh();
  const cancelMutation = useCancelPhieuHanhChinh();
  const currentEmployeeId = useAuthStore((s) => s.user?.employee_id ?? null);

  const recordCtx = { nguoi_tao: data.nguoi_tao };
  const canEdit = useCanOnRecord('edit', 'adminForms', recordCtx);
  const canDelete = useCanOnRecord('delete', 'adminForms', recordCtx);
  const canCreate = useCan('create', 'adminForms');
  const canManageLocked = useCanManageLockedPhieuHanhChinh();

  const handleApproveQl = useCallback(() => {
    const { title, message } = getApproveQlConfirm();
    confirm({
      title,
      message,
      variant: 'info',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        await approveQlMutation.mutateAsync({ id: data.id });
      },
    });
  }, [approveQlMutation, confirm, data.id]);

  const handleApproveHcns = useCallback(() => {
    const { title, message } = getApproveHcnsConfirm();
    confirm({
      title,
      message,
      variant: 'info',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        await approveHcnsMutation.mutateAsync({ id: data.id });
      },
    });
  }, [approveHcnsMutation, confirm, data.id]);

  const handleReject = useCallback(() => {
    const { title, message } = getRejectConfirm();
    confirm({
      title,
      message,
      variant: 'danger',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        const reason = window.prompt(txt('adminForm.rejectReasonPrompt'));
        if (reason == null) return;
        if (!reason.trim()) {
          toast.error(txt('adminForm.rejectReasonRequired'));
          return;
        }
        await rejectMutation.mutateAsync({
          id: data.id,
          ly_do_tu_choi: reason.trim(),
        });
      },
    });
  }, [confirm, data.id, rejectMutation]);

  const handleCancel = useCallback(() => {
    const { title, message } = getCancelConfirm();
    confirm({
      title,
      message,
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        await cancelMutation.mutateAsync(data.id);
      },
    });
  }, [cancelMutation, confirm, data.id]);

  const showCancel = canCancelPhieu(data.trang_thai, {
    currentEmployeeId,
    id_nhan_vien: data.id_nhan_vien,
    nguoi_tao: data.nguoi_tao,
  });

  const toolbarActions = useMemo((): DetailToolbarAction[] => {
    const actions: DetailToolbarAction[] = [];
    if (canEdit && canApproveQl(data.trang_thai)) {
      actions.push({
        label: txt('adminForm.approveQlAction'),
        icon: <CheckCircle2 />,
        onClick: handleApproveQl,
        variant: 'success',
      });
    }
    if (canEdit && canApproveHcns(data.trang_thai)) {
      actions.push({
        label: txt('adminForm.approveHcnsAction'),
        icon: <CheckCircle2 />,
        onClick: handleApproveHcns,
        variant: 'success',
      });
    }
    if (canEdit && canRejectPhieu(data.trang_thai)) {
      actions.push({
        label: txt('adminForm.rejectAction'),
        icon: <ShieldX />,
        onClick: handleReject,
        variant: 'danger',
      });
    }
    if (showCancel) {
      actions.push({
        label: txt('adminForm.cancelAction'),
        icon: <Ban />,
        onClick: handleCancel,
        variant: 'danger',
      });
    }
    return actions;
  }, [
    canEdit,
    data.trang_thai,
    handleApproveQl,
    handleApproveHcns,
    handleReject,
    handleCancel,
    showCancel,
  ]);

  const showEdit =
    canEdit && canEditPhieu(data.trang_thai, canManageLocked);
  const showDelete =
    canDelete && canDeletePhieu(data.trang_thai, canManageLocked);

  return (
    <GenericDrawer
      title={txt('adminForm.detail.title')}
      subtitle={txt('adminForm.detail.subtitle')}
      icon={<FileText size={ICON_SIZE.prominent} />}
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
            showEdit
              ? () => {
                  onEdit(data);
                  onClose();
                }
              : undefined
          }
          onDelete={
            showDelete
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
            <FileText size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-base font-bold text-foreground truncate">
                {data.ten_loai_phieu || txt('adminForm.title')}
              </h2>
              {data.ma_phieu && (
                <span className="font-mono text-xs text-muted-foreground shrink-0">
                  {data.ma_phieu}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <PhieuHanhChinhStatusBadge value={data.trang_thai} />
              {data.ten_nhan_vien && (
                <span className="text-xs text-muted-foreground truncate">
                  {data.ten_nhan_vien}
                </span>
              )}
            </div>
          </div>
        </div>

        <DetailToolbar
          actions={toolbarActions}
          className="bg-card rounded-xl border border-border"
        />

        <DetailSection title={txt('adminForm.form.generalInfo')} icon={<FileText size={14} />}>
          <DetailFieldGrid>
            <DetailField
              label={txt('adminForm.form.type')}
              value={
                data.ten_loai_phieu
                  ? `${data.ma_phieu ? `${data.ma_phieu} — ` : ''}${data.ten_loai_phieu}`
                  : '—'
              }
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.ten_loai_phieu)}
            />
            <DetailField
              label={txt('adminForm.form.employee')}
              value={data.ten_nhan_vien || '—'}
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.id_nhan_vien)}
            />
            <DetailField
              label={txt('adminForm.filterDepartment')}
              value={data.ten_phong_ban || '—'}
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.ten_phong_ban)}
            />
            <DetailField
              label={txt('adminForm.detail.status')}
              value={<PhieuHanhChinhStatusBadge value={data.trang_thai} />}
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.trang_thai)}
            />
            <DetailField
              label={txt('adminForm.form.reason')}
              value={data.ly_do || '—'}
              className="sm:col-span-2"
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.ly_do)}
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={txt('adminForm.form.timeInfo')} icon={<FileText size={14} />}>
          <DetailFieldGrid>
            <DetailField
              label={txt('adminForm.form.fromDate')}
              value={data.tu_ngay ? formatDate(data.tu_ngay) : '—'}
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.tu_ngay)}
            />
            <DetailField
              label={txt('adminForm.form.startShift')}
              value={<PhieuBuoiBadge value={data.buoi_bat_dau} />}
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.buoi_bat_dau)}
            />
            <DetailField
              label={txt('adminForm.form.toDate')}
              value={data.den_ngay ? formatDate(data.den_ngay) : '—'}
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.den_ngay)}
            />
            <DetailField
              label={txt('adminForm.form.endShift')}
              value={<PhieuBuoiBadge value={data.buoi_ket_thuc} />}
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.buoi_ket_thuc)}
            />
            <DetailField
              label={txt('adminForm.form.startTime')}
              value={data.gio_bat_dau || '—'}
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.gio_bat_dau)}
            />
            <DetailField
              label={txt('adminForm.form.endTime')}
              value={data.gio_ket_thuc || '—'}
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.gio_ket_thuc)}
            />
          </DetailFieldGrid>
        </DetailSection>

        {data.hinh_anh.length > 0 && (
          <DetailSection title={txt('adminForm.detail.images')} icon={<ImageIcon size={14} />}>
            <div className="flex flex-wrap gap-2">
              {data.hinh_anh.map((src) => (
                <PreviewableImage
                  key={src}
                  src={src}
                  alt={txt('adminForm.detail.images')}
                  className="h-20 w-20 rounded-lg object-cover border border-border"
                />
              ))}
            </div>
          </DetailSection>
        )}

        <DetailSection
          title={txt('adminForm.detail.approvalInfo')}
          icon={<ShieldCheck size={14} />}
        >
          <DetailFieldGrid>
            <DetailField
              label={txt('adminForm.detail.status')}
              value={<PhieuHanhChinhStatusBadge value={data.trang_thai} />}
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.trang_thai)}
            />
            <DetailField
              label={txt('adminForm.detail.qlApprover')}
              value={data.ten_ql_duyet || '—'}
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.ten_ql_duyet)}
            />
            <DetailField
              label={txt('adminForm.detail.qlApprovedAt')}
              value={data.tg_ql_duyet ? formatDate(data.tg_ql_duyet) : '—'}
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.tg_ql_duyet)}
            />
            <DetailField
              label={txt('adminForm.detail.qlNote')}
              value={data.ghi_chu_ql || '—'}
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.ghi_chu_ql)}
            />
            <DetailField
              label={txt('adminForm.detail.hcnsApprover')}
              value={data.ten_hcns_duyet || '—'}
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.ten_hcns_duyet)}
            />
            <DetailField
              label={txt('adminForm.detail.hcnsApprovedAt')}
              value={data.tg_hcns_duyet ? formatDate(data.tg_hcns_duyet) : '—'}
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.tg_hcns_duyet)}
            />
            <DetailField
              label={txt('adminForm.detail.hcnsNote')}
              value={data.ghi_chu_hcns || '—'}
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.ghi_chu_hcns)}
            />
            <DetailField
              label={txt('adminForm.detail.rejectReason')}
              value={data.ly_do_tu_choi || '—'}
              className="sm:col-span-2"
              icon={fieldIcon(PHIEU_HANH_CHINH_FIELD_ICONS.ly_do_tu_choi)}
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSystemSection
          title={txt('adminForm.detail.systemInfo')}
          createdAt={data.tg_tao}
          updatedAt={data.tg_cap_nhat}
          createdBy={data.ten_nguoi_tao ?? data.nguoi_tao ?? undefined}
          labels={{
            createdAt: txt('adminForm.detail.createdAt'),
            updated: txt('adminForm.detail.updated'),
          }}
        />
      </div>
    </GenericDrawer>
  );
};

export default PhieuHanhChinhDetail;
