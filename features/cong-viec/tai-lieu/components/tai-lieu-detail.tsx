import React, { useMemo, memo } from 'react';
import { txt } from '@/lib/text';
import { ICON_SIZE } from '@/lib/icon-sizes';
import { FileText, Link2 } from 'lucide-react';
import { TaiLieu } from '../core/types';
import GenericDrawer, { DRAWER_WIDTH_DETAIL } from '@/components/shared/GenericDrawer';
import DetailFooterActions from '@/components/shared/DetailFooterActions';
import DetailSection from '@/components/shared/DetailSection';
import DetailField from '@/components/shared/DetailField';
import DetailFieldGrid from '@/components/shared/DetailFieldGrid';
import DetailSystemSection from '@/components/shared/DetailSystemSection';
import type { DrawerOverlayTier } from '@/lib/dialog-sizes';
import EnumBadge from '@/components/ui/EnumBadge';
import { formatDate } from '@/lib/utils';
import { TINH_TRANG_BADGE_CONFIG } from '../core/constants';
import { useCan } from '@/hooks/use-can';

interface Props {
  data: TaiLieu;
  onClose: () => void;
  onEdit: (item: TaiLieu) => void;
  onDelete: (id: string) => void;
  overlayTier?: DrawerOverlayTier;
}

const TaiLieuDetailComponent: React.FC<Props> = ({ data, onClose, onEdit, onDelete, overlayTier = 'default' }) => {
  const canEdit = useCan('edit', 'tai-lieu');
  const canDelete = useCan('delete', 'tai-lieu');

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
      title={txt('congViecTaiLieu.detail.title')}
      subtitle={data.ten_ho_so}
      icon={<FileText size={ICON_SIZE.prominent} />}
      onClose={onClose}
      footer={renderFooter}
      footerCompact
      maxWidthClass={DRAWER_WIDTH_DETAIL}
      overlayTier={overlayTier}
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-foreground leading-tight truncate">{data.ten_ho_so}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">#{data.so_ho_so}</p>
          </div>
          <EnumBadge value={data.tinh_trang} config={TINH_TRANG_BADGE_CONFIG} />
        </div>

        <DetailSection title={txt('congViecTaiLieu.form.docInfo')} icon={<FileText size={ICON_SIZE.compact} />}>
          <DetailFieldGrid>
            <DetailField label={txt('congViecTaiLieu.field.danhMuc')} value={data.danh_muc} />
            <DetailField label={txt('congViecTaiLieu.field.to')} value={data.to} />
            <DetailField label={txt('congViecTaiLieu.field.ngayBanHanh')} value={formatDate(data.ngay_ban_hanh)} />
            <DetailField label={txt('congViecTaiLieu.field.ngayKetThuc')} value={data.ngay_ket_thuc ? formatDate(data.ngay_ket_thuc) : undefined} />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={txt('congViecTaiLieu.form.content')} icon={<Link2 size={ICON_SIZE.compact} />}>
          <DetailFieldGrid cols={1}>
            <DetailField
              label={txt('congViecTaiLieu.field.url')}
              value={
                data.url ? (
                  <a href={data.url} target="_blank" rel="noreferrer" className="text-primary hover:underline break-all">
                    {data.url}
                  </a>
                ) : undefined
              }
            />
            <DetailField label={txt('congViecTaiLieu.field.moTa')} value={data.mo_ta} />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSystemSection
          title={txt('congViecTaiLieu.detail.systemInfo')}
          createdAt={data.tg_tao}
          updatedAt={data.tg_cap_nhat}
          createdBy={data.nguoi_tao}
          labels={{
            createdAt: txt('congViecTaiLieu.detail.createdAt'),
            updated: txt('congViecTaiLieu.detail.updated'),
            createdBy: txt('congViecTaiLieu.detail.createdBy'),
          }}
        />
      </div>
    </GenericDrawer>
  );
};

export default memo(TaiLieuDetailComponent);
