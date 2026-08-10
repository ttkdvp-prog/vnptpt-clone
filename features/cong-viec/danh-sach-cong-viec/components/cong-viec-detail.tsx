import React, { useMemo, memo } from 'react';
import { txt } from '@/lib/text';
import { ICON_SIZE } from '@/lib/icon-sizes';
import { ClipboardList, Users, Paperclip } from 'lucide-react';
import { CongViec, getCongViecTrangThai } from '../core/types';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '@/components/shared/GenericDrawer';
import DetailFooterActions from '@/components/shared/DetailFooterActions';
import DetailSection from '@/components/shared/DetailSection';
import DetailField from '@/components/shared/DetailField';
import DetailFieldGrid from '@/components/shared/DetailFieldGrid';
import DetailSystemSection from '@/components/shared/DetailSystemSection';
import type { DrawerOverlayTier } from '@/lib/dialog-sizes';
import EnumBadge from '@/components/ui/EnumBadge';
import { formatDate } from '@/lib/utils';
import { CAP_BADGE_CONFIG, UU_TIEN_BADGE_CONFIG, TRANG_THAI_BADGE_CONFIG } from '../core/constants';
import { useCan } from '@/hooks/use-can';

interface Props {
  data: CongViec;
  onClose: () => void;
  onEdit: (item: CongViec) => void;
  onDelete: (id: string) => void;
  overlayTier?: DrawerOverlayTier;
}

const CongViecDetailComponent: React.FC<Props> = ({ data, onClose, onEdit, onDelete, overlayTier = 'default' }) => {
  const canEdit = useCan('edit', 'cong-viec');
  const canDelete = useCan('delete', 'cong-viec');

  const renderFooter = useMemo(
    () => (
      <DetailFooterActions
        onClose={onClose}
        onEdit={canEdit ? () => onEdit(data) : undefined}
        onDelete={canDelete ? () => onDelete(data.id) : undefined}
      />
    ),
    [onClose, onEdit, onDelete, data, canEdit, canDelete],
  );

  return (
    <GenericDrawer
      title={txt('congViec.detail.title')}
      subtitle={data.tieu_de}
      icon={<ClipboardList size={ICON_SIZE.prominent} />}
      onClose={onClose}
      footer={renderFooter}
      footerCompact
      maxWidthClass={DRAWER_WIDTH_DETAIL}
      overlayTier={overlayTier}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.tieu_de}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">#{data.id}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <EnumBadge value={data.cap} config={CAP_BADGE_CONFIG} />
            <EnumBadge value={getCongViecTrangThai(data)} config={TRANG_THAI_BADGE_CONFIG} />
          </div>
        </div>

        <DetailSection title={txt('congViec.form.assignment')} icon={<Users size={ICON_SIZE.compact} />}>
          <DetailFieldGrid>
            <DetailField label={txt('congViec.field.toAr')} value={data.to_ar} />
            <DetailField label={txt('congViec.field.toR')} value={data.to_r} />
            <DetailField label={txt('congViec.field.mnvA')} value={data.mnv_a} />
            <DetailField label={txt('congViec.field.uuTien')} value={<EnumBadge value={data.uu_tien} config={UU_TIEN_BADGE_CONFIG} />} />
            <DetailField label={txt('congViec.field.mnvR')} value={data.mnv_r} />
            <DetailField label={txt('congViec.field.mnvC')} value={data.mnv_c} />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={txt('congViec.form.schedule')} icon={<ClipboardList size={ICON_SIZE.compact} />}>
          <DetailFieldGrid>
            <DetailField label={txt('congViec.field.ngayBd')} value={formatDate(data.ngay_bd)} />
            <DetailField label={txt('congViec.field.ngayKt')} value={formatDate(data.ngay_kt)} />
            <DetailField label={txt('congViec.field.ngayHt')} value={data.ngay_ht ? formatDate(data.ngay_ht) : undefined} />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={txt('congViec.form.content')} icon={<Paperclip size={ICON_SIZE.compact} />}>
          <DetailFieldGrid cols={1}>
            <DetailField label={txt('congViec.field.moTa')} value={data.mo_ta} />
            <DetailField label={txt('congViec.field.ghiChu')} value={data.ghi_chu} />
            <DetailField
              label={txt('congViec.field.tepDinhKem')}
              value={
                data.tep_dinh_kem ? (
                  <a href={data.tep_dinh_kem} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
                    {data.tep_dinh_kem}
                  </a>
                ) : undefined
              }
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSystemSection
          title={txt('congViec.detail.systemInfo')}
          createdAt={data.tg_tao}
          updatedAt={data.tg_cap_nhat}
          createdBy={data.nguoi_tao}
          labels={{
            createdAt: txt('congViec.detail.createdAt'),
            updated: txt('congViec.detail.updated'),
            createdBy: txt('congViec.detail.createdBy'),
          }}
        />
      </div>
    </GenericDrawer>
  );
};

export default memo(CongViecDetailComponent);
