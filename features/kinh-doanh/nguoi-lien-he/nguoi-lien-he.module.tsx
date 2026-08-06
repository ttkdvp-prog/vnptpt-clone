import { lazy } from 'react';
import { txt } from '@/lib/text';
import { getLanguage } from '@/lib/utils';
import { matchesSearchTerm } from '@/lib/searchUtils';
import { createFlatListFeatureModule } from '@/lib/factories/create-flat-list-feature-module';
import type { NguoiLienHe, NguoiLienHeFilters } from './core/types';
import { useNguoiLienHeStore } from './store/useNguoiLienHeStore';
import {
  useDeleteNguoiLienHe,
  useImportNguoiLienHe,
  useNguoiLienHe,
} from './hooks/use-nguoi-lien-he';
import { NGUOI_LIEN_HE_SEARCHABLE_KEYS } from './utils/search-keys';
import NguoiLienHeToolbar from './components/nguoi-lien-he-toolbar';
import NguoiLienHeList from './components/nguoi-lien-he-list';

const NguoiLienHeForm = lazy(() => import('./components/nguoi-lien-he-form'));
const NguoiLienHeDetail = lazy(() => import('./components/nguoi-lien-he-detail'));

type ListProps = React.ComponentProps<typeof NguoiLienHeList>;
type ToolbarProps = React.ComponentProps<typeof NguoiLienHeToolbar>;

const NguoiLienHePage = createFlatListFeatureModule<
  NguoiLienHe,
  NguoiLienHeFilters,
  ListProps,
  ToolbarProps
>({
  usePrimaryData: useNguoiLienHe,
  useStore: useNguoiLienHeStore,
  keyExtractor: (item) => item.id,
  filterFn: (item, term, filters) => {
    if (
      filters.id_khach_hang.length > 0 &&
      !filters.id_khach_hang.includes(item.id_khach_hang)
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
      [...NGUOI_LIEN_HE_SEARCHABLE_KEYS],
    );
  },
  sortFn: (a, b, sort) => {
    const key = sort.column as keyof NguoiLienHe;
    const aVal = a[key] ?? '';
    const bVal = b[key] ?? '';
    return String(aVal).localeCompare(String(bVal), getLanguage());
  },
  defaultSortFn: (a, b) => a.ho_ten.localeCompare(b.ho_ten, getLanguage()),
  exportMapFn: (item) => ({
    ho_ten: item.ho_ten,
    ma_khach_hang: item.ma_khach_hang ?? '',
    ten_khach_hang: item.ten_khach_hang ?? '',
    ngay_sinh: item.ngay_sinh ?? '',
    chuc_vu: item.chuc_vu ?? '',
    so_dien_thoai: item.so_dien_thoai ?? '',
    email: item.email ?? '',
    dia_chi: item.dia_chi ?? '',
    ghi_chu: item.ghi_chu ?? '',
  }),
  importColumns: [
    { key: 'ho_ten', label: txt('contact.export.name'), required: true },
    { key: 'ma_khach_hang', label: txt('contact.export.customerCode'), required: true },
    { key: 'ten_khach_hang', label: txt('contact.export.customer') },
    { key: 'ngay_sinh', label: txt('contact.export.birth') },
    { key: 'chuc_vu', label: txt('contact.export.title') },
    { key: 'so_dien_thoai', label: txt('contact.export.phone') },
    { key: 'email', label: txt('contact.export.email') },
    { key: 'dia_chi', label: txt('contact.export.address') },
    { key: 'ghi_chu', label: txt('contact.export.note') },
  ],
  exportColumns: [
    { key: 'ho_ten', label: txt('contact.export.name') },
    { key: 'ma_khach_hang', label: txt('contact.export.customerCode') },
    { key: 'ten_khach_hang', label: txt('contact.export.customer') },
    { key: 'ngay_sinh', label: txt('contact.export.birth') },
    { key: 'chuc_vu', label: txt('contact.export.title') },
    { key: 'so_dien_thoai', label: txt('contact.export.phone') },
    { key: 'email', label: txt('contact.export.email') },
    { key: 'dia_chi', label: txt('contact.export.address') },
    { key: 'ghi_chu', label: txt('contact.export.note') },
  ],
  exportFileName: 'Danh_Sach_Nguoi_Lien_He',
  importTemplateName: txt('contact.importTemplateName'),
  noExportDataMessage: txt('contact.noExportData'),
  useImportMutation: useImportNguoiLienHe,
  useDeleteMutation: useDeleteNguoiLienHe,
  getDeleteTitle: () => txt('contact.deleteTitle'),
  getDeleteMessage: () => txt('contact.deleteMessage'),
  getBulkDeleteMessage: (count) => txt('contact.bulkDeleteMessage', { count }),
  ToolbarComponent: NguoiLienHeToolbar,
  syncViewingItem: (viewing, primary) => {
    if (!viewing) return null;
    return primary.find((p) => p.id === viewing.id) ?? viewing;
  },
  getFormExtraProps: (customerId) =>
    customerId ? { defaultKhachHangId: customerId } : {},
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
  ListComponent: NguoiLienHeList,
  FormComponent: NguoiLienHeForm,
  DetailComponent: NguoiLienHeDetail,
});

export default NguoiLienHePage;
