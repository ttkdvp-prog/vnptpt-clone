import React, { useMemo } from 'react';
import { txt } from '@/lib/text';
import { Briefcase, Power } from 'lucide-react';
import EnumBadge from '@/components/ui/EnumBadge';
import { Position } from '../core/types';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '@/components/shared/GenericDrawer';
import DetailSection from '@/components/shared/DetailSection';
import DetailField from '@/components/shared/DetailField';
import DetailFieldGrid from '@/components/shared/DetailFieldGrid';
import DetailSystemSection from '@/components/shared/DetailSystemSection';
import DetailToolbar, { DetailToolbarAction } from '@/components/shared/DetailToolbar';
import DetailFooterActions from '@/components/shared/DetailFooterActions';
import { useCan } from '@/hooks/use-can';
import { useCanOnRecord } from '@/hooks/use-can-on-record';
import { positionTrangThaiBadgeConfig } from '../utils/position-badges';
import { ICON_SIZE } from '@/lib/icon-sizes';
import { fieldIcon } from '@/lib/field-icon';
import { POSITION_FIELD_ICONS } from '../core/position-field-icons';

interface Props {
  data: Position;
  onClose: () => void;
  onEdit: (item: Position) => void;
  onDelete: (id: string) => void;
  onStatusChange?: (item: Position) => void;
  onDuplicate?: (item: Position) => void;
  maxWidthClass?: string;
  stackLevel?: number;
}

const PositionDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  onDuplicate,
  maxWidthClass = DRAWER_WIDTH_DETAIL,
  stackLevel = 0,
}) => {
  const recordCtx = { nguoi_tao: data.nguoi_tao };
  const canEdit = useCanOnRecord('edit', 'positions', recordCtx);
  const canDelete = useCanOnRecord('delete', 'positions', recordCtx);
  const canCreate = useCan('create', 'positions');
  const isActive = data.trang_thai === 'Đang hoạt động';

  const trangThaiBadgeConfig = useMemo(() => positionTrangThaiBadgeConfig(), []);

  const toolbarActions: DetailToolbarAction[] = [
    ...(onStatusChange && canEdit
      ? [
          {
            label: isActive ? txt('position.detail.deactivate') : txt('position.detail.activate'),
            icon: <Power size={ICON_SIZE.default} />,
            onClick: () => onStatusChange(data),
            variant: 'info' as const,
          },
        ]
      : []),
  ];

  const renderFooter = (
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
  );

  return (
    <GenericDrawer
      title={txt('position.detail.title')}
      subtitle={`${txt('position.detail.subtitle')}: ${data.ma_chuc_vu}`}
      icon={<Briefcase size={ICON_SIZE.prominent} />}
      onClose={onClose}
      footer={renderFooter}
      footerCompact
      maxWidthClass={maxWidthClass}
      stackLevel={stackLevel}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-primary/20 shadow-lg shrink-0">
            <Briefcase size={24} className="text-white" />
          </div>
          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            <div className="flex items-start justify-between gap-2 min-w-0">
              <h2 className="text-base font-bold text-foreground leading-tight truncate flex-1 min-w-0">
                {data.ten_chuc_vu}
              </h2>
              <div className="shrink-0">
                <EnumBadge value={data.trang_thai} config={trangThaiBadgeConfig} />
              </div>
            </div>
            <p className="text-body-sm text-muted-foreground font-mono">{data.ma_chuc_vu}</p>
          </div>
        </div>

        {toolbarActions.length > 0 && (
          <DetailToolbar actions={toolbarActions} className="bg-card rounded-xl border border-border" />
        )}

        <DetailSection
          title={txt('position.detail.basicInfo')}
          icon={<Briefcase size={ICON_SIZE.compact} />}
          variant="primary"
        >
          <DetailFieldGrid>
            <DetailField
              label={txt('position.form.code')}
              value={data.ma_chuc_vu}
              icon={fieldIcon(POSITION_FIELD_ICONS.ma_chuc_vu)}
            />
            <DetailField
              label={txt('position.form.name')}
              value={data.ten_chuc_vu}
              icon={fieldIcon(POSITION_FIELD_ICONS.ten_chuc_vu)}
            />
            <DetailField
              label={txt('position.detail.level')}
              value={data.cap_bac != null ? String(data.cap_bac) : '—'}
              icon={fieldIcon(POSITION_FIELD_ICONS.cap_bac)}
              emptyText="—"
            />
            <DetailField
              label={txt('position.detail.department')}
              value={data.ten_phong_ban ?? txt('position.unassignedDepartment')}
              icon={fieldIcon(POSITION_FIELD_ICONS.phong_ban_id)}
              emptyText="—"
            />
            <DetailField
              label={txt('position.detail.order')}
              value={String(data.thu_tu ?? 0)}
              icon={fieldIcon(POSITION_FIELD_ICONS.thu_tu)}
            />
            <DetailField
              label={txt('position.detail.description')}
              value={data.mo_ta ?? ''}
              icon={fieldIcon(POSITION_FIELD_ICONS.mo_ta)}
              emptyText="—"
            />
            <DetailField
              label={txt('common.status')}
              value={isActive ? txt('position.active') : txt('position.inactive')}
              icon={fieldIcon(POSITION_FIELD_ICONS.trang_thai)}
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSystemSection
          title={txt('position.detail.systemInfo')}
          createdAt={data.tg_tao}
          updatedAt={data.tg_cap_nhat}
          createdBy={data.ten_nguoi_tao ?? undefined}
          labels={{
            createdAt: txt('position.detail.createdAt'),
            updated: txt('position.detail.updated'),
          }}
        />
      </div>
    </GenericDrawer>
  );
};

export default PositionDetail;
