import { getTodayISODate } from '@/lib/utils';
import { txt } from '@/lib/text';
import { registerVietnameseFont, VIETNAMESE_PDF_FONT } from '@/lib/pdf/vietnamese-font';
import type { KpiItem, StatsExportMeta, TypeSummaryRow } from '../core/stats-types';

const PRIMARY_COLOR: [number, number, number] = [59, 130, 246];

function buildMetaRows(meta: StatsExportMeta): string[][] {
  return [
    [txt('documentStats.reportTitle'), ''],
    [txt('documentStats.reportPeriod'), meta.dateRangeLabel],
    [
      txt('documentStats.reportTypeFilter'),
      meta.filterTypeLabels.length
        ? meta.filterTypeLabels.join(', ')
        : txt('documentStats.reportAllFilter'),
    ],
    [
      txt('documentStats.reportStatusFilter'),
      meta.filterStatusLabels.length
        ? meta.filterStatusLabels.join(', ')
        : txt('documentStats.reportAllFilter'),
    ],
    [
      txt('documentStats.reportCreatorFilter'),
      meta.filterCreatorLabels.length
        ? meta.filterCreatorLabels.join(', ')
        : txt('documentStats.reportAllFilter'),
    ],
    [txt('documentStats.reportExportDate'), meta.exportedAt],
    ['', ''],
  ];
}

export async function exportDocumentStatsToExcel(
  meta: StatsExportMeta,
  kpis: KpiItem[],
  typeSummary: TypeSummaryRow[],
): Promise<void> {
  const XLSX = await import('xlsx');

  const overviewRows: string[][] = [
    ...buildMetaRows(meta),
    [
      txt('documentStats.reportIndicator'),
      txt('documentStats.reportValue'),
      txt('documentStats.reportRatio'),
    ],
    ...kpis.map((k) => [k.label, String(k.value), k.pct ?? '']),
  ];

  const wsOverview = XLSX.utils.aoa_to_sheet(overviewRows);
  wsOverview['!cols'] = [{ wch: 22 }, { wch: 12 }, { wch: 10 }];

  const typeRows: string[][] = [
    [
      txt('documentStats.typeCol'),
      txt('documentStats.totalCol'),
      txt('documentStats.draftCol'),
      txt('documentStats.activeCol'),
      txt('documentStats.pendingCol'),
      txt('documentStats.obsoleteCol'),
      txt('documentStats.rateCol'),
    ],
    ...typeSummary.map((r) => [
      r.name,
      String(r.total),
      String(r.du_thao),
      String(r.hieu_luc),
      String(r.cho_sua),
      String(r.loi_thoi),
      r.rate,
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
    { wch: 12 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.writeFile(
    (() => {
      XLSX.utils.book_append_sheet(wb, wsOverview, txt('documentStats.overviewSheet'));
      XLSX.utils.book_append_sheet(wb, wsType, txt('documentStats.byTypeSheet'));
      return wb;
    })(),
    `Bao_cao_Thong_ke_Tai_lieu_${getTodayISODate()}.xlsx`,
  );
}

export async function exportDocumentStatsToPdf(
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
  doc.text(txt('documentStats.reportTitle'), 14, 16);
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
        txt('documentStats.reportIndicator'),
        txt('documentStats.reportValue'),
        txt('documentStats.reportRatio'),
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
        txt('documentStats.typeCol'),
        txt('documentStats.totalCol'),
        txt('documentStats.draftCol'),
        txt('documentStats.activeCol'),
        txt('documentStats.pendingCol'),
        txt('documentStats.obsoleteCol'),
        txt('documentStats.rateCol'),
      ],
    ],
    body: typeSummary.map((r) => [
      r.name,
      String(r.total),
      String(r.du_thao),
      String(r.hieu_luc),
      String(r.cho_sua),
      String(r.loi_thoi),
      r.rate,
    ]),
    styles: { font: VIETNAMESE_PDF_FONT, fontSize: 7 },
    headStyles: { font: VIETNAMESE_PDF_FONT, fillColor: PRIMARY_COLOR },
  });

  doc.save(`Bao_cao_Thong_ke_Tai_lieu_${getTodayISODate()}.pdf`);
}
