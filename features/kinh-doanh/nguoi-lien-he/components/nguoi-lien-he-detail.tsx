import { ContactRound, FileText, Phone } from 'lucide-react';
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
import type { NguoiLienHe } from '../core/types';
import { NGUOI_LIEN_HE_FIELD_ICONS } from '../core/nguoi-lien-he-field-icons';
import { formatNgaySinh } from '../utils/search-keys';

interface Props {
  data: NguoiLienHe;
  onClose: () => void;
  onEdit: (item: NguoiLienHe) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (item: NguoiLienHe) => void;
  maxWidthClass?: string;
  stackLevel?: number;
}

const NguoiLienHeDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  maxWidthClass = DRAWER_WIDTH_DETAIL,
  stackLevel = 0,
}) => {
  const recordCtx = { nguoi_tao: data.nguoi_tao };
  const canEdit = useCanOnRecord('edit', 'contacts', recordCtx);
  const canDelete = useCanOnRecord('delete', 'contacts', recordCtx);
  const canCreate = useCan('create', 'contacts');

  return (
    <GenericDrawer
      title={txt('contact.detail.title')}
      subtitle={txt('contact.detail.subtitle')}
      icon={<ContactRound size={ICON_SIZE.prominent} />}
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
            <ContactRound size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-foreground truncate">{data.ho_ten}</h2>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {data.ten_khach_hang || '—'}
              {data.chuc_vu ? ` · ${data.chuc_vu}` : ''}
            </p>
          </div>
        </div>

        <DetailToolbar actions={[]} className="bg-card rounded-xl border border-border" />

        <DetailSection title={txt('contact.form.generalInfo')} icon={<FileText size={14} />}>
          <DetailFieldGrid>
            <DetailField
              label={txt('contact.form.customer')}
              value={data.ten_khach_hang || '—'}
              icon={fieldIcon(NGUOI_LIEN_HE_FIELD_ICONS.id_khach_hang)}
            />
            <DetailField
              label={txt('contact.form.name')}
              value={data.ho_ten}
              icon={fieldIcon(NGUOI_LIEN_HE_FIELD_ICONS.ho_ten)}
            />
            <DetailField
              label={txt('contact.form.birthDate')}
              value={formatNgaySinh(data.ngay_sinh)}
              icon={fieldIcon(NGUOI_LIEN_HE_FIELD_ICONS.ngay_sinh)}
            />
            <DetailField
              label={txt('contact.form.title')}
              value={data.chuc_vu || '—'}
              icon={fieldIcon(NGUOI_LIEN_HE_FIELD_ICONS.chuc_vu)}
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={txt('contact.form.contactInfo')} icon={<Phone size={14} />}>
          <DetailFieldGrid>
            <DetailField
              label={txt('contact.form.phone')}
              value={data.so_dien_thoai || '—'}
              icon={fieldIcon(NGUOI_LIEN_HE_FIELD_ICONS.so_dien_thoai)}
            />
            <DetailField
              label={txt('contact.form.email')}
              value={data.email || '—'}
              icon={fieldIcon(NGUOI_LIEN_HE_FIELD_ICONS.email)}
            />
            <DetailField
              label={txt('contact.form.address')}
              value={data.dia_chi || '—'}
              icon={fieldIcon(NGUOI_LIEN_HE_FIELD_ICONS.dia_chi)}
            />
            <DetailField
              label={txt('contact.form.note')}
              value={data.ghi_chu || '—'}
              className="sm:col-span-2"
              icon={fieldIcon(NGUOI_LIEN_HE_FIELD_ICONS.ghi_chu)}
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSystemSection
          title={txt('contact.detail.systemInfo')}
          createdAt={data.tg_tao}
          updatedAt={data.tg_cap_nhat}
          createdBy={data.ten_nguoi_tao ?? data.nguoi_tao ?? undefined}
          labels={{
            createdAt: txt('contact.detail.createdAt'),
            updated: txt('contact.detail.updated'),
          }}
        />
      </div>
    </GenericDrawer>
  );
};

export default NguoiLienHeDetail;
