import { lazy } from 'react';
import { txt } from '@/lib/text';
import { getLanguage } from '@/lib/utils';
import { matchesSearchTerm } from '@/lib/searchUtils';
import { createFlatListFeatureModule } from '@/lib/factories/create-flat-list-feature-module';
import type { MarketIn, MarketInFilters } from './core/types';
import { MARKET_IN_STATUS_LABELS } from './core/types';
import { useMarketInStore } from './store/useMarketInStore';
import {
  useDeleteMarketIn,
  useImportMarketIn,
  useMarketIn,
} from './hooks/use-market-in';
import { MARKET_IN_SEARCHABLE_KEYS } from './utils/search-keys';
import MarketInToolbar from './components/market-in-toolbar';
import MarketInList from './components/market-in-list';

const MarketInForm = lazy(() => import('./components/market-in-form'));
const MarketInDetail = lazy(() => import('./components/market-in-detail'));

type ListProps = React.ComponentProps<typeof MarketInList>;
type ToolbarProps = React.ComponentProps<typeof MarketInToolbar>;

const MarketInPage = createFlatListFeatureModule<
  MarketIn,
  MarketInFilters,
  ListProps,
  ToolbarProps
>({
  usePrimaryData: useMarketIn,
  useStore: useMarketInStore,
  keyExtractor: (item) => item.id,
  filterFn: (item, term, filters) => {
    if (
      filters.id_khach_hang.length > 0 &&
      !filters.id_khach_hang.includes(item.id_khach_hang)
    ) {
      return false;
    }
    if (
      filters.trang_thai.length > 0 &&
      !filters.trang_thai.includes(item.trang_thai)
    ) {
      return false;
    }
    if (
      filters.id_nguoi_ve.length > 0 &&
      (item.id_nguoi_ve == null || !filters.id_nguoi_ve.includes(item.id_nguoi_ve))
    ) {
      return false;
    }
    if (
      filters.nguoi_tao.length > 0 &&
      (item.nguoi_tao == null || !filters.nguoi_tao.includes(item.nguoi_tao))
    ) {
      return false;
    }
    return matchesSearchTerm(
      item as unknown as Record<string, unknown>,
      term,
      [...MARKET_IN_SEARCHABLE_KEYS],
    );
  },
  sortFn: (a, b, sort) => {
    const key = sort.column as keyof MarketIn;
    const aVal = a[key] ?? '';
    const bVal = b[key] ?? '';
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return aVal - bVal;
    }
    return String(aVal).localeCompare(String(bVal), getLanguage());
  },
  defaultSortFn: (a, b) => a.thu_tu - b.thu_tu || a.ma_market.localeCompare(b.ma_market, getLanguage()),
  exportMapFn: (item) => ({
    thu_tu: item.thu_tu,
    ma_market: item.ma_market,
    ma_san_pham: item.ma_san_pham,
    ma_khach_hang: item.ma_khach_hang ?? '',
    ten_khach_hang: item.ten_khach_hang ?? '',
    mo_ta: item.mo_ta ?? '',
    link_file: item.link_file ?? '',
    ten_nguoi_ve: item.ten_nguoi_ve ?? '',
    trang_thai:
      MARKET_IN_STATUS_LABELS[item.trang_thai as keyof typeof MARKET_IN_STATUS_LABELS] ??
      item.trang_thai,
    ngay_hieu_luc: item.ngay_hieu_luc ?? '',
  }),
  importColumns: [
    { key: 'thu_tu', label: txt('printMarket.export.order') },
    { key: 'ma_market', label: txt('printMarket.export.marketCode'), required: true },
    { key: 'ma_san_pham', label: txt('printMarket.export.productCode'), required: true },
    { key: 'ma_khach_hang', label: txt('printMarket.export.customerCode'), required: true },
    { key: 'mo_ta', label: txt('printMarket.export.description') },
    { key: 'link_file', label: txt('printMarket.export.linkFile') },
    { key: 'ten_nguoi_ve', label: txt('printMarket.export.artist') },
    { key: 'ngay_hieu_luc', label: txt('printMarket.export.effectiveDate') },
  ],
  exportColumns: [
    { key: 'thu_tu', label: txt('printMarket.export.order') },
    { key: 'ma_market', label: txt('printMarket.export.marketCode') },
    { key: 'ma_san_pham', label: txt('printMarket.export.productCode') },
    { key: 'ma_khach_hang', label: txt('printMarket.export.customerCode') },
    { key: 'ten_khach_hang', label: txt('printMarket.export.customerName') },
    { key: 'mo_ta', label: txt('printMarket.export.description') },
    { key: 'link_file', label: txt('printMarket.export.linkFile') },
    { key: 'ten_nguoi_ve', label: txt('printMarket.export.artist') },
    { key: 'trang_thai', label: txt('printMarket.export.status') },
    { key: 'ngay_hieu_luc', label: txt('printMarket.export.effectiveDate') },
  ],
  exportFileName: 'Danh_Sach_Market_In',
  importTemplateName: txt('printMarket.importTemplateName'),
  noExportDataMessage: txt('printMarket.noExportData'),
  useImportMutation: useImportMarketIn,
  useDeleteMutation: useDeleteMarketIn,
  getDeleteTitle: () => txt('printMarket.deleteTitle'),
  getDeleteMessage: () => txt('printMarket.deleteMessage'),
  getBulkDeleteMessage: (count) => txt('printMarket.bulkDeleteMessage', { count }),
  ToolbarComponent: MarketInToolbar,
  syncViewingItem: (viewing, primary) => {
    if (!viewing) return null;
    return primary.find((p) => p.id === viewing.id) ?? viewing;
  },
  buildToolbarProps: ({ onAdd, onExport, onImport, onDeleteMany }) => ({
    onAdd,
    onExport,
    onImport,
    onDeleteMany,
  }),
  buildListProps: ({ filtered, isLoading, onEdit, onDelete, onView, onDuplicate }) => ({
    data: filtered,
    isLoading,
    onEdit,
    onDelete,
    onView,
    onDuplicate,
  }),
  ListComponent: MarketInList,
  FormComponent: MarketInForm,
  DetailComponent: MarketInDetail,
});

export default MarketInPage;
