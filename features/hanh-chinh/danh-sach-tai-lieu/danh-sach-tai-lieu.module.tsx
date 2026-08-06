import { lazy } from 'react';
import { txt } from '@/lib/text';
import { getLanguage } from '@/lib/utils';
import { matchesSearchTerm } from '@/lib/searchUtils';
import { createFlatListFeatureModule } from '@/lib/factories/create-flat-list-feature-module';
import type { DanhSachTaiLieu, DanhSachTaiLieuFilters } from './core/types';
import { DOCUMENT_STATUS_LABELS } from './core/types';
import { useDanhSachTaiLieuStore } from './store/useDanhSachTaiLieuStore';
import {
  useDeleteDanhSachTaiLieu,
  useImportDanhSachTaiLieu,
  useDanhSachTaiLieu,
} from './hooks/use-danh-sach-tai-lieu';
import { DANH_SACH_TAI_LIEU_SEARCHABLE_KEYS } from './utils/search-keys';
import DanhSachTaiLieuToolbar from './components/danh-sach-tai-lieu-toolbar';
import DanhSachTaiLieuList from './components/danh-sach-tai-lieu-list';

const DanhSachTaiLieuForm = lazy(() => import('./components/danh-sach-tai-lieu-form'));
const DanhSachTaiLieuDetail = lazy(() => import('./components/danh-sach-tai-lieu-detail'));

type ListProps = React.ComponentProps<typeof DanhSachTaiLieuList>;
type ToolbarProps = React.ComponentProps<typeof DanhSachTaiLieuToolbar>;

const DanhSachTaiLieuPage = createFlatListFeatureModule<
  DanhSachTaiLieu,
  DanhSachTaiLieuFilters,
  ListProps,
  ToolbarProps
>({
  usePrimaryData: useDanhSachTaiLieu,
  useStore: useDanhSachTaiLieuStore,
  keyExtractor: (item) => item.id,
  filterFn: (item, term, filters) => {
    if (
      filters.id_loai_tai_lieu.length > 0 &&
      !filters.id_loai_tai_lieu.includes(item.id_loai_tai_lieu)
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
      filters.nguoi_tao.length > 0 &&
      (item.nguoi_tao == null || !filters.nguoi_tao.includes(item.nguoi_tao))
    ) {
      return false;
    }
    return matchesSearchTerm(
      item as unknown as Record<string, unknown>,
      term,
      [...DANH_SACH_TAI_LIEU_SEARCHABLE_KEYS],
    );
  },
  sortFn: (a, b, sort) => {
    const key = sort.column as keyof DanhSachTaiLieu;
    const aVal = a[key] ?? '';
    const bVal = b[key] ?? '';
    return String(aVal).localeCompare(String(bVal), getLanguage());
  },
  defaultSortFn: (a, b) =>
    String(b.tg_cap_nhat).localeCompare(String(a.tg_cap_nhat)) ||
    a.ten_tai_lieu.localeCompare(b.ten_tai_lieu, getLanguage()),
  exportMapFn: (item) => ({
    ten_loai_tai_lieu: item.ten_loai_tai_lieu ?? '',
    ten_tai_lieu: item.ten_tai_lieu,
    mo_ta: item.mo_ta ?? '',
    link_tai_lieu: item.link_tai_lieu ?? '',
    ghi_chu: item.ghi_chu ?? '',
    trang_thai:
      DOCUMENT_STATUS_LABELS[item.trang_thai as keyof typeof DOCUMENT_STATUS_LABELS] ??
      item.trang_thai,
  }),
  importColumns: [
    { key: 'id_loai_tai_lieu', label: txt('document.export.type'), required: true },
    { key: 'ten_tai_lieu', label: txt('document.export.name'), required: true },
    { key: 'mo_ta', label: txt('document.export.description') },
    { key: 'link_tai_lieu', label: txt('document.export.link') },
    { key: 'ghi_chu', label: txt('document.export.note') },
    { key: 'trang_thai', label: txt('document.export.status') },
  ],
  exportColumns: [
    { key: 'ten_loai_tai_lieu', label: txt('document.export.type') },
    { key: 'ten_tai_lieu', label: txt('document.export.name') },
    { key: 'mo_ta', label: txt('document.export.description') },
    { key: 'link_tai_lieu', label: txt('document.export.link') },
    { key: 'ghi_chu', label: txt('document.export.note') },
    { key: 'trang_thai', label: txt('document.export.status') },
  ],
  exportFileName: 'Danh_Sach_Tai_Lieu',
  importTemplateName: txt('document.importTemplateName'),
  noExportDataMessage: txt('document.noExportData'),
  useImportMutation: useImportDanhSachTaiLieu,
  useDeleteMutation: useDeleteDanhSachTaiLieu,
  getDeleteTitle: () => txt('document.deleteTitle'),
  getDeleteMessage: () => txt('document.deleteMessage'),
  getBulkDeleteMessage: (count) => txt('document.bulkDeleteMessage', { count }),
  ToolbarComponent: DanhSachTaiLieuToolbar,
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
  ListComponent: DanhSachTaiLieuList,
  FormComponent: DanhSachTaiLieuForm,
  DetailComponent: DanhSachTaiLieuDetail,
});

export default DanhSachTaiLieuPage;
