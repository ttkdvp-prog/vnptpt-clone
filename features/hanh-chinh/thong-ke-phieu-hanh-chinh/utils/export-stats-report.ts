import { getTodayISODate } from '@/lib/utils';
import { txt } from '@/lib/text';
import { registerVietnameseFont, VIETNAMESE_PDF_FONT } from '@/lib/pdf/vietnamese-font';
import type { KpiItem, StatsExportMeta, TypeSummaryRow } from '../core/stats-types';

const PRIMARY_COLOR: [number, number, number] = [245, 158, 11];

function buildMetaRows(meta: StatsExportMeta): string[][] {
  return [
    [txt('adminFormStats.reportTitle'), ''],
    [txt('adminFormStats.reportPeriod'), meta.dateRangeLabel],
    [
      txt('adminFormStats.reportTypeFilter'),
      meta.filterTypeLabels.length
        ? meta.filterTypeLabels.join(', ')
        : txt('adminFormStats.reportAllFilter'),
    ],
    [
      txt('adminFormStats.reportStatusFilter'),
      meta.filterStatusLabels.length
        ? meta.filterStatusLabels.join(', ')
        : txt('adminFormStats.reportAllFilter'),
    ],
    [
      txt('adminFormStats.reportDeptFilter'),
      meta.filterDeptLabels.length
        ? meta.filterDeptLabels.join(', ')
        : txt('adminFormStats.reportAllFilter'),
    ],
    [
      txt('adminFormStats.reportEmployeeFilter'),
      meta.filterEmployeeLabels.length
        ? meta.filterEmployeeLabels.join(', ')
        : txt('adminFormStats.reportAllFilter'),
    ],
    [txt('adminFormStats.reportExportDate'), meta.exportedAt],
    ['', ''],
  ];
}

export async function exportAdminFormStatsToExcel(
  meta: StatsExportMeta,
  kpis: KpiItem[],
  typeSummary: TypeSummaryRow[],
): Promise<void> {
  const XLSX = await import('xlsx');

  const overviewRows: string[][] = [
    ...buildMetaRows(meta),
    [
      txt('adminFormStats.reportIndicator'),
      txt('adminFormStats.reportValue'),
      txt('adminFormStats.reportRatio'),
    ],
    ...kpis.map((k) => [k.label, String(k.value), k.pct ?? '']),
  ];

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
  wsOverview['!cols'] = [{ wch: 26 }, { wch: 12 }, { wch: 10 }];

  const typeRows: string[][] = [
    [
      txt('adminFormStats.typeCol'),
      txt('adminFormStats.totalCol'),
      txt('adminFormStats.approvedCol'),
      txt('adminFormStats.pendingCol'),
      txt('adminFormStats.rejectedCol'),
      txt('adminFormStats.daysCol'),
      txt('adminFormStats.avgDaysCol'),
    ],
    ...typeSummary.map((r) => [
      r.name,
      String(r.total),
      String(r.da_duyet),
      String(r.cho_duyet),
      String(r.tu_choi),
      String(r.tong_ngay),
      r.avgLabel,
    ]),
  ];

  const wsType = XLSX.utils.aoa_to_sheet(typeRows);
  wsType['!cols'] = [
    { wch: 24 },
    { wch: 8 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
    { wch: 10 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.writeFile(
    (() => {
      XLSX.utils.book_append_sheet(wb, wsOverview, txt('adminFormStats.overviewSheet'));
      XLSX.utils.book_append_sheet(wb, wsType, txt('adminFormStats.byTypeSheet'));
      return wb;
    })(),
    `Bao_cao_Thong_ke_Phieu_HC_${getTodayISODate()}.xlsx`,
  );
}

export async function exportAdminFormStatsToPdf(
  meta: StatsExportMeta,
  kpis: KpiItem[],
  typeSummary: TypeSummaryRow[],
): Promise<void> {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable'),
  ]);
  const autoTable = autoTableModule.default;

  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
  await registerVietnameseFont(doc);
  doc.setFontSize(14);
  doc.setTextColor(...PRIMARY_COLOR);
  doc.text(txt('adminFormStats.reportTitle'), 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(80);
  let y = 24;
  for (const [label, value] of buildMetaRows(meta).filter((r) => r[0])) {
    doc.text(`${label}: ${value}`, 14, y);
    y += 5;
  }

  autoTable(doc, {
    startY: y + 2,
    head: [
      [
        txt('adminFormStats.reportIndicator'),
        txt('adminFormStats.reportValue'),
        txt('adminFormStats.reportRatio'),
      ],
    ],
    body: kpis.map((k) => [k.label, String(k.value), k.pct ?? '']),
    styles: { font: VIETNAMESE_PDF_FONT, fontSize: 8 },
    headStyles: { font: VIETNAMESE_PDF_FONT, fillColor: PRIMARY_COLOR },
  });

  const afterKpi = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable
    .finalY;

  autoTable(doc, {
    startY: afterKpi + 8,
    head: [
      [
        txt('adminFormStats.typeCol'),
        txt('adminFormStats.totalCol'),
        txt('adminFormStats.approvedCol'),
        txt('adminFormStats.pendingCol'),
        txt('adminFormStats.rejectedCol'),
        txt('adminFormStats.daysCol'),
        txt('adminFormStats.avgDaysCol'),
      ],
    ],
    body: typeSummary.map((r) => [
      r.name,
      String(r.total),
      String(r.da_duyet),
      String(r.cho_duyet),
      String(r.tu_choi),
      String(r.tong_ngay),
      r.avgLabel,
    ]),
    styles: { font: VIETNAMESE_PDF_FONT, fontSize: 7 },
    headStyles: { font: VIETNAMESE_PDF_FONT, fillColor: PRIMARY_COLOR },
  });

  doc.save(`Bao_cao_Thong_ke_Phieu_HC_${getTodayISODate()}.pdf`);
}
