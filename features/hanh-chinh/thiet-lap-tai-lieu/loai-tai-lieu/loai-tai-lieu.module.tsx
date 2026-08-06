import { lazy } from 'react';
import { txt } from '@/lib/text';
import { getLanguage } from '@/lib/utils';
import { matchesSearchTerm } from '@/lib/searchUtils';
import { createFlatListFeatureModule } from '@/lib/factories/create-flat-list-feature-module';
import type { LoaiTaiLieu, LoaiTaiLieuFilters } from './core/types';
import { useLoaiTaiLieuStore } from './store/useLoaiTaiLieuStore';
import {
  useDeleteLoaiTaiLieu,
  useImportLoaiTaiLieu,
  useLoaiTaiLieu,
} from './hooks/use-loai-tai-lieu';
import { LOAI_TAI_LIEU_SEARCHABLE_KEYS } from './utils/search-keys';
import LoaiTaiLieuToolbar from './components/loai-tai-lieu-toolbar';
import LoaiTaiLieuList from './components/loai-tai-lieu-list';

const LoaiTaiLieuForm = lazy(() => import('./components/loai-tai-lieu-form'));
const LoaiTaiLieuDetail = lazy(() => import('./components/loai-tai-lieu-detail'));

type ListProps = React.ComponentProps<typeof LoaiTaiLieuList>;
type ToolbarProps = React.ComponentProps<typeof LoaiTaiLieuToolbar>;

const LoaiTaiLieuPage = createFlatListFeatureModule<
  LoaiTaiLieu,
  LoaiTaiLieuFilters,
  ListProps,
  ToolbarProps
>({
  usePrimaryData: useLoaiTaiLieu,
  useStore: useLoaiTaiLieuStore,
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
      [...LOAI_TAI_LIEU_SEARCHABLE_KEYS],
    );
  },
  sortFn: (a, b, sort) => {
    const key = sort.column as keyof LoaiTaiLieu;
    const aVal = a[key] ?? '';
    const bVal = b[key] ?? '';
    if (key === 'thu_tu') {
      return Number(aVal) - Number(bVal);
    }
    return String(aVal).localeCompare(String(bVal), getLanguage());
  },
  defaultSortFn: (a, b) => a.thu_tu - b.thu_tu || a.ten_loai_tai_lieu.localeCompare(b.ten_loai_tai_lieu, getLanguage()),
  exportMapFn: (item) => ({
    thu_tu: item.thu_tu,
    ten_loai_tai_lieu: item.ten_loai_tai_lieu,
    mo_ta: item.mo_ta ?? '',
  }),
  importColumns: [
    { key: 'thu_tu', label: txt('documentSettings.loai.form.order') },
    { key: 'ten_loai_tai_lieu', label: txt('documentSettings.loai.form.name'), required: true },
    { key: 'mo_ta', label: txt('documentSettings.loai.form.description') },
  ],
  exportColumns: [
    { key: 'thu_tu', label: txt('documentSettings.loai.exportOrder') },
    { key: 'ten_loai_tai_lieu', label: txt('documentSettings.loai.exportName') },
    { key: 'mo_ta', label: txt('documentSettings.loai.exportDesc') },
  ],
  exportFileName: 'Danh_Sach_Loai_Tai_Lieu',
  importTemplateName: txt('documentSettings.loai.importTemplateName'),
  noExportDataMessage: txt('documentSettings.loai.noExportData'),
  useImportMutation: useImportLoaiTaiLieu,
  useDeleteMutation: useDeleteLoaiTaiLieu,
  getDeleteTitle: () => txt('documentSettings.loai.deleteTitle'),
  getDeleteMessage: () => txt('documentSettings.loai.deleteMessage'),
  getBulkDeleteMessage: (count) =>
    txt('documentSettings.loai.bulkDeleteMessage', { count }),
  ToolbarComponent: LoaiTaiLieuToolbar,
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
  ListComponent: LoaiTaiLieuList,
  FormComponent: LoaiTaiLieuForm,
  DetailComponent: LoaiTaiLieuDetail,
  embedded: true,
});

export default LoaiTaiLieuPage;
