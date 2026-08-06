import { useCallback } from 'react';
import Combobox from '@/components/ui/Combobox';
import { CONFIRM_YES } from '@/lib/button-labels';
import { txt } from '@/lib/text';
import { useConfirmStore } from '@/store/useConfirmStore';
import {
  DOCUMENT_STATUS,
  DOCUMENT_STATUS_OPTIONS,
  type DanhSachTaiLieu,
  type DocumentStatus,
} from '../core/types';
import { toDocumentFormValues } from '../utils/to-form-values';
import { useUpdateDanhSachTaiLieu } from './use-danh-sach-tai-lieu';

export function useDocumentStatusChange() {
  const confirm = useConfirmStore((s) => s.confirm);
  const updateMutation = useUpdateDanhSachTaiLieu();

  const openStatusChange = useCallback(
    (item: DanhSachTaiLieu) => {
      const statusValues = Object.values(DOCUMENT_STATUS) as string[];
      let selectedStatus = statusValues.includes(item.trang_thai)
        ? (item.trang_thai as DocumentStatus)
        : DOCUMENT_STATUS.DU_THAO;

      confirm({
        title: txt('document.detail.statusChangeTitle'),
        message: (
          <div className="space-y-4 text-left py-2">
            <p className="text-sm">
              {txt('document.detail.statusChangeMessage')}{' '}
              <strong>{item.ten_tai_lieu}</strong>:
            </p>
            <Combobox
              value={selectedStatus}
              options={DOCUMENT_STATUS_OPTIONS}
              onChange={(v) => {
                selectedStatus = String(v ?? DOCUMENT_STATUS.DU_THAO) as DocumentStatus;
              }}
              searchable={false}
              dropdownInPortal
            />
          </div>
        ),
        variant: 'info',
        confirmText: CONFIRM_YES(),
        onConfirm: async () => {
          if (selectedStatus === item.trang_thai) return;
          await updateMutation.mutateAsync({
            id: item.id,
            data: toDocumentFormValues(item, { trang_thai: selectedStatus }),
          });
        },
      });
    },
    [confirm, updateMutation],
  );

  return { openStatusChange, isPending: updateMutation.isPending };
}
