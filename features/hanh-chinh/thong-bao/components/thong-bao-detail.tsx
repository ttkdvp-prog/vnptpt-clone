import { useMemo, useState } from 'react';
import { Bell, FileText, Shield } from 'lucide-react';
import { txt } from '@/lib/text';
import { ICON_SIZE } from '@/lib/icon-sizes';
import { fieldIcon } from '@/lib/field-icon';
import { formatDateTime } from '@/lib/utils';
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
import type { ThongBao } from '../core/types';
import { THONG_BAO_FIELD_ICONS } from '../core/thong-bao-field-icons';
import { AnnouncementAccessDialog } from './announcement-access-dialog';

interface Props {
  data: ThongBao;
  onClose: () => void;
  onEdit: (item: ThongBao) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (item: ThongBao) => void;
  maxWidthClass?: string;
  stackLevel?: number;
}

const ThongBaoDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  maxWidthClass = DRAWER_WIDTH_DETAIL,
  stackLevel = 0,
}) => {
  const [accessOpen, setAccessOpen] = useState(false);
  const recordCtx = { nguoi_tao: data.nguoi_tao };
  const canEdit = useCanOnRecord('edit', 'announcements', recordCtx);
  const canDelete = useCanOnRecord('delete', 'announcements', recordCtx);
  const canCreate = useCan('create', 'announcements');

  const toolbarActions = useMemo((): DetailToolbarAction[] => {
    if (!canEdit) return [];
    return [
      {
        label: txt('announcement.detail.changeAccess'),
        icon: <Shield />,
        onClick: () => setAccessOpen(true),
        variant: 'primary',
      },
    ];
  }, [canEdit]);

  const isPublicAccess = (data.id_chuc_vu?.length ?? 0) === 0;
  const positionsLabel = isPublicAccess
    ? txt('announcement.allPositions')
    : (data.ten_chuc_vu?.length ? data.ten_chuc_vu : data.id_chuc_vu).join(', ');

  return (
    <>
      <GenericDrawer
        title={txt('announcement.detail.title')}
        subtitle={txt('announcement.detail.subtitle')}
        icon={<Bell size={ICON_SIZE.prominent} />}
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
              <Bell size={24} />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-foreground truncate">{data.tieu_de}</h2>
              <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                {data.tg_dang ? formatDateTime(data.tg_dang) : '—'}
              </p>
            </div>
          </div>

          <DetailToolbar
            actions={toolbarActions}
            className="bg-card rounded-xl border border-border"
          />

          <DetailSection
            title={txt('announcement.detail.generalInfo')}
            icon={<FileText size={14} />}
          >
            <DetailFieldGrid>
              <DetailField
                label={txt('announcement.form.datetime')}
                value={data.tg_dang ? formatDateTime(data.tg_dang) : '—'}
                icon={fieldIcon(THONG_BAO_FIELD_ICONS.tg_dang)}
              />
              <DetailField
                label={txt('announcement.form.title')}
                value={data.tieu_de}
                className="sm:col-span-2"
                icon={fieldIcon(THONG_BAO_FIELD_ICONS.tieu_de)}
              />
              <DetailField
                label={txt('announcement.form.content')}
                value={data.noi_dung || '—'}
                className="sm:col-span-2"
                icon={fieldIcon(THONG_BAO_FIELD_ICONS.noi_dung)}
              />
            </DetailFieldGrid>
          </DetailSection>

          <DetailSection
            title={txt('announcement.detail.accessInfo')}
            icon={<Shield size={14} />}
          >
            <DetailFieldGrid>
              <DetailField
                label={txt('announcement.form.positions')}
                value={
                  <div className="space-y-1">
                    <p className="text-body-sm text-foreground">
                      {isPublicAccess
                        ? txt('announcement.detail.accessEveryone')
                        : txt('announcement.detail.accessRestricted')}
                    </p>
                    {!isPublicAccess ? (
                      <p className="text-xs text-muted-foreground">{positionsLabel}</p>
                    ) : null}
                  </div>
                }
                className="sm:col-span-2"
                icon={fieldIcon(THONG_BAO_FIELD_ICONS.id_chuc_vu)}
              />
            </DetailFieldGrid>
          </DetailSection>

          <DetailSystemSection
            title={txt('announcement.detail.systemInfo')}
            createdAt={data.tg_tao}
            updatedAt={data.tg_cap_nhat}
            createdBy={data.ten_nguoi_tao ?? data.nguoi_tao ?? undefined}
            labels={{
              createdAt: txt('announcement.detail.createdAt'),
              updated: txt('announcement.detail.updated'),
            }}
          />
        </div>
      </GenericDrawer>

      <AnnouncementAccessDialog
        item={data}
        open={accessOpen}
        onClose={() => setAccessOpen(false)}
      />
    </>
  );
};

export default ThongBaoDetail;
