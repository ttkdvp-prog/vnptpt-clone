import { lazy } from 'react';
import { txt } from '@/lib/text';
import { getLanguage } from '@/lib/utils';
import { matchesSearchTerm } from '@/lib/searchUtils';
import { createFlatListFeatureModule } from '@/lib/factories/create-flat-list-feature-module';
import type { HopDong, HopDongFilters } from './core/types';
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_TYPE_LABELS,
  SALARY_MODE_LABELS,
} from './core/types';
import { useHopDongStore } from './store/useHopDongStore';
import {
  useDeleteHopDong,
  useHopDong,
  useNoopHopDongImport,
} from './hooks/use-hop-dong';
import { HOP_DONG_SEARCHABLE_KEYS } from './utils/search-keys';
import HopDongToolbar from './components/hop-dong-toolbar';
import HopDongList from './components/hop-dong-list';

const HopDongForm = lazy(() => import('./components/hop-dong-form'));
const HopDongDetail = lazy(() => import('./components/hop-dong-detail'));

type ListProps = React.ComponentProps<typeof HopDongList>;
type ToolbarProps = React.ComponentProps<typeof HopDongToolbar>;

const HopDongPage = createFlatListFeatureModule<
  HopDong,
  HopDongFilters,
  ListProps,
  ToolbarProps
>({
  usePrimaryData: useHopDong,
  useStore: useHopDongStore,
  keyExtractor: (item) => item.id,
  filterFn: (item, term, filters) => {
    if (
      filters.loai_hop_dong.length > 0 &&
      !filters.loai_hop_dong.includes(item.loai_hop_dong)
    ) {
      return false;
    }
    if (filters.trang_thai.length > 0 && !filters.trang_thai.includes(item.trang_thai)) {
      return false;
    }
    if (
      filters.id_phong_ban.length > 0 &&
      !filters.id_phong_ban.includes(item.id_phong_ban)
    ) {
      return false;
    }
    return matchesSearchTerm(item as unknown as Record<string, unknown>, term, [
      ...HOP_DONG_SEARCHABLE_KEYS,
    ]);
  },
  sortFn: (a, b, sort) => {
    const key = sort.column as keyof HopDong;
    const aVal = a[key] ?? '';
    const bVal = b[key] ?? '';
    return String(aVal).localeCompare(String(bVal), getLanguage());
  },
  defaultSortFn: (a, b) =>
    String(b.tg_cap_nhat).localeCompare(String(a.tg_cap_nhat)) ||
    a.ma_hop_dong.localeCompare(b.ma_hop_dong, getLanguage()),
  exportMapFn: (item) => ({
    ma_hop_dong: item.ma_hop_dong,
    loai_hop_dong:
      CONTRACT_TYPE_LABELS[item.loai_hop_dong as keyof typeof CONTRACT_TYPE_LABELS] ??
      item.loai_hop_dong,
    ten_nhan_vien: item.ten_nhan_vien ?? '',
    ten_phong_ban: item.ten_phong_ban ?? '',
    ten_chuc_vu: item.ten_chuc_vu ?? '',
    ngay_ky: item.ngay_ky,
    ngay_hieu_luc: item.ngay_hieu_luc,
    ngay_ket_thuc: item.ngay_ket_thuc ?? '',
    muc_luong: item.muc_luong,
    hinh_thuc_tra_luong:
      SALARY_MODE_LABELS[item.hinh_thuc_tra_luong as keyof typeof SALARY_MODE_LABELS] ??
      item.hinh_thuc_tra_luong,
    trang_thai:
      CONTRACT_STATUS_LABELS[item.trang_thai as keyof typeof CONTRACT_STATUS_LABELS] ??
      item.trang_thai,
  }),
  importColumns: [
    { key: 'ma_hop_dong', label: txt('contract.export.code'), required: true },
  ],
  exportColumns: [
    { key: 'ma_hop_dong', label: txt('contract.export.code') },
    { key: 'loai_hop_dong', label: txt('contract.export.type') },
    { key: 'ten_nhan_vien', label: txt('contract.export.employee') },
    { key: 'ten_phong_ban', label: txt('contract.export.department') },
    { key: 'ten_chuc_vu', label: txt('contract.export.position') },
    { key: 'ngay_ky', label: txt('contract.export.signDate') },
    { key: 'ngay_hieu_luc', label: txt('contract.export.effectiveDate') },
    { key: 'ngay_ket_thuc', label: txt('contract.export.endDate') },
    { key: 'muc_luong', label: txt('contract.export.salary') },
    { key: 'hinh_thuc_tra_luong', label: txt('contract.export.salaryMode') },
    { key: 'trang_thai', label: txt('contract.export.status') },
  ],
  exportFileName: 'Danh_Sach_Hop_Dong',
  importTemplateName: 'Mau_Import_Hop_Dong',
  noExportDataMessage: txt('contract.noExportData'),
  useImportMutation: useNoopHopDongImport,
  useDeleteMutation: useDeleteHopDong,
  getDeleteTitle: () => txt('contract.deleteTitle'),
  getDeleteMessage: () => txt('contract.deleteMessage'),
  getBulkDeleteMessage: (count) => txt('contract.bulkDeleteMessage', { count }),
  ToolbarComponent: HopDongToolbar,
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
  ListComponent: HopDongList,
  FormComponent: HopDongForm,
  DetailComponent: HopDongDetail,
});

export default HopDongPage;
