import { lazy } from 'react';
import { txt } from '@/lib/text';
import { getLanguage } from '@/lib/utils';
import { matchesSearchTerm } from '@/lib/searchUtils';
import { createFlatListFeatureModule } from '@/lib/factories/create-flat-list-feature-module';
import type { PhieuHanhChinh, PhieuHanhChinhFilters } from './core/types';
import { PHIEU_BUOI_LABELS, PHIEU_HANH_CHINH_STATUS_LABELS } from './core/types';
import { usePhieuHanhChinhStore } from './store/usePhieuHanhChinhStore';
import {
  useDeletePhieuHanhChinh,
  useImportPhieuHanhChinh,
  usePhieuHanhChinh,
} from './hooks/use-phieu-hanh-chinh';
import { PHIEU_HANH_CHINH_SEARCHABLE_KEYS } from './utils/search-keys';
import { matchesPhieuDateFilter } from './utils/date-range-filter';
import PhieuHanhChinhToolbar from './components/phieu-hanh-chinh-toolbar';
import PhieuHanhChinhList from './components/phieu-hanh-chinh-list';

const PhieuHanhChinhForm = lazy(() => import('./components/phieu-hanh-chinh-form'));
const PhieuHanhChinhDetail = lazy(() => import('./components/phieu-hanh-chinh-detail'));

type ListProps = React.ComponentProps<typeof PhieuHanhChinhList>;
type ToolbarProps = React.ComponentProps<typeof PhieuHanhChinhToolbar>;

const PhieuHanhChinhPage = createFlatListFeatureModule<
  PhieuHanhChinh,
  PhieuHanhChinhFilters,
  ListProps,
  ToolbarProps
>({
  usePrimaryData: usePhieuHanhChinh,
  useStore: usePhieuHanhChinhStore,
  keyExtractor: (item) => item.id,
  filterFn: (item, term, filters) => {
    if (
      filters.ma_phieu.length > 0 &&
      !filters.ma_phieu.includes(item.ma_phieu)
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
      filters.id_nhan_vien.length > 0 &&
      !filters.id_nhan_vien.includes(item.id_nhan_vien)
    ) {
      return false;
    }
    if (
      filters.id_phong_ban.length > 0 &&
      (item.id_phong_ban == null ||
        !filters.id_phong_ban.includes(item.id_phong_ban))
    ) {
      return false;
    }
    if (
      filters.nguoi_tao.length > 0 &&
      (item.nguoi_tao == null || !filters.nguoi_tao.includes(item.nguoi_tao))
    ) {
      return false;
    }
    if (
      !matchesPhieuDateFilter(
        item.tu_ngay,
        item.den_ngay,
        filters.date_preset,
        filters.date_custom_start,
        filters.date_custom_end,
      )
    ) {
      return false;
    }
    return matchesSearchTerm(
      item as unknown as Record<string, unknown>,
      term,
      [...PHIEU_HANH_CHINH_SEARCHABLE_KEYS],
    );
  },
  sortFn: (a, b, sort) => {
    const key = sort.column as keyof PhieuHanhChinh;
    const aVal = a[key] ?? '';
    const bVal = b[key] ?? '';
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return aVal - bVal;
    }
    return String(aVal).localeCompare(String(bVal), getLanguage());
  },
  defaultSortFn: (a, b) =>
    String(b.tg_tao).localeCompare(String(a.tg_tao), getLanguage()),
  exportMapFn: (item) => ({
    ma_phieu: item.ma_phieu ?? '',
    ten_loai_phieu: item.ten_loai_phieu ?? '',
    ten_nhan_vien: item.ten_nhan_vien ?? '',
    ten_phong_ban: item.ten_phong_ban ?? '',
    tu_ngay: item.tu_ngay,
    buoi_bat_dau:
      PHIEU_BUOI_LABELS[item.buoi_bat_dau as keyof typeof PHIEU_BUOI_LABELS] ??
      item.buoi_bat_dau,
    den_ngay: item.den_ngay,
    buoi_ket_thuc:
      PHIEU_BUOI_LABELS[item.buoi_ket_thuc as keyof typeof PHIEU_BUOI_LABELS] ??
      item.buoi_ket_thuc,
    gio_bat_dau: item.gio_bat_dau ?? '',
    gio_ket_thuc: item.gio_ket_thuc ?? '',
    ly_do: item.ly_do ?? '',
    trang_thai:
      PHIEU_HANH_CHINH_STATUS_LABELS[
        item.trang_thai as keyof typeof PHIEU_HANH_CHINH_STATUS_LABELS
      ] ?? item.trang_thai,
  }),
  importColumns: [
    { key: 'ma_phieu', label: txt('adminForm.export.typeCode'), required: true },
    { key: 'ten_nhan_vien', label: txt('adminForm.export.employee'), required: true },
    { key: 'tu_ngay', label: txt('adminForm.export.fromDate'), required: true },
    { key: 'buoi_bat_dau', label: txt('adminForm.export.startShift'), required: true },
    { key: 'den_ngay', label: txt('adminForm.export.toDate'), required: true },
    { key: 'buoi_ket_thuc', label: txt('adminForm.export.endShift'), required: true },
    { key: 'gio_bat_dau', label: txt('adminForm.export.startTime') },
    { key: 'gio_ket_thuc', label: txt('adminForm.export.endTime') },
    { key: 'ly_do', label: txt('adminForm.export.reason') },
  ],
  exportColumns: [
    { key: 'ma_phieu', label: txt('adminForm.export.typeCode') },
    { key: 'ten_loai_phieu', label: txt('adminForm.export.type') },
    { key: 'ten_nhan_vien', label: txt('adminForm.export.employee') },
    { key: 'ten_phong_ban', label: txt('adminForm.export.department') },
    { key: 'tu_ngay', label: txt('adminForm.export.fromDate') },
    { key: 'buoi_bat_dau', label: txt('adminForm.export.startShift') },
    { key: 'den_ngay', label: txt('adminForm.export.toDate') },
    { key: 'buoi_ket_thuc', label: txt('adminForm.export.endShift') },
    { key: 'gio_bat_dau', label: txt('adminForm.export.startTime') },
    { key: 'gio_ket_thuc', label: txt('adminForm.export.endTime') },
    { key: 'ly_do', label: txt('adminForm.export.reason') },
    { key: 'trang_thai', label: txt('adminForm.export.status') },
  ],
  exportFileName: 'Danh_Sach_Phieu_Hanh_Chinh',
  importTemplateName: txt('adminForm.importTemplateName'),
  noExportDataMessage: txt('adminForm.noExportData'),
  useImportMutation: useImportPhieuHanhChinh,
  useDeleteMutation: useDeletePhieuHanhChinh,
  getDeleteTitle: () => txt('adminForm.deleteTitle'),
  getDeleteMessage: () => txt('adminForm.deleteMessage'),
  getBulkDeleteMessage: (count) => txt('adminForm.bulkDeleteMessage', { count }),
  ToolbarComponent: PhieuHanhChinhToolbar,
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
  ListComponent: PhieuHanhChinhList,
  FormComponent: PhieuHanhChinhForm,
  DetailComponent: PhieuHanhChinhDetail,
});

export default PhieuHanhChinhPage;
