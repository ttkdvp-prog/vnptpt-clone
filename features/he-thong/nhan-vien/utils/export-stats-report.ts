/**
 * Export Employee Stats report to Excel (.xlsx) and PDF.
 * Includes metadata: date range, filters, exported at.
 */
import type { StatsExportMeta } from '../core/stats-types';
import type { KpiItem } from '../core/stats-types';
import { getTodayISODate } from '@/lib/utils';
import { txt } from '@/lib/text';
import { registerVietnameseFont, VIETNAMESE_PDF_FONT } from '@/lib/pdf/vietnamese-font';

const PRIMARY_COLOR: [number, number, number] = [59, 130, 246];

function buildMetaRows(meta: StatsExportMeta): string[][] {
  return [
    [txt('employee.report.title'), ''],
    [txt('employee.report.period'), meta.dateRangeLabel],
    [txt('employee.report.statusFilter'), meta.filterStatusLabels.length ? meta.filterStatusLabels.join(', ') : txt('employee.report.allFilter')],
    [txt('employee.report.exportDate'), meta.exportedAt],
    ['', ''],
  ];
}

/** Export stats to Excel: sheet "Tổng quan" (meta + KPIs). */
export async function exportStatsToExcel(meta: StatsExportMeta, kpis: KpiItem[]): Promise<void> {
  const XLSX = await import('xlsx');

  // Cell số để dạng number (không String hóa) để Excel tính toán được.
  const overviewRows: (string | number)[][] = [
    ...buildMetaRows(meta),
    [txt('employee.report.indicator'), txt('employee.report.value'), txt('employee.report.ratio')],
    ...kpis.map((k) => [k.label, k.value, k.pct ?? '']),
  ];

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
  wsOverview['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 10 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsOverview, txt('employee.report.overviewSheet'));

  const dateStr = getTodayISODate();
  XLSX.writeFile(wb, `Bao_cao_Thong_ke_Nhan_su_${dateStr}.xlsx`);
}

/** Export stats to PDF: title, meta, KPI table. */
export async function exportStatsToPdf(meta: StatsExportMeta, kpis: KpiItem[]): Promise<void> {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const autoTable = autoTableModule.default;

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  await registerVietnameseFont(doc);
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 14;
  let y = 14;

  doc.setFontSize(14);
  doc.setFont(VIETNAMESE_PDF_FONT, 'bold');
  doc.text(txt('employee.report.pdfTitle'), pageWidth / 2, y, { align: 'center' });
  y += 8;

  doc.setFontSize(9);
  doc.setFont(VIETNAMESE_PDF_FONT, 'normal');
  doc.setTextColor(100);
  doc.text(`${txt('employee.report.pdfPeriod')} ${meta.dateRangeLabel}  •  ${txt('employee.report.pdfExportDate')} ${meta.exportedAt}`, pageWidth / 2, y, { align: 'center' });
  doc.setTextColor(0);
  y += 6;

  if (meta.filterStatusLabels.length) {
    doc.setFontSize(8);
    doc.setTextColor(120);
    doc.text(`${txt('employee.report.pdfStatus')} ${meta.filterStatusLabels.join(', ')}`, marginX, y);
    doc.setTextColor(0);
    y += 5;
  }

  y += 2;

  autoTable(doc, {
    startY: y,
    head: [[txt('employee.report.indicator'), txt('employee.report.value'), txt('employee.report.ratio')]],
    body: kpis.map((k) => [k.label, String(k.value), k.pct ?? '—']),
    theme: 'grid',
    // autotable không kế thừa font của doc — phải set font trong styles/headStyles.
    styles: { font: VIETNAMESE_PDF_FONT, fontSize: 8, cellPadding: 2 },
    headStyles: { font: VIETNAMESE_PDF_FONT, fillColor: PRIMARY_COLOR, fontSize: 8, fontStyle: 'bold', textColor: 255 },
    margin: { left: marginX, right: marginX },
  });

  // Tải trực tiếp (không window.open — tránh popup blocker, không leak object URL).
  doc.save(`Bao_cao_Thong_ke_Nhan_su_${getTodayISODate()}.pdf`);
}
