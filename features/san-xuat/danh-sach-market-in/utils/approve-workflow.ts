import { txt } from '@/lib/text';
import { MARKET_IN_STATUS } from '../core/types';

/** Có thể duyệt lần đầu hoặc áp dụng lại sau ngừng. */
export function canApproveMarketIn(status: string): boolean {
  return (
    status === MARKET_IN_STATUS.CHO_DUYET || status === MARKET_IN_STATUS.NGUNG_AP_DUNG
  );
}

export function isMarketInReapply(status: string): boolean {
  return status === MARKET_IN_STATUS.NGUNG_AP_DUNG;
}

export function getMarketInApproveActionLabel(status: string): string {
  return isMarketInReapply(status)
    ? txt('printMarket.reapplyAction')
    : txt('printMarket.approveAction');
}

export function getMarketInApproveConfirm(status: string): {
  title: string;
  message: string;
} {
  if (isMarketInReapply(status)) {
    return {
      title: txt('printMarket.reapplyTitle'),
      message: txt('printMarket.reapplyMessage'),
    };
  }
  return {
    title: txt('printMarket.approveTitle'),
    message: txt('printMarket.approveMessage'),
  };
}
