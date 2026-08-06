import { lazy } from 'react';
import { txt } from '@/lib/text';
import { getLanguage } from '@/lib/utils';
import { matchesSearchTerm } from '@/lib/searchUtils';
import { createFlatListFeatureModule } from '@/lib/factories/create-flat-list-feature-module';
import { ANNOUNCEMENT_AUDIENCE, type ThongBao, type ThongBaoFilters } from './core/types';
import { useThongBaoStore } from './store/useThongBaoStore';
import {
  useDeleteThongBao,
  useNoopThongBaoImport,
  useThongBao,
} from './hooks/use-thong-bao';
import { THONG_BAO_SEARCHABLE_KEYS } from './utils/search-keys';
import { matchesThongBaoDateFilter } from './utils/date-range-filter';
import ThongBaoToolbar from './components/thong-bao-toolbar';
import ThongBaoList from './components/thong-bao-list';

const ThongBaoForm = lazy(() => import('./components/thong-bao-form'));
const ThongBaoDetail = lazy(() => import('./components/thong-bao-detail'));

type ListProps = React.ComponentProps<typeof ThongBaoList>;
type ToolbarProps = React.ComponentProps<typeof ThongBaoToolbar>;

const ThongBaoPage = createFlatListFeatureModule<
  ThongBao,
  ThongBaoFilters,
  ListProps,
  ToolbarProps
>({
  usePrimaryData: useThongBao,
  useStore: useThongBaoStore,
  keyExtractor: (item) => item.id,
  filterFn: (item, term, filters) => {
    if (
      !matchesThongBaoDateFilter(
        item.tg_dang,
        filters.date_preset,
        filters.date_custom_start,
        filters.date_custom_end,
      )
    ) {
      return false;
    }
    if (filters.pham_vi.length > 0) {
      const isAll = item.id_chuc_vu.length === 0;
      const matchAudience =
        (filters.pham_vi.includes(ANNOUNCEMENT_AUDIENCE.ALL) && isAll) ||
        (filters.pham_vi.includes(ANNOUNCEMENT_AUDIENCE.BY_POSITION) && !isAll);
      if (!matchAudience) return false;
    }
    if (filters.id_chuc_vu.length > 0) {
      // Thông báo gửi tất cả vẫn hiện khi lọc theo chức vụ cụ thể
      const isPublic = item.id_chuc_vu.length === 0;
      const overlap = item.id_chuc_vu.some((id) => filters.id_chuc_vu.includes(id));
      if (!isPublic && !overlap) return false;
    }
    if (
      filters.nguoi_tao.length > 0 &&
      (item.nguoi_tao == null || !filters.nguoi_tao.includes(item.nguoi_tao))
    ) {
      return false;
    }
    return matchesSearchTerm(item as unknown as Record<string, unknown>, term, [
      ...THONG_BAO_SEARCHABLE_KEYS,
    ]);
  },
  sortFn: (a, b, sort) => {
    const key = sort.column as keyof ThongBao;
    const aVal = a[key] ?? '';
    const bVal = b[key] ?? '';
    return String(aVal).localeCompare(String(bVal), getLanguage());
  },
  defaultSortFn: (a, b) =>
    String(b.tg_dang).localeCompare(String(a.tg_dang)) ||
    a.tieu_de.localeCompare(b.tieu_de, getLanguage()),
  exportMapFn: (item) => ({
    tg_dang: item.tg_dang,
    tieu_de: item.tieu_de,
    noi_dung: item.noi_dung,
    ten_chuc_vu: !item.id_chuc_vu.length
      ? txt('announcement.allPositions')
      : (item.ten_chuc_vu ?? item.id_chuc_vu).join(', '),
    ten_nguoi_tao: item.ten_nguoi_tao ?? item.nguoi_tao ?? '',
  }),
  importColumns: [
    { key: 'tieu_de', label: txt('announcement.export.title'), required: true },
  ],
  exportColumns: [
    { key: 'tg_dang', label: txt('announcement.export.datetime') },
    { key: 'tieu_de', label: txt('announcement.export.title') },
    { key: 'noi_dung', label: txt('announcement.export.content') },
    { key: 'ten_chuc_vu', label: txt('announcement.export.positions') },
    { key: 'ten_nguoi_tao', label: txt('announcement.export.creator') },
  ],
  exportFileName: 'Danh_Sach_Thong_Bao',
  importTemplateName: 'Mau_Import_Thong_Bao',
  noExportDataMessage: txt('announcement.noExportData'),
  useImportMutation: useNoopThongBaoImport,
  useDeleteMutation: useDeleteThongBao,
  getDeleteTitle: () => txt('announcement.deleteTitle'),
  getDeleteMessage: () => txt('announcement.deleteMessage'),
  getBulkDeleteMessage: (count) => txt('announcement.bulkDeleteMessage', { count }),
  ToolbarComponent: ThongBaoToolbar,
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
  ListComponent: ThongBaoList,
  FormComponent: ThongBaoForm,
  DetailComponent: ThongBaoDetail,
});

export default ThongBaoPage;
