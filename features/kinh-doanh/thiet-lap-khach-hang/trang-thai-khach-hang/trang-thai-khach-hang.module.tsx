import { lazy } from 'react';
import { txt } from '@/lib/text';
import { getLanguage } from '@/lib/utils';
import { matchesSearchTerm } from '@/lib/searchUtils';
import { createFlatListFeatureModule } from '@/lib/factories/create-flat-list-feature-module';
import type { TrangThaiKhachHang, TrangThaiKhachHangFilters } from './core/types';
import { useTrangThaiKhachHangStore } from './store/useTrangThaiKhachHangStore';
import {
  useDeleteTrangThaiKhachHang,
  useImportTrangThaiKhachHang,
  useTrangThaiKhachHang,
} from './hooks/use-trang-thai-khach-hang';
import { TRANG_THAI_KHACH_HANG_SEARCHABLE_KEYS } from './utils/search-keys';
import TrangThaiKhachHangToolbar from './components/trang-thai-khach-hang-toolbar';
import TrangThaiKhachHangList from './components/trang-thai-khach-hang-list';

const TrangThaiKhachHangForm = lazy(() => import('./components/trang-thai-khach-hang-form'));
const TrangThaiKhachHangDetail = lazy(() => import('./components/trang-thai-khach-hang-detail'));

type ListProps = React.ComponentProps<typeof TrangThaiKhachHangList>;
type ToolbarProps = React.ComponentProps<typeof TrangThaiKhachHangToolbar>;

const TrangThaiKhachHangPage = createFlatListFeatureModule<
  TrangThaiKhachHang,
  TrangThaiKhachHangFilters,
  ListProps,
  ToolbarProps
>({
  usePrimaryData: useTrangThaiKhachHang,
  useStore: useTrangThaiKhachHangStore,
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
      [...TRANG_THAI_KHACH_HANG_SEARCHABLE_KEYS],
    );
  },
  sortFn: (a, b, sort) => {
    const key = sort.column as keyof TrangThaiKhachHang;
    const aVal = a[key] ?? '';
    const bVal = b[key] ?? '';
    return String(aVal).localeCompare(String(bVal), getLanguage());
  },
  defaultSortFn: (a, b) => a.ten_trang_thai.localeCompare(b.ten_trang_thai, getLanguage()),
  exportMapFn: (item) => ({
    ten_trang_thai: item.ten_trang_thai,
    mo_ta: item.mo_ta ?? '',
  }),
  importColumns: [
    { key: 'ten_trang_thai', label: txt('customerSettings.trangThai.form.name'), required: true },
    { key: 'mo_ta', label: txt('customerSettings.trangThai.form.description') },
  ],
  exportColumns: [
    { key: 'ten_trang_thai', label: txt('customerSettings.trangThai.exportName') },
    { key: 'mo_ta', label: txt('customerSettings.trangThai.exportDesc') },
  ],
  exportFileName: 'Danh_Sach_Trang_Thai_Khach_Hang',
  importTemplateName: txt('customerSettings.trangThai.importTemplateName'),
  noExportDataMessage: txt('customerSettings.trangThai.noExportData'),
  useImportMutation: useImportTrangThaiKhachHang,
  useDeleteMutation: useDeleteTrangThaiKhachHang,
  getDeleteTitle: () => txt('customerSettings.trangThai.deleteTitle'),
  getDeleteMessage: () => txt('customerSettings.trangThai.deleteMessage'),
  getBulkDeleteMessage: (count) =>
    txt('customerSettings.trangThai.bulkDeleteMessage', { count }),
  ToolbarComponent: TrangThaiKhachHangToolbar,
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
  ListComponent: TrangThaiKhachHangList,
  FormComponent: TrangThaiKhachHangForm,
  DetailComponent: TrangThaiKhachHangDetail,
  embedded: true,
});

export default TrangThaiKhachHangPage;
