import { useCallback, useMemo, useState } from 'react';
import { Shield } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import AppDialog from '@/components/shared/AppDialog';
import Button from '@/components/ui/Button';
import { BTN_CANCEL, BTN_SAVE } from '@/lib/button-labels';
import { txt } from '@/lib/text';
import { listQueryOptions, masterDataQueryOptions } from '@/lib/query/query-config';
import { queryKeys } from '@/lib/query-keys';
import { departmentsQueryOptions } from '@/features/he-thong/queries/master-data';
import { getActivePositions } from '@/features/he-thong/chuc-vu/services/chuc-vu-service';
import { getEmployees } from '@/features/he-thong/nhan-vien/services/nhan-vien-service';
import type { DanhSachTaiLieu } from '../core/types';
import { toDocumentFormValues } from '../utils/to-form-values';
import { useUpdateDanhSachTaiLieu } from '../hooks/use-danh-sach-tai-lieu';
import { DeptGroupedAccessChecklist } from './dept-grouped-access-checklist';

interface Props {
  item: DanhSachTaiLieu | null;
  open: boolean;
  onClose: () => void;
}

function DocumentAccessDialogBody({
  item,
  onClose,
}: {
  item: DanhSachTaiLieu;
  onClose: () => void;
}) {
  const updateMutation = useUpdateDanhSachTaiLieu();
  const [selectedPositions, setSelectedPositions] = useState(() => item.id_chuc_vu ?? []);
  const [selectedEmployees, setSelectedEmployees] = useState(() => item.id_nhan_vien ?? []);

  const { data: departments = [] } = useQuery(departmentsQueryOptions());
  const { data: positions = [] } = useQuery({
    queryKey: queryKeys.positions.active,
    queryFn: getActivePositions,
    ...masterDataQueryOptions,
  });
  const { data: employees = [] } = useQuery({
    queryKey: [...queryKeys.employees.all, 'picker'] as const,
    queryFn: () => getEmployees({ limit: 500, offset: 0 }),
    ...listQueryOptions,
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
  const employeeItems = useMemo(
    () =>
      employees.map((e) => ({
        id: e.id,
        label: e.ho_ten,
        phong_ban_id: e.phong_ban_id,
      })),
    [employees],
  );

  const unassignedLabel = txt('document.detail.unassignedDept');

  const handleSave = useCallback(async () => {
    await updateMutation.mutateAsync({
      id: item.id,
      data: toDocumentFormValues(item, {
        id_chuc_vu: selectedPositions,
        id_nhan_vien: selectedEmployees,
      }),
    });
    onClose();
  }, [item, onClose, selectedEmployees, selectedPositions, updateMutation]);

  return (
    <AppDialog
      open
      onClose={onClose}
      title={txt('document.detail.accessChangeTitle')}
      subtitle={item.ten_tai_lieu}
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
            {txt('document.detail.accessChangeHint')}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <DeptGroupedAccessChecklist
            title={txt('document.form.positions')}
            departments={departments}
            items={positionItems}
            value={selectedPositions}
            onChange={setSelectedPositions}
            searchPlaceholder={txt('document.form.positionsPlaceholder')}
            selectedCountLabel={txt('document.detail.selectedPositionsCount', {
              count: selectedPositions.length,
            })}
            unassignedLabel={unassignedLabel}
          />
          <DeptGroupedAccessChecklist
            title={txt('document.form.employees')}
            departments={departments}
            items={employeeItems}
            value={selectedEmployees}
            onChange={setSelectedEmployees}
            searchPlaceholder={txt('document.form.employeesPlaceholder')}
            selectedCountLabel={txt('document.detail.selectedEmployeesCount', {
              count: selectedEmployees.length,
            })}
            unassignedLabel={unassignedLabel}
          />
        </div>
      </div>
    </AppDialog>
  );
}

export function DocumentAccessDialog({ item, open, onClose }: Props) {
  if (!open || !item) return null;
  return <DocumentAccessDialogBody key={item.id} item={item} onClose={onClose} />;
}
