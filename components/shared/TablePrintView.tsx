/**
 * In danh sách (bảng dữ liệu) — tái dùng shell/CSS-inject pattern của `PrintDocumentShell`
 * nhưng render 1 bảng PHẲNG (không virtualization/sticky — in phải thấy toàn bộ hàng cùng lúc,
 * không phải nội dung đang cuộn trên màn hình).
 */
import { useMemo } from 'react';
import { txt } from '@/lib/text';
import type { ColumnConfig } from '@/store/createGenericStore';
import PrintDocumentShell from './PrintDocumentShell';

const PRINT_TABLE_CSS = `
@media print {
  @page { size: A4 landscape; margin: 10mm; }
  .print-document-toolbar { display: none !important; }
  .print-document-host { background: #fff !important; }
  .print-table-sheet { box-shadow: none !important; max-width: none !important; }
  table.print-table { width: 100%; border-collapse: collapse; font-size: 10px; }
  table.print-table th, table.print-table td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; }
  table.print-table thead { display: table-header-group; }
  table.print-table tr { break-inside: avoid; }
}
`;

interface TablePrintViewProps<T> {
  title: string;
  columns: ColumnConfig[];
  data: T[];
  getCellText: (colId: string, item: T) => string;
  keyExtractor: (item: T) => string;
  onClose: () => void;
}

function TablePrintView<T>({ title, columns, data, getCellText, keyExtractor, onClose }: TablePrintViewProps<T>) {
  const visibleColumns = useMemo(
    () => [...columns].filter((c) => c.visible && c.id !== 'actions').sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [columns]
  );

  return (
    <PrintDocumentShell
      title={title}
      css={PRINT_TABLE_CSS}
      styleId="print-table-style"
      formats={[]}
      onDownload={async () => {}}
      onClose={onClose}
      printLabel={txt('common.printList')}
    >
      <div className="print-table-sheet p-4">
        <h1 className="text-sm font-semibold mb-3">{title}</h1>
        <table className="print-table w-full text-xs border-collapse">
          <thead>
            <tr>
              {visibleColumns.map((col) => (
                <th key={col.id} className="border border-border px-2 py-1 text-left font-semibold bg-muted/40">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr key={keyExtractor(item)}>
                {visibleColumns.map((col) => (
                  <td key={col.id} className="border border-border px-2 py-1">
                    {getCellText(col.id, item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </PrintDocumentShell>
  );
}

export default TablePrintView;
