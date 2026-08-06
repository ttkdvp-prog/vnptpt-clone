import { useState } from 'react';
import { AlertTriangle, Download } from 'lucide-react';
import { toast } from 'sonner';
import AppDialog from '@/components/shared/AppDialog';
import Button from '@/components/ui/Button';
import { txt } from '@/lib/text';
import { buildErrorWorkbook } from '@/lib/import/build-error-workbook';
import type { BulkRowFailure } from '@/lib/bulk/types';

export interface BulkFailureDialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  failures: BulkRowFailure[];
  /** Tên file khi tải — không kèm phần mở rộng. */
  exportFileName?: string;
}

/**
 * Liệt kê lỗi từng dòng sau một hành động bulk. Dùng lại
 * `lib/import/build-error-workbook.ts` để tải `.xlsx` — không viết code xlsx mới.
 */
export default function BulkFailureDialog({
  open,
  onClose,
  title,
  failures,
  exportFileName = 'ket_qua_bulk',
}: BulkFailureDialogProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await buildErrorWorkbook({
        columns: [{ key: 'label', label: txt('shared.bulk.failureRecord') }],
        errors: failures.map((f, i) => ({
          rowNumber: i + 1,
          data: { label: f.label },
          message: f.reason,
        })),
        fileName: exportFileName,
      });
    } catch {
      toast.error(txt('shared.export.failed'));
    } finally {
      setDownloading(false);
    }
  };

  return (
    <AppDialog
      open={open}
      onClose={onClose}
      title={title ?? txt('shared.bulk.partialTitle')}
      icon={AlertTriangle}
      size="MEDIUM"
      footer={
        <div className="flex items-center justify-between w-full gap-2">
          <Button variant="outline" size="sm" onClick={handleDownload} disabled={downloading}>
            <Download className="w-3.5 h-3.5 mr-1.5" />
            {txt('shared.bulk.downloadFailures')}
          </Button>
          <Button size="sm" onClick={onClose}>
            {txt('common.close')}
          </Button>
        </div>
      }
    >
      <div className="max-h-[60vh] overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-card">
            <tr className="border-b border-border">
              <th className="text-left font-medium text-muted-foreground py-2 px-3">
                {txt('shared.bulk.failureRecord')}
              </th>
              <th className="text-left font-medium text-muted-foreground py-2 px-3">
                {txt('shared.bulk.failureReason')}
              </th>
            </tr>
          </thead>
          <tbody>
            {failures.map((f) => (
              <tr key={f.id} className="border-b border-border/50">
                <td className="py-2 px-3 font-medium text-foreground">{f.label}</td>
                <td className="py-2 px-3 text-muted-foreground">{f.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppDialog>
  );
}
