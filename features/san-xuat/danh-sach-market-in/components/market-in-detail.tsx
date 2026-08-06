import { useCallback, useMemo } from 'react';
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Link2,
  PauseCircle,
  Printer,
  ShieldCheck,
} from 'lucide-react';
import { txt } from '@/lib/text';
import { ICON_SIZE } from '@/lib/icon-sizes';
import { fieldIcon } from '@/lib/field-icon';
import { formatDate } from '@/lib/utils';
import {
  DetailField,
  DetailFieldGrid,
  DetailFooterActions,
  DetailSection,
  DetailSystemSection,
  DetailToolbar,
  GenericDrawer,
} from '@/components/views';
import type { DetailToolbarAction } from '@/components/shared/DetailToolbar';
import { DRAWER_WIDTH_DETAIL } from '@/components/shared/GenericDrawer';
import { CONFIRM_YES } from '@/lib/button-labels';
import { useCan } from '@/hooks/use-can';
import { useCanOnRecord } from '@/hooks/use-can-on-record';
import { useConfirmStore } from '@/store/useConfirmStore';
import { MARKET_IN_STATUS, type MarketIn } from '../core/types';
import { MARKET_IN_FIELD_ICONS } from '../core/market-in-field-icons';
import { useApproveMarketIn, useSuspendMarketIn } from '../hooks/use-market-in';
import {
  canApproveMarketIn,
  getMarketInApproveActionLabel,
  getMarketInApproveConfirm,
  isMarketInReapply,
} from '../utils/approve-workflow';
import { MarketInStatusBadge } from './market-in-badges';

interface Props {
  data: MarketIn;
  onClose: () => void;
  onEdit: (item: MarketIn) => void;
  onDelete: (id: string) => void;
  onDuplicate?: (item: MarketIn) => void;
  maxWidthClass?: string;
  stackLevel?: number;
}

const MarketInDetail: React.FC<Props> = ({
  data,
  onClose,
  onEdit,
  onDelete,
  onDuplicate,
  maxWidthClass = DRAWER_WIDTH_DETAIL,
  stackLevel = 0,
}) => {
  const confirm = useConfirmStore((s) => s.confirm);
  const approveMutation = useApproveMarketIn();
  const suspendMutation = useSuspendMarketIn();

  const recordCtx = { nguoi_tao: data.nguoi_tao };
  const canEdit = useCanOnRecord('edit', 'printMarkets', recordCtx);
  const canDelete = useCanOnRecord('delete', 'printMarkets', recordCtx);
  const canCreate = useCan('create', 'printMarkets');

  const handleApprove = useCallback(() => {
    const { title, message } = getMarketInApproveConfirm(data.trang_thai);
    const reapply = isMarketInReapply(data.trang_thai);
    confirm({
      title,
      message,
      variant: 'info',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        await approveMutation.mutateAsync({ id: data.id, reapply });
      },
    });
  }, [approveMutation, confirm, data.id, data.trang_thai]);

  const handleSuspend = useCallback(() => {
    confirm({
      title: txt('printMarket.suspendTitle'),
      message: txt('printMarket.suspendMessage'),
      variant: 'warning',
      confirmText: CONFIRM_YES(),
      onConfirm: async () => {
        await suspendMutation.mutateAsync(data.id);
      },
    });
  }, [confirm, data.id, suspendMutation]);

  const toolbarActions = useMemo((): DetailToolbarAction[] => {
    if (!canEdit) return [];
    const actions: DetailToolbarAction[] = [];
    if (canApproveMarketIn(data.trang_thai)) {
      actions.push({
        label: getMarketInApproveActionLabel(data.trang_thai),
        icon: <CheckCircle2 />,
        onClick: handleApprove,
        variant: 'success',
      });
    }
    if (data.trang_thai !== MARKET_IN_STATUS.NGUNG_AP_DUNG) {
      actions.push({
        label: txt('printMarket.suspendAction'),
        icon: <PauseCircle />,
        onClick: handleSuspend,
        variant: 'warning',
      });
    }
    return actions;
  }, [canEdit, data.trang_thai, handleApprove, handleSuspend]);

  return (
    <GenericDrawer
      title={txt('printMarket.detail.title')}
      subtitle={txt('printMarket.detail.subtitle')}
      icon={<Printer size={ICON_SIZE.prominent} />}
      onClose={onClose}
      maxWidthClass={maxWidthClass}
      stackLevel={stackLevel}
      footerCompact
      footer={
        <DetailFooterActions
          onClose={onClose}
          onDuplicate={
            canCreate && onDuplicate
              ? () => {
                  onDuplicate(data);
                  onClose();
                }
              : undefined
          }
          onEdit={
            canEdit
              ? () => {
                  onEdit(data);
                  onClose();
                }
              : undefined
          }
          onDelete={
            canDelete
              ? () => {
                  onDelete(data.id);
                  onClose();
                }
              : undefined
          }
        />
      }
    >
      <div className="space-y-5">
        <div className="bg-card p-4 rounded-xl border border-border/50 shadow-sm flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center text-white shadow-lg shrink-0">
            <Printer size={24} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="text-base font-bold text-foreground truncate">{data.ma_market}</h2>
              <span className="font-mono text-xs text-muted-foreground shrink-0">
                {data.ma_san_pham}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <MarketInStatusBadge value={data.trang_thai} />
              {data.ten_khach_hang && (
                <span className="text-xs text-muted-foreground truncate">
                  {data.ten_khach_hang}
                </span>
              )}
            </div>
          </div>
        </div>

        <DetailToolbar
          actions={toolbarActions}
          className="bg-card rounded-xl border border-border"
        />

        <DetailSection title={txt('printMarket.form.generalInfo')} icon={<FileText size={14} />}>
          <DetailFieldGrid>
            <DetailField
              label={txt('printMarket.form.order')}
              value={String(data.thu_tu)}
              icon={fieldIcon(MARKET_IN_FIELD_ICONS.thu_tu)}
            />
            <DetailField
              label={txt('printMarket.form.marketCode')}
              value={data.ma_market}
              icon={fieldIcon(MARKET_IN_FIELD_ICONS.ma_market)}
            />
            <DetailField
              label={txt('printMarket.form.productCode')}
              value={data.ma_san_pham}
              icon={fieldIcon(MARKET_IN_FIELD_ICONS.ma_san_pham)}
            />
            <DetailField
              label={txt('printMarket.form.customer')}
              value={
                data.ten_khach_hang
                  ? `${data.ma_khach_hang ? `${data.ma_khach_hang} — ` : ''}${data.ten_khach_hang}`
                  : '—'
              }
              icon={fieldIcon(MARKET_IN_FIELD_ICONS.id_khach_hang)}
            />
            <DetailField
              label={txt('printMarket.form.artist')}
              value={data.ten_nguoi_ve || '—'}
              icon={fieldIcon(MARKET_IN_FIELD_ICONS.id_nguoi_ve)}
            />
            <DetailField
              label={txt('printMarket.detail.status')}
              value={<MarketInStatusBadge value={data.trang_thai} />}
              icon={fieldIcon(MARKET_IN_FIELD_ICONS.trang_thai)}
            />
            <DetailField
              label={txt('printMarket.form.description')}
              value={data.mo_ta || '—'}
              className="sm:col-span-2"
              icon={fieldIcon(MARKET_IN_FIELD_ICONS.mo_ta)}
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection title={txt('printMarket.form.fileInfo')} icon={<Link2 size={14} />}>
          <DetailFieldGrid>
            <DetailField
              label={txt('printMarket.form.linkFile')}
              value={
                data.link_file ? (
                  <a
                    href={data.link_file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline break-all"
                  >
                    <ExternalLink size={12} className="shrink-0" />
                    {data.link_file}
                  </a>
                ) : (
                  '—'
                )
              }
              className="sm:col-span-2"
              icon={fieldIcon(MARKET_IN_FIELD_ICONS.link_file)}
            />
            <DetailField
              label={txt('printMarket.form.effectiveDate')}
              value={data.ngay_hieu_luc ? formatDate(data.ngay_hieu_luc) : '—'}
              icon={fieldIcon(MARKET_IN_FIELD_ICONS.ngay_hieu_luc)}
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSection
          title={txt('printMarket.detail.approvalInfo')}
          icon={<ShieldCheck size={14} />}
        >
          <DetailFieldGrid>
            <DetailField
              label={txt('printMarket.detail.status')}
              value={<MarketInStatusBadge value={data.trang_thai} />}
              icon={fieldIcon(MARKET_IN_FIELD_ICONS.trang_thai)}
            />
            <DetailField
              label={txt('printMarket.detail.approver')}
              value={data.ten_nguoi_duyet || '—'}
              icon={fieldIcon(MARKET_IN_FIELD_ICONS.ten_nguoi_duyet)}
            />
            <DetailField
              label={txt('printMarket.detail.approvedAt')}
              value={data.tg_duyet ? formatDate(data.tg_duyet) : '—'}
              icon={fieldIcon(MARKET_IN_FIELD_ICONS.tg_duyet)}
            />
          </DetailFieldGrid>
        </DetailSection>

        <DetailSystemSection
          title={txt('printMarket.detail.systemInfo')}
          createdAt={data.tg_tao}
          updatedAt={data.tg_cap_nhat}
          createdBy={data.ten_nguoi_tao ?? data.nguoi_tao ?? undefined}
          labels={{
            createdAt: txt('printMarket.detail.createdAt'),
            updated: txt('printMarket.detail.updated'),
          }}
        />
      </div>
    </GenericDrawer>
  );
};

export default MarketInDetail;
