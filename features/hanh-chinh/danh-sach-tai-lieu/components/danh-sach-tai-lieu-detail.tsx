import { useMemo, useState } from 'react';
import { ExternalLink, Files, FileText, Shield, Tag } from 'lucide-react';
import { txt } from '@/lib/text';
import { ICON_SIZE } from '@/lib/icon-sizes';
import { fieldIcon } from '@/lib/field-icon';
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
import type { DanhSachTaiLieu } from '../core/types';
import { DANH_SACH_TAI_LIEU_FIELD_ICONS } from '../core/danh-sach-tai-lieu-field-icons';
import { useDocumentStatusChange } from '../hooks/use-document-status-change';
import { DocumentStatusBadge } from './document-badges';
import { DocumentAccessDialog } from './document-access-dialog';

interface Props {
  data: DanhSachTaiLieu;
  onClose: () => void;
  onEdit: (item: DanhSachTaiLieu) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (item: DanhSachTaiLieu) => void;
  maxWidthClass?: string;
  stackLevel?: number;
}

const DanhSachTaiLieuDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  maxWidthClass = DRAWER_WIDTH_DETAIL,
  stackLevel = 0,
}) => {
  const { openStatusChange } = useDocumentStatusChange();
  const [accessOpen, setAccessOpen] = useState(false);

  const recordCtx = { nguoi_tao: data.nguoi_tao };
  const canEdit = useCanOnRecord('edit', 'documentList', recordCtx);
  const canDelete = useCanOnRecord('delete', 'documentList', recordCtx);
  const canCreate = useCan('create', 'documentList');

  const toolbarActions = useMemo((): DetailToolbarAction[] => {
    if (!canEdit) return [];
    return [
      {
        label: txt('document.detail.changeStatus'),
        icon: <Tag />,
        onClick: () => openStatusChange(data),
        variant: 'info',
      },
      {
        label: txt('document.detail.changeAccess'),
        icon: <Shield />,
        onClick: () => setAccessOpen(true),
        variant: 'primary',
      },
    ];
  }, [canEdit, data, openStatusChange]);

  const positionLabels =
    data.ten_chuc_vu?.length
      ? data.ten_chuc_vu.join(', ')
      : data.id_chuc_vu.length
        ? data.id_chuc_vu.join(', ')
        : '—';
  const employeeLabels =
    data.ten_nhan_vien?.length
      ? data.ten_nhan_vien.join(', ')
      : data.id_nhan_vien.length
        ? data.id_nhan_vien.join(', ')
        : '—';

  const isPublicAccess =
    (data.id_chuc_vu?.length ?? 0) === 0 && (data.id_nhan_vien?.length ?? 0) === 0;

  return (
    <>
      <GenericDrawer
        title={txt('document.detail.title')}
        subtitle={txt('document.detail.subtitle')}
        icon={<Files size={ICON_SIZE.prominent} />}
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
              <Files size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-foreground truncate">{data.ten_tai_lieu}</h2>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <DocumentStatusBadge value={data.trang_thai} />
                {data.ten_loai_tai_lieu ? (
                  <span className="text-xs text-muted-foreground">{data.ten_loai_tai_lieu}</span>
                ) : null}
              </div>
            </div>
          </div>

          <DetailToolbar
            actions={toolbarActions}
            className="bg-card rounded-xl border border-border"
          />

          <DetailSection title={txt('document.form.generalInfo')} icon={<FileText size={14} />}>
            <DetailFieldGrid>
              <DetailField
                label={txt('document.form.type')}
                value={data.ten_loai_tai_lieu || '—'}
                icon={fieldIcon(DANH_SACH_TAI_LIEU_FIELD_ICONS.id_loai_tai_lieu)}
              />
              <DetailField
                label={txt('document.form.status')}
                value={<DocumentStatusBadge value={data.trang_thai} />}
                icon={fieldIcon(DANH_SACH_TAI_LIEU_FIELD_ICONS.trang_thai)}
              />
              <DetailField
                label={txt('document.form.name')}
                value={data.ten_tai_lieu}
                className="sm:col-span-2"
                icon={fieldIcon(DANH_SACH_TAI_LIEU_FIELD_ICONS.ten_tai_lieu)}
              />
              <DetailField
                label={txt('document.form.link')}
                value={
                  data.link_tai_lieu ? (
                    <a
                      href={data.link_tai_lieu}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-primary hover:underline break-all"
                    >
                      <ExternalLink size={12} className="shrink-0" />
                      {data.link_tai_lieu}
                    </a>
                  ) : (
                    '—'
                  )
                }
                className="sm:col-span-2"
                icon={fieldIcon(DANH_SACH_TAI_LIEU_FIELD_ICONS.link_tai_lieu)}
              />
              <DetailField
                label={txt('document.form.description')}
                value={data.mo_ta || '—'}
                className="sm:col-span-2"
                icon={fieldIcon(DANH_SACH_TAI_LIEU_FIELD_ICONS.mo_ta)}
              />
              <DetailField
                label={txt('document.form.note')}
                value={data.ghi_chu || '—'}
                className="sm:col-span-2"
                icon={fieldIcon(DANH_SACH_TAI_LIEU_FIELD_ICONS.ghi_chu)}
              />
            </DetailFieldGrid>
          </DetailSection>

          <DetailSection title={txt('document.detail.accessInfo')} icon={<Shield size={14} />}>
            <DetailFieldGrid>
              <DetailField
                label={txt('document.detail.positions')}
                value={positionLabels}
                className="sm:col-span-2"
                icon={fieldIcon(DANH_SACH_TAI_LIEU_FIELD_ICONS.id_chuc_vu)}
              />
              <DetailField
                label={txt('document.detail.employees')}
                value={employeeLabels}
                className="sm:col-span-2"
                icon={fieldIcon(DANH_SACH_TAI_LIEU_FIELD_ICONS.id_nhan_vien)}
              />
            </DetailFieldGrid>
            <p className="mt-3 text-xs text-muted-foreground">
              {isPublicAccess
                ? txt('document.detail.accessEveryone')
                : txt('document.detail.accessRestricted')}
            </p>
          </DetailSection>

          <DetailSystemSection
            title={txt('document.detail.systemInfo')}
            createdAt={data.tg_tao}
            updatedAt={data.tg_cap_nhat}
            createdBy={data.ten_nguoi_tao ?? data.nguoi_tao ?? undefined}
            labels={{
              createdAt: txt('document.detail.createdAt'),
              updated: txt('document.detail.updated'),
            }}
          />
        </div>
      </GenericDrawer>

      <DocumentAccessDialog
        open={accessOpen}
        item={accessOpen ? data : null}
        onClose={() => setAccessOpen(false)}
      />
    </>
  );
};

export default DanhSachTaiLieuDetail;
