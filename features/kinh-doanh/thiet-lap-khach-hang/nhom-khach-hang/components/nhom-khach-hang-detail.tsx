import { UsersRound, FileText } from 'lucide-react';
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
import type { NhomKhachHang } from '../core/types';
import { NHOM_KHACH_HANG_FIELD_ICONS } from '../core/nhom-khach-hang-field-icons';

interface Props {
  data: NhomKhachHang;
  onClose: () => void;
  onEdit: (item: NhomKhachHang) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (item: NhomKhachHang) => void;
  maxWidthClass?: string;
  stackLevel?: number;
}

const NhomKhachHangDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  maxWidthClass = DRAWER_WIDTH_DETAIL,
  stackLevel = 0,
}) => {
  const recordCtx = { nguoi_tao: data.nguoi_tao };
  const canEdit = useCanOnRecord('edit', 'customerSettings', recordCtx);
  const canDelete = useCanOnRecord('delete', 'customerSettings', recordCtx);
  const canCreate = useCan('create', 'customerSettings');

  return (
    <GenericDrawer
      title={txt('customerSettings.nhom.detail.title')}
      subtitle={txt('customerSettings.nhom.detail.subtitle')}
      icon={<UsersRound size={ICON_SIZE.prominent} />}
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
            <UsersRound size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground truncate">{data.ten_nhom}</h2>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {data.mo_ta || txt('common.noDescription')}
            </p>
          </div>
        </div>

        <DetailToolbar actions={[]} className="bg-card rounded-xl border border-border" />

        <DetailSection title={txt('customerSettings.nhom.form.generalInfo')} icon={<FileText size={14} />}>
          <DetailFieldGrid>
            <DetailField
              label={txt('customerSettings.nhom.form.name')}
              value={data.ten_nhom}
              icon={fieldIcon(NHOM_KHACH_HANG_FIELD_ICONS.ten_nhom)}
            />
            <DetailField
              label={txt('customerSettings.nhom.form.description')}
              value={data.mo_ta || '—'}
              className="sm:col-span-2"
              icon={fieldIcon(NHOM_KHACH_HANG_FIELD_ICONS.mo_ta)}
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSystemSection
          title={txt('customerSettings.nhom.detail.systemInfo')}
          createdAt={data.tg_tao}
          updatedAt={data.tg_cap_nhat}
          createdBy={data.ten_nguoi_tao ?? data.nguoi_tao ?? undefined}
          labels={{
            createdAt: txt('customerSettings.nhom.detail.createdAt'),
            updated: txt('customerSettings.nhom.detail.updated'),
          }}
        />
      </div>
    </GenericDrawer>
  );
};

export default NhomKhachHangDetail;
