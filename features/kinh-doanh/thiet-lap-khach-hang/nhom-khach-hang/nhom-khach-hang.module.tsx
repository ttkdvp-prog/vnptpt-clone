import { lazy } from 'react';
import { txt } from '@/lib/text';
import { getLanguage } from '@/lib/utils';
import { matchesSearchTerm } from '@/lib/searchUtils';
import { createFlatListFeatureModule } from '@/lib/factories/create-flat-list-feature-module';
import type { NhomKhachHang, NhomKhachHangFilters } from './core/types';
import { useNhomKhachHangStore } from './store/useNhomKhachHangStore';
import {
  useDeleteNhomKhachHang,
  useImportNhomKhachHang,
  useNhomKhachHang,
} from './hooks/use-nhom-khach-hang';
import { NHOM_KHACH_HANG_SEARCHABLE_KEYS } from './utils/search-keys';
import NhomKhachHangToolbar from './components/nhom-khach-hang-toolbar';
import NhomKhachHangList from './components/nhom-khach-hang-list';

const NhomKhachHangForm = lazy(() => import('./components/nhom-khach-hang-form'));
const NhomKhachHangDetail = lazy(() => import('./components/nhom-khach-hang-detail'));

type ListProps = React.ComponentProps<typeof NhomKhachHangList>;
type ToolbarProps = React.ComponentProps<typeof NhomKhachHangToolbar>;

const NhomKhachHangPage = createFlatListFeatureModule<
  NhomKhachHang,
  NhomKhachHangFilters,
  ListProps,
  ToolbarProps
>({
  usePrimaryData: useNhomKhachHang,
  useStore: useNhomKhachHangStore,
  keyExtractor: (item) => item.id,
  filterFn: (item, term, filters) => {
    if (
      filters.nguoi_tao.length > 0 &&
      (item.nguoi_tao == null || !filters.nguoi_tao.includes(item.nguoi_tao))
    ) {
      return false;
    }
    return matchesSearchTerm(
      item as unknown as Record<string, unknown>,
      term,
      [...NHOM_KHACH_HANG_SEARCHABLE_KEYS],
    );
  },
  sortFn: (a, b, sort) => {
    const key = sort.column as keyof NhomKhachHang;
    const aVal = a[key] ?? '';
    const bVal = b[key] ?? '';
    return String(aVal).localeCompare(String(bVal), getLanguage());
  },
  defaultSortFn: (a, b) => a.ten_nhom.localeCompare(b.ten_nhom, getLanguage()),
  exportMapFn: (item) => ({
    ten_nhom: item.ten_nhom,
    mo_ta: item.mo_ta ?? '',
  }),
  importColumns: [
    { key: 'ten_nhom', label: txt('customerSettings.nhom.form.name'), required: true },
    { key: 'mo_ta', label: txt('customerSettings.nhom.form.description') },
  ],
  exportColumns: [
    { key: 'ten_nhom', label: txt('customerSettings.nhom.exportName') },
    { key: 'mo_ta', label: txt('customerSettings.nhom.exportDesc') },
  ],
  exportFileName: 'Danh_Sach_Nhom_Khach_Hang',
  importTemplateName: txt('customerSettings.nhom.importTemplateName'),
  noExportDataMessage: txt('customerSettings.nhom.noExportData'),
  useImportMutation: useImportNhomKhachHang,
  useDeleteMutation: useDeleteNhomKhachHang,
  getDeleteTitle: () => txt('customerSettings.nhom.deleteTitle'),
  getDeleteMessage: () => txt('customerSettings.nhom.deleteMessage'),
  getBulkDeleteMessage: (count) =>
    txt('customerSettings.nhom.bulkDeleteMessage', { count }),
  ToolbarComponent: NhomKhachHangToolbar,
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
  ListComponent: NhomKhachHangList,
  FormComponent: NhomKhachHangForm,
  DetailComponent: NhomKhachHangDetail,
  embedded: true,
});

export default NhomKhachHangPage;
