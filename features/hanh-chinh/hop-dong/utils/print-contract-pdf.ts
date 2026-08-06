/**
 * Labor contract PDF — WYSIWYG from DOM preview.
 */
import { getTodayISODate } from '@/lib/utils';
import { safeFileName } from '@/lib/print-document/file-name';
import type { HopDong } from '../core/types';

/** Legal A4 margins — 2cm all sides (matches mau-hop-dong-lao-dong.html). */
const LEGAL_MARGIN_MM: [number, number, number, number] = [20, 20, 20, 20];

export async function downloadContractPdf(
  element: HTMLElement,
  contract: HopDong,
): Promise<void> {
  await document.fonts.ready;

  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

  const prevPadding = element.style.padding;
  element.style.padding = '0';

  try {
    await doc.html(element, {
      margin: LEGAL_MARGIN_MM,
      autoPaging: 'text',
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
      },
      width: 210 - LEGAL_MARGIN_MM[1] - LEGAL_MARGIN_MM[3],
      windowWidth: element.scrollWidth,
    });

    const filename = `Hop_dong_${safeFileName(contract.ma_hop_dong)}_${getTodayISODate()}.pdf`;
    doc.save(filename);
  } finally {
    element.style.padding = prevPadding;
  }
}

/** Download PDF from the on-page preview element. */
export async function printContractPDF(contract: HopDong): Promise<void> {
  const el = document.querySelector<HTMLElement>('.contract-preview-content');
  if (!el) {
    throw new Error('Contract preview element not found');
  }
  await downloadContractPdf(el, contract);
}
