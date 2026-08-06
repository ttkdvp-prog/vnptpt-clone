import { lazy } from 'react';
import { txt } from '@/lib/text';
import { getLanguage } from '@/lib/utils';
import { matchesSearchTerm } from '@/lib/searchUtils';
import { createFlatListFeatureModule } from '@/lib/factories/create-flat-list-feature-module';
import type { KhachHang, KhachHangFilters } from './core/types';
import { useKhachHangStore } from './store/useKhachHangStore';
import {
  useDeleteKhachHang,
  useImportKhachHang,
  useKhachHang,
} from './hooks/use-khach-hang';
import { KHACH_HANG_SEARCHABLE_KEYS } from './utils/search-keys';
import KhachHangToolbar from './components/khach-hang-toolbar';
import KhachHangList from './components/khach-hang-list';

const KhachHangForm = lazy(() => import('./components/khach-hang-form'));
const KhachHangDetail = lazy(() => import('./components/khach-hang-detail'));

type ListProps = React.ComponentProps<typeof KhachHangList>;
type ToolbarProps = React.ComponentProps<typeof KhachHangToolbar>;

const KhachHangPage = createFlatListFeatureModule<
  KhachHang,
  KhachHangFilters,
  ListProps,
  ToolbarProps
>({
  usePrimaryData: useKhachHang,
  useStore: useKhachHangStore,
  keyExtractor: (item) => item.id,
  filterFn: (item, term, filters) => {
    if (filters.id_nhom.length > 0 && !filters.id_nhom.includes(item.id_nhom)) {
      return false;
    }
    if (
      filters.id_trang_thai.length > 0 &&
      !filters.id_trang_thai.includes(item.id_trang_thai)
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
      [...KHACH_HANG_SEARCHABLE_KEYS],
    );
  },
  sortFn: (a, b, sort) => {
    const key = sort.column as keyof KhachHang;
    const aVal = a[key] ?? '';
    const bVal = b[key] ?? '';
    return String(aVal).localeCompare(String(bVal), getLanguage());
  },
  defaultSortFn: (a, b) => a.ma_khach_hang.localeCompare(b.ma_khach_hang, getLanguage()),
  exportMapFn: (item) => ({
    ma_khach_hang: item.ma_khach_hang,
    ten_khach_hang: item.ten_khach_hang,
    so_dien_thoai: item.so_dien_thoai ?? '',
    dia_chi: item.dia_chi ?? '',
    ghi_chu: item.ghi_chu ?? '',
    ten_nhom: item.ten_nhom ?? '',
    ten_trang_thai: item.ten_trang_thai ?? '',
  }),
  importColumns: [
    { key: 'ma_khach_hang', label: txt('customer.export.code'), required: true },
    { key: 'ten_khach_hang', label: txt('customer.export.name'), required: true },
    { key: 'so_dien_thoai', label: txt('customer.export.phone') },
    { key: 'dia_chi', label: txt('customer.export.address') },
    { key: 'ghi_chu', label: txt('customer.export.note') },
    { key: 'ten_nhom', label: txt('customer.export.group'), required: true },
    { key: 'ten_trang_thai', label: txt('customer.export.status'), required: true },
  ],
  exportColumns: [
    { key: 'ma_khach_hang', label: txt('customer.export.code') },
    { key: 'ten_khach_hang', label: txt('customer.export.name') },
    { key: 'so_dien_thoai', label: txt('customer.export.phone') },
    { key: 'dia_chi', label: txt('customer.export.address') },
    { key: 'ghi_chu', label: txt('customer.export.note') },
    { key: 'ten_nhom', label: txt('customer.export.group') },
    { key: 'ten_trang_thai', label: txt('customer.export.status') },
  ],
  exportFileName: 'Danh_Sach_Khach_Hang',
  importTemplateName: txt('customer.importTemplateName'),
  noExportDataMessage: txt('customer.noExportData'),
  useImportMutation: useImportKhachHang,
  useDeleteMutation: useDeleteKhachHang,
  getDeleteTitle: () => txt('customer.deleteTitle'),
  getDeleteMessage: () => txt('customer.deleteMessage'),
  getBulkDeleteMessage: (count) => txt('customer.bulkDeleteMessage', { count }),
  ToolbarComponent: KhachHangToolbar,
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
  ListComponent: KhachHangList,
  FormComponent: KhachHangForm,
  DetailComponent: KhachHangDetail,
});

export default KhachHangPage;
