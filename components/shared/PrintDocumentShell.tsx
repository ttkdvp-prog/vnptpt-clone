/**
 * Khung trang preview tài liệu A4 (mở tab mới) — dùng chung cho hồ sơ nhân viên & hợp đồng.
 *
 * Điểm quan trọng về cơ chế in: khung này nằm trong **normal flow**, KHÔNG `position: fixed`
 * và không có `overflow` trên chuỗi ancestor. Bản cũ đặt tờ giấy trong một backdrop `fixed`
 * rồi in bằng `body * { visibility: hidden }` + `position: absolute` — Chrome chỉ vẽ trang 1
 * nên các trang sau trắng hoặc bị cắt. Rule in nằm ở `app/globals.css` (`.print-document-*`).
 */
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ChevronDown, Download, Printer, X } from 'lucide-react';
import { toast } from 'sonner';
import { txt } from '@/lib/text';
import { cn } from '@/lib/utils';

export interface PrintDocumentFormat {
  format: string;
  label: string;
  icon: ReactNode;
}

interface Props {
  /** Đặt `document.title` — trình duyệt dùng làm tên file mặc định khi in ra PDF */
  title: string;
  /** Stylesheet tài liệu, inject vào `<head>` khi mount và bỏ khi unmount */
  css: string;
  styleId: string;
  formats: PrintDocumentFormat[];
  onDownload: (format: string) => Promise<void>;
  onClose: () => void;
  onPrint?: () => void;
  downloadLabel?: string;
  printLabel?: string;
  errorMessage?: string;
  children: ReactNode;
}

const PrintDocumentShell: React.FC<Props> = ({
  title,
  css,
  styleId,
  formats,
  onDownload,
  onClose,
  onPrint,
  downloadLabel,
  printLabel,
  errorMessage,
  children,
}) => {
  const [exporting, setExporting] = useState(false);
  const [downloadOpen, setDownloadOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
    return () => {
      styleEl?.remove();
    };
  }, [css, styleId]);

  useEffect(() => {
    const prev = document.title;
    document.title = title;
    return () => {
      document.title = prev;
    };
  }, [title]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (downloadOpen) setDownloadOpen(false);
      else onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose, downloadOpen]);

  useEffect(() => {
    if (!downloadOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDownloadOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [downloadOpen]);

  const handleDownload = useCallback(
    async (format: string) => {
      setExporting(true);
      setDownloadOpen(false);
      try {
        await onDownload(format);
      } catch (err) {
        toast.error(errorMessage ?? txt('employee.export.failed'), {
          description: err instanceof Error ? err.message : undefined,
        });
      } finally {
        setExporting(false);
      }
    },
    [onDownload, errorMessage],
  );

  return (
    <div className="print-document-host min-h-screen flex flex-col bg-muted/90">
      <div className="print-document-toolbar sticky top-0 z-10 flex items-center justify-between gap-2 px-3 py-1.5 bg-card border-b border-border shadow-sm shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label={txt('common.close')}
        >
          <X size={16} />
        </button>
        <div className="flex items-center gap-1.5">
          {formats.length > 0 && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setDownloadOpen((o) => !o)}
                disabled={exporting}
                className={cn(
                  'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium border border-border bg-card hover:bg-muted/50',
                  exporting && 'opacity-70 pointer-events-none',
                )}
              >
                <Download size={14} />
                {downloadLabel ?? txt('employee.profile.download')}
                <ChevronDown size={12} className={cn('transition-transform', downloadOpen && 'rotate-180')} />
              </button>
              {downloadOpen && (
                <div className="absolute right-0 top-full mt-1 w-44 py-1 bg-card rounded-xl border border-border shadow-xl z-10">
                  {formats.map((f) => (
                    <button
                      key={f.format}
                      type="button"
                      onClick={() => handleDownload(f.format)}
                      className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-xs hover:bg-muted/60"
                    >
                      {f.icon}
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={onPrint ?? (() => window.print())}
            className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs font-medium bg-primary text-white hover:bg-primary/90"
          >
            <Printer size={14} />
            {printLabel ?? txt('employee.profile.print')}
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 flex justify-center">
        <div className="print-document-sheet bg-white shadow-xl rounded-sm max-w-[210mm] w-full">
          {children}
        </div>
      </div>
    </div>
  );
};

export default PrintDocumentShell;
