/**
 * Trang preview hồ sơ nhân viên (mở tab mới) — toolbar: Tải (Word / Excel / PDF), In.
 * Route: /ho-so-nhan-vien/:id
 *
 * PDF và .docx sinh ở server (`/nhan-vien/:id/ho-so.pdf|.docx`) nên tệp tải về là chữ thật,
 * không phải ảnh raster. Ở chế độ mock (không có server) hai nút đó thoái về in trình duyệt.
 */
import { useCallback, useMemo, useState } from 'react';
import { FileSpreadsheet, FileText, FileType } from 'lucide-react';
import { toast } from 'sonner';
import { txt } from '@/lib/text';
import { useParams, useNavigate, useLocation } from '@/lib/navigation';
import { getParentPath } from '@/components/shared/Breadcrumbs';
import { formatDate, formatDateTime, getFontStack } from '@/lib/utils';
import { isApi } from '@/lib/data/config';
import { buildPrintDocumentCSS } from '@/lib/print-document/print-styles';
import { downloadBlob } from '@/lib/print-document/download-blob';
import { safeFileName } from '@/lib/print-document/file-name';
import { apiGetEmployeeProfileDocx, apiGetEmployeeProfilePdf } from '@/lib/api/he-thong';
import PrintDocumentShell, { type PrintDocumentFormat } from '@/components/shared/PrintDocumentShell';
import { useUIStore } from '@/store/useStore';
import { useEmployee } from '../hooks/use-nhan-vien';
import { buildEmployeeProfileDocModel } from '../core/profile-document-model';
import { exportEmployeeProfileExcel } from '../utils/export-employee-profile';
import EmployeeProfileDocument from '../components/EmployeeProfileDocument';

const PRINT_STYLE_ID = 'employee-profile-print-styles';

const EmployeeProfilePreviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const companyInfo = useUIStore((s) => s.companyInfo);
  const { data: employee, isLoading, isError, error, refetch } = useEmployee(id ?? null);
  /** Chốt một lần khi mount — không gọi `new Date()` trong render */
  const [printedAt] = useState(() => formatDateTime(new Date()));

  const handleClose = useCallback(() => {
    const parent = getParentPath(location.pathname, txt);
    navigate(parent ?? '/he-thong/nhan-vien');
  }, [navigate, location.pathname]);

  const css = useMemo(
    () => buildPrintDocumentCSS({ fontStack: getFontStack(), includePage: true }),
    [],
  );

  const model = useMemo(
    () =>
      employee
        ? buildEmployeeProfileDocModel(
            employee,
            {
              companyName: companyInfo.companyName,
              address: companyInfo.address,
              email: companyInfo.email,
              phone: companyInfo.phone,
              logo: companyInfo.appLogo,
            },
            printedAt,
            { date: formatDate },
          )
        : null,
    [employee, companyInfo, printedAt],
  );

  const formats = useMemo<PrintDocumentFormat[]>(() => {
    const list: PrintDocumentFormat[] = [];
    if (isApi()) {
      list.push({ format: 'docx', label: txt('employee.export.doc'), icon: <FileType size={14} /> });
    }
    list.push({ format: 'excel', label: txt('employee.export.excel'), icon: <FileSpreadsheet size={14} /> });
    list.push({ format: 'pdf', label: txt('employee.export.pdf'), icon: <FileText size={14} /> });
    return list;
  }, []);

  const handleDownload = useCallback(
    async (format: string) => {
      if (!employee) return;
      const base = `Ho_so_${safeFileName(employee.ho_ten)}_${employee.id}`;

      if (format === 'excel') {
        await exportEmployeeProfileExcel(employee, companyInfo, printedAt);
        return;
      }

      // mock mode: không có server để render → thoái về hộp thoại in
      if (!isApi()) {
        toast.info(txt('employee.export.printFallback'));
        window.print();
        return;
      }

      const { blob, filename } =
        format === 'pdf'
          ? await apiGetEmployeeProfilePdf(employee.id)
          : await apiGetEmployeeProfileDocx(employee.id);
      downloadBlob(blob, filename ?? `${base}.${format === 'pdf' ? 'pdf' : 'docx'}`);
    },
    [employee, companyInfo, printedAt],
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div
          className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"
          aria-label={txt('common.loading')}
        />
      </div>
    );
  }

  const notFound = !isLoading && !employee && !isError;

  if (notFound || isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/30 p-4">
        <p className="text-destructive font-medium text-center">
          {isError ? (error?.message ?? txt('employee.profile.loadError')) : txt('employee.profile.notFound')}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          {isError && (
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card hover:bg-muted/50 font-medium"
            >
              {txt('common.retry')}
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white hover:bg-primary/90"
          >
            {txt('common.close')}
          </button>
        </div>
      </div>
    );
  }

  if (!employee || !model) return null;

  return (
    <PrintDocumentShell
      title={`${txt('employee.pdf.title')} - ${employee.ho_ten} (${employee.id})`}
      css={css}
      styleId={PRINT_STYLE_ID}
      formats={formats}
      onDownload={handleDownload}
      onClose={handleClose}
    >
      <EmployeeProfileDocument model={model} photoPlaceholder={txt('employee.pdf.photoPlaceholder')} />
    </PrintDocumentShell>
  );
};

export default EmployeeProfilePreviewPage;
