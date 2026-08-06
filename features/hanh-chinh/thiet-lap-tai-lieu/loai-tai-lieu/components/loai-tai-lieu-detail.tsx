import { FolderCog, FileText } from 'lucide-react';
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
import { DRAWER_WIDTH_DETAIL } from '@/components/shared/GenericDrawer';
import { useCan } from '@/hooks/use-can';
import { useCanOnRecord } from '@/hooks/use-can-on-record';
import type { LoaiTaiLieu } from '../core/types';
import { LOAI_TAI_LIEU_FIELD_ICONS } from '../core/loai-tai-lieu-field-icons';

interface Props {
  data: LoaiTaiLieu;
  onClose: () => void;
  onEdit: (item: LoaiTaiLieu) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (item: LoaiTaiLieu) => void;
  maxWidthClass?: string;
  stackLevel?: number;
}

const LoaiTaiLieuDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  maxWidthClass = DRAWER_WIDTH_DETAIL,
  stackLevel = 0,
}) => {
  const recordCtx = { nguoi_tao: data.nguoi_tao };
  const canEdit = useCanOnRecord('edit', 'documentSettings', recordCtx);
  const canDelete = useCanOnRecord('delete', 'documentSettings', recordCtx);
  const canCreate = useCan('create', 'documentSettings');

  return (
    <GenericDrawer
      title={txt('documentSettings.loai.detail.title')}
      subtitle={txt('documentSettings.loai.detail.subtitle')}
      icon={<FolderCog size={ICON_SIZE.prominent} />}
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
            <FolderCog size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground truncate">
              {data.ten_loai_tai_lieu}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {data.mo_ta || txt('common.noDescription')}
            </p>
          </div>
        </div>

        <DetailToolbar actions={[]} className="bg-card rounded-xl border border-border" />

        <DetailSection
          title={txt('documentSettings.loai.form.generalInfo')}
          icon={<FileText size={14} />}
        >
          <DetailFieldGrid>
            <DetailField
              label={txt('documentSettings.loai.form.order')}
              value={String(data.thu_tu)}
              icon={fieldIcon(LOAI_TAI_LIEU_FIELD_ICONS.thu_tu)}
            />
            <DetailField
              label={txt('documentSettings.loai.form.name')}
              value={data.ten_loai_tai_lieu}
              icon={fieldIcon(LOAI_TAI_LIEU_FIELD_ICONS.ten_loai_tai_lieu)}
            />
            <DetailField
              label={txt('documentSettings.loai.form.description')}
              value={data.mo_ta || '—'}
              className="sm:col-span-2"
              icon={fieldIcon(LOAI_TAI_LIEU_FIELD_ICONS.mo_ta)}
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSystemSection
          title={txt('documentSettings.loai.detail.systemInfo')}
          createdAt={data.tg_tao}
          updatedAt={data.tg_cap_nhat}
          createdBy={data.ten_nguoi_tao ?? data.nguoi_tao ?? undefined}
          labels={{
            createdAt: txt('documentSettings.loai.detail.createdAt'),
            updated: txt('documentSettings.loai.detail.updated'),
          }}
        />
      </div>
    </GenericDrawer>
  );
};

export default LoaiTaiLieuDetail;
