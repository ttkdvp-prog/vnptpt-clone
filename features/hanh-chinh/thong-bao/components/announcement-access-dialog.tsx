import { useCallback, useMemo, useState } from 'react';
import { Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import AppDialog from '@/components/shared/AppDialog';
import Button from '@/components/ui/Button';
import { BTN_CANCEL, BTN_SAVE } from '@/lib/button-labels';
import { txt } from '@/lib/text';
import { masterDataQueryOptions } from '@/lib/query/query-config';
import { queryKeys } from '@/lib/query-keys';
import { departmentsQueryOptions } from '@/features/he-thong/queries/master-data';
import { getActivePositions } from '@/features/he-thong/chuc-vu/services/chuc-vu-service';
import { DeptGroupedAccessChecklist } from '@/features/hanh-chinh/danh-sach-tai-lieu/components/dept-grouped-access-checklist';
import type { ThongBao } from '../core/types';
import type { ThongBaoFormValues } from '../core/schema';
import { useUpdateThongBao } from '../hooks/use-thong-bao';

interface Props {
  item: ThongBao | null;
  open: boolean;
  onClose: () => void;
}

function toFormValues(item: ThongBao, id_chuc_vu: string[]): ThongBaoFormValues {
  return {
    tg_dang: item.tg_dang,
    tieu_de: item.tieu_de,
    noi_dung: item.noi_dung,
    id_chuc_vu,
  };
}

function AnnouncementAccessDialogBody({
  item,
  onClose,
}: {
  item: ThongBao;
  onClose: () => void;
}) {
  const updateMutation = useUpdateThongBao();
  const [selectedPositions, setSelectedPositions] = useState(() => item.id_chuc_vu ?? []);

  const { data: departments = [] } = useQuery(departmentsQueryOptions());
  const { data: positions = [] } = useQuery({
    queryKey: queryKeys.positions.active,
    queryFn: getActivePositions,
    ...masterDataQueryOptions,
  });

  const positionItems = useMemo(
    () =>
      positions.map((p) => ({
        id: p.id,
        label: p.ten_chuc_vu,
        phong_ban_id: p.phong_ban_id,
      })),
    [positions],
  );

  const unassignedLabel = txt('announcement.detail.unassignedDept');

  const handleSave = useCallback(async () => {
    await updateMutation.mutateAsync({
      id: item.id,
      data: toFormValues(item, selectedPositions),
    });
    onClose();
  }, [item, onClose, selectedPositions, updateMutation]);

  return (
    <AppDialog
      open
      onClose={onClose}
      title={txt('announcement.detail.accessChangeTitle')}
      subtitle={item.tieu_de}
      icon={Shield}
      size="XL"
      footer={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={updateMutation.isPending}
            className="h-10 px-4"
          >
            {BTN_CANCEL()}
          </Button>
          <Button
            size="sm"
            onClick={() => void handleSave()}
            disabled={updateMutation.isPending}
            className="h-10 px-5 bg-primary text-white hover:bg-primary/90"
          >
            {BTN_SAVE()}
          </Button>
        </>
      }
    >
      <div className="space-y-5 overflow-y-auto px-6 py-5">
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3.5">
          <p className="text-sm leading-relaxed text-foreground/90">
            {txt('announcement.detail.accessChangeHint')}
          </p>
        </div>

        <DeptGroupedAccessChecklist
          title={txt('announcement.form.positions')}
          departments={departments}
          items={positionItems}
          value={selectedPositions}
          onChange={setSelectedPositions}
          searchPlaceholder={txt('announcement.form.positionsPlaceholder')}
          selectedCountLabel={txt('announcement.detail.selectedPositionsCount', {
            count: selectedPositions.length,
          })}
          unassignedLabel={unassignedLabel}
        />
      </div>
    </AppDialog>
  );
}

export function AnnouncementAccessDialog({ item, open, onClose }: Props) {
  if (!open || !item) return null;
  return <AnnouncementAccessDialogBody key={item.id} item={item} onClose={onClose} />;
}
