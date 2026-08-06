import React, { useCallback, useMemo, memo, useState } from 'react';
import { txt } from '@/lib/text';
import { ICON_SIZE } from '@/lib/icon-sizes';
import { Employee } from '../core/types';
import {
  User,
  Mail,
  Phone,
  Briefcase,
  Printer,
  FileSignature,
  ScrollText,
  KeyRound,
} from 'lucide-react';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '@/components/shared/GenericDrawer';
import DetailFooterActions from '@/components/shared/DetailFooterActions';
import type { DrawerOverlayTier } from '@/lib/dialog-sizes';
import type { DetailToolbarAction } from '@/components/shared/DetailToolbar';
import Combobox from '@/components/ui/Combobox';
import EnumBadge from '@/components/ui/EnumBadge';
import PreviewableImage from '@/components/ui/PreviewableImage';
import TabGroup from '@/components/ui/TabGroup';
import { cn, getAvatarUrl } from '@/lib/utils';
import { openEmployeeProfilePreviewTab } from '../utils/open-employee-profile-preview';
import { CONFIRM_YES } from '@/lib/button-labels';
import { useConfirmStore } from '@/store/useConfirmStore';
import { useUpdateStatusEmployee } from '../hooks/use-nhan-vien';
import { STATUS_OPTIONS, STATUS_BADGE_CONFIG } from '../core/constants';
import { useCan } from '@/hooks/use-can';
import { useCanOnRecord } from '@/hooks/use-can-on-record';
import { useAuthStore } from '@/store/useStore';
import { NhanVienDetailInfo } from './nhan-vien-detail-info';
import { NhanVienDetailContracts } from './nhan-vien-detail-contracts';
import { NhanVienDetailDecisions } from './nhan-vien-detail-decisions';
import NhanVienChangePasswordDialog from './nhan-vien-change-password-dialog';

type DetailTabId = 'info' | 'contracts' | 'decisions';

interface Props {
  data: Employee;
  onClose: () => void;
  onEdit: (item: Employee) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (item: Employee) => void;
  overlayTier?: DrawerOverlayTier;
}

const EmployeeDetailComponent: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  overlayTier = 'default',
}) => {
  const [activeTab, setActiveTab] = useState<DetailTabId>('info');
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const confirm = useConfirmStore((state) => state.confirm);
  const statusMutation = useUpdateStatusEmployee();
  const currentUser = useAuthStore((state) => state.user);
  const recordCtx = { nguoi_tao: data.nguoi_tao };
  const canEdit = useCanOnRecord('edit', 'employees', recordCtx);
  const canDelete = useCanOnRecord('delete', 'employees', recordCtx);
  const canViewExtras = useCanOnRecord('view', 'employees', recordCtx);
  const canCreate = useCan('create', 'employees');
  const canResetPassword = currentUser?.cap_bac === 1 || currentUser?.role === 'admin';

  const tabs = useMemo(
    () => [
      { id: 'info', label: txt('employee.detail.tabInfo'), icon: User },
      { id: 'contracts', label: txt('employee.detail.tabContracts'), icon: FileSignature },
      { id: 'decisions', label: txt('employee.detail.tabDecisions'), icon: ScrollText },
    ],
    [],
  );

  const handleUpdateStatus = useCallback(() => {
    let selectedStatus: Employee['trang_thai'] = data.trang_thai;

    confirm({
      title: txt('employee.statusChangeTitle'),
      message: (
        <div className="space-y-4 text-left py-2">
          <p className="text-sm">
            {txt('employee.statusChangeMessage')} <strong>{data.ho_ten}</strong>:
          </p>
          <Combobox
            value={data.trang_thai}
            options={STATUS_OPTIONS.map((o) => ({ label: o.label, value: o.value }))}
            onChange={(v) => {
              selectedStatus = v as Employee['trang_thai'];
            }}
            searchable={false}
            dropdownInPortal
          />
        </div>
      ),
      variant: 'info',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        await statusMutation.mutateAsync({ ids: [data.id], status: selectedStatus });
      },
    });
  }, [data.id, data.trang_thai, data.ho_ten, confirm, statusMutation]);

  const handleChangePassword = useCallback(() => {
    setChangePasswordOpen(true);
  }, []);

  const toolbarActions = useMemo((): DetailToolbarAction[] => {
    const actions: DetailToolbarAction[] = [];
    if (canEdit) {
      actions.push({
        label: txt('employee.detail.changeStatus'),
        icon: <Briefcase />,
        onClick: handleUpdateStatus,
        variant: 'info',
      });
    }
    if (canResetPassword) {
      actions.push({
        label: txt('employee.detail.changePassword'),
        icon: <KeyRound />,
        onClick: handleChangePassword,
        variant: 'secondary',
      });
    }
    if (canViewExtras) {
      actions.push(
        {
          label: txt('employee.detail.print'),
          icon: <Printer />,
          onClick: () => openEmployeeProfilePreviewTab(data.id),
          variant: 'secondary',
        },
        {
          label: txt('employee.detail.sendEmail'),
          icon: <Mail />,
          onClick: () => {
            window.location.href = `mailto:${data.email}`;
          },
          variant: 'primary',
        },
        {
          label: txt('employee.detail.callPhone'),
          icon: <Phone />,
          onClick: () => {
            window.location.href = `tel:${data.so_dien_thoai}`;
          },
          variant: 'success',
        },
      );
    }
    return actions;
  }, [
    handleUpdateStatus,
    handleChangePassword,
    data.id,
    data.email,
    data.so_dien_thoai,
    canEdit,
    canResetPassword,
    canViewExtras,
  ]);

  const renderFooter = useMemo(
    () => (
      <DetailFooterActions
        onClose={onClose}
        onDuplicate={
          canCreate && onDuplicate ? () => onDuplicate(data) : undefined
        }
        onEdit={canEdit ? () => onEdit(data) : undefined}
        onDelete={canDelete ? () => onDelete(data.id) : undefined}
      />
    ),
    [onClose, onEdit, onDelete, onDuplicate, data, canEdit, canDelete, canCreate],
  );

  return (
    <GenericDrawer
      title={txt('employee.detail.title')}
      subtitle={data.ho_ten}
      icon={<User size={ICON_SIZE.prominent} />}
      onClose={onClose}
      footer={renderFooter}
      footerCompact
      maxWidthClass={DRAWER_WIDTH_DETAIL}
      overlayTier={overlayTier}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="relative shrink-0">
            <PreviewableImage
              src={data.anh_dai_dien || getAvatarUrl(data.ho_ten ?? '')}
              alt={data.ho_ten}
              imgClassName="w-14 h-14 rounded-xl border-2 border-card shadow-md object-cover bg-card"
            />
            <div
              className={cn(
                'absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card shadow-sm pointer-events-none',
                data.trang_thai === 'Đang làm việc' ? 'bg-emerald-500' : 'bg-muted-foreground/30',
              )}
            />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <div className="flex items-center justify-between gap-2 min-w-0">
              <h2 className="text-base font-bold text-foreground leading-tight truncate flex-1 min-w-0">
                {data.ho_ten}
              </h2>
              <div className="shrink-0">
                <EnumBadge value={data.trang_thai} config={STATUS_BADGE_CONFIG} />
              </div>
            </div>
            <p className="text-body-sm text-primary font-medium">{data.ten_chuc_vu}</p>
          </div>
        </div>

        <TabGroup
          tabs={tabs}
          activeTab={activeTab}
          onChange={(id) => setActiveTab(id as DetailTabId)}
          className="w-full sm:w-fit"
        />

        {activeTab === 'info' ? (
          <NhanVienDetailInfo data={data} toolbarActions={toolbarActions} />
        ) : null}
        {activeTab === 'contracts' ? (
          <NhanVienDetailContracts employeeId={data.id} />
        ) : null}
        {activeTab === 'decisions' ? <NhanVienDetailDecisions /> : null}
      </div>

      <NhanVienChangePasswordDialog
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        employeeId={data.id}
        employeeName={data.ho_ten}
      />
    </GenericDrawer>
  );
};

export default memo(EmployeeDetailComponent);
