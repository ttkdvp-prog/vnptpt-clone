import { toast } from 'sonner';
import { txt } from '@/lib/text';
import type { BulkOutcome, BulkRowFailure } from './types';

export interface ReportBulkOutcomeOptions {
  successMessage: (count: number) => string;
  partialMessage: (ok: number, failed: number) => string;
  allFailedMessage: (count: number) => string;
  onShowDetails: (failures: BulkRowFailure[]) => void;
  /** Nhãn nút action trên toast warning. Mặc định "Xem chi tiết". */
  viewDetailsLabel?: string;
}

/**
 * Quy ước toast cho MỌI hành động bulk, ở đúng một chỗ.
 * - 0 lỗi ⇒ success.
 * - 0 thành công ⇒ error.
 * - còn lại ⇒ warning kèm action mở dialog liệt kê lỗi.
 */
export function reportBulkOutcome(
  outcome: BulkOutcome,
  opts: ReportBulkOutcomeOptions,
): void {
  const { succeededIds, failures } = outcome;

  if (failures.length === 0) {
    toast.success(opts.successMessage(succeededIds.length));
    return;
  }

  if (succeededIds.length === 0) {
    toast.error(opts.allFailedMessage(failures.length));
    return;
  }

  toast.warning(opts.partialMessage(succeededIds.length, failures.length), {
    duration: 8000,
    action: {
      label: opts.viewDetailsLabel ?? txt('shared.bulk.viewDetails'),
      onClick: () => opts.onShowDetails(failures),
    },
  });
}
