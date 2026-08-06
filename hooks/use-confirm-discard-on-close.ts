import { useCallback } from 'react';
import { useConfirmStore } from '@/store/useConfirmStore';
import { txt } from '@/lib/text';

/**
 * Bọc `onClose` để hỏi xác nhận trước khi đóng nếu form đang có thay đổi chưa lưu
 * (`isDirty` từ `formState` của react-hook-form). Dùng cho CẢ prop `onClose` của
 * `GenericDrawer` và `onCancel` của `FormDrawerFooter` — 2 đường đóng độc lập, phải
 * bọc cả hai để không có lối tắt bỏ qua cảnh báo.
 */
export function useConfirmDiscardOnClose(isDirty: boolean, onClose: () => void): () => void {
  return useCallback(() => {
    if (!isDirty) {
      onClose();
      return;
    }
    useConfirmStore.getState().confirm({
      title: txt('common.discardChangesTitle'),
      message: txt('common.discardChangesMessage'),
      variant: 'warning',
      confirmText: txt('common.discardChangesConfirm'),
      onConfirm: onClose,
    });
  }, [isDirty, onClose]);
}
