/**
 * Export labor contract as Word (.doc via HTML) — parity with preview/print.
 */
import type { Employee } from '@/features/he-thong/nhan-vien/core/types';
import { getTodayISODate } from '@/lib/utils';
import { downloadBlob } from '@/lib/print-document/download-blob';
import { safeFileName } from '@/lib/print-document/file-name';
import type { HopDong } from '../core/types';
import { buildContractFullHTML } from './contract-document';

export type ContractExportFormat = 'pdf' | 'doc';

export async function exportContractDoc(
  contract: HopDong,
  employee: Employee | null | undefined,
): Promise<void> {
  const html = buildContractFullHTML(contract, employee);
  const blob = new Blob(['\ufeff' + html], { type: 'application/msword' });
  downloadBlob(blob, `Hop_dong_${safeFileName(contract.ma_hop_dong)}_${getTodayISODate()}.doc`);
}
