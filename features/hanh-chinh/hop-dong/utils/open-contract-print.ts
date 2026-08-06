import { toast } from 'sonner';
import { txt } from '@/lib/text';

/** Mở trang in hợp đồng (tab mới). Báo toast nếu trình duyệt chặn popup. */
export function openContractPrintTab(contractId: string): void {
  const url = `${window.location.origin}/in-hop-dong/${encodeURIComponent(contractId)}`;
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  if (w == null) {
    toast.error(txt('contract.print.popupBlocked'), {
      description: txt('contract.print.popupBlockedHint'),
    });
  }
}
