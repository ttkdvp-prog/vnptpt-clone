/**
 * Trang preview hợp đồng (mở tab mới) — toolbar: Tải (Doc / PDF), In.
 * Route: /in-hop-dong/:id
 */
import { useCallback, useMemo, type ReactNode } from 'react';
import { FileText, FileType, X } from 'lucide-react';
import { txt } from '@/lib/text';
import { useParams, useNavigate } from '@/lib/navigation';
import PrintDocumentShell, { type PrintDocumentFormat } from '@/components/shared/PrintDocumentShell';
import { useEmployee } from '@/features/he-thong/nhan-vien/hooks/use-nhan-vien';
import { useHopDongDetail } from '../hooks/use-hop-dong';
import ContractPrintContent from '../components/contract-print-content';
import { exportContractDoc, type ContractExportFormat } from '../utils/export-contract';
import { printContractPDF } from '../utils/print-contract-pdf';
import { getContractLegalCSS } from '../utils/contract-document';

const FORMATS: { format: ContractExportFormat; labelKey: string; icon: ReactNode }[] = [
  { format: 'doc', labelKey: 'contract.print.exportDoc', icon: <FileType size={14} /> },
  { format: 'pdf', labelKey: 'contract.print.exportPdf', icon: <FileText size={14} /> },
];

const PRINT_STYLE_ID = 'contract-print-styles';

const ContractPrintPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: contract, isLoading, isError, error, refetch } = useHopDongDetail(id ?? null);
  const { data: employee, isLoading: isEmployeeLoading } = useEmployee(
    contract?.id_nhan_vien ?? null,
  );

  const handleClose = useCallback(() => {
    navigate('/hanh-chinh/hop-dong');
  }, [navigate]);

  const css = useMemo(() => getContractLegalCSS(), []);

  const formats = useMemo<PrintDocumentFormat[]>(
    () => FORMATS.map((f) => ({ format: f.format, label: txt(f.labelKey), icon: f.icon })),
    [],
  );

  const handleDownload = useCallback(
    async (format: string) => {
      if (!contract) return;
      if (format === 'pdf') await printContractPDF(contract);
      else await exportContractDoc(contract, employee);
    },
    [contract, employee],
  );

  if (isLoading || (contract && isEmployeeLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div
          className="h-10 w-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin"
          aria-label={txt('common.loading')}
        />
      </div>
    );
  }

  const notFound = !isLoading && !contract && !isError;

  if (notFound || isError) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-muted/30 p-4">
        <p className="text-destructive font-medium text-center">
          {isError
            ? (error?.message ?? txt('contract.print.loadError'))
            : txt('contract.print.notFound')}
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
            <X size={16} />
            {txt('contract.print.close')}
          </button>
        </div>
      </div>
    );
  }

  if (!contract) return null;

  return (
    <PrintDocumentShell
      title={`${txt('contract.print.title')} - ${contract.ma_hop_dong}`}
      css={css}
      styleId={PRINT_STYLE_ID}
      formats={formats}
      onDownload={handleDownload}
      onClose={handleClose}
      downloadLabel={txt('contract.print.download')}
      printLabel={txt('contract.print.print')}
      errorMessage={txt('contract.print.exportFailed')}
    >
      <ContractPrintContent contract={contract} employee={employee} />
    </PrintDocumentShell>
  );
};

export default ContractPrintPage;
