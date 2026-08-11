import React, { lazy, memo, useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { List, BarChart3, AlertTriangle } from 'lucide-react';
import { txt } from '@/lib/text';
import { DRAWER_Z_CONTENT_BASE } from '@/lib/dialog-sizes';
import { createFeatureModule } from '@/lib/factories/create-feature-module';
import type { ImportLookupSheet } from '@/lib/import';
import type { CongViec, CongViecFilters } from './core/types';
import { CAP_OPTIONS, UU_TIEN_OPTIONS } from './core/constants';
import { useCongViecStore } from './store/useCongViecStore';
import { useCongViec, useImportCongViec } from './hooks/use-cong-viec';
import { useCongViecPageHandlers } from './hooks/use-cong-viec-page-handlers';
import { toListParams } from './hooks/use-cong-viec-list';
import { getCongViecPage } from './services/cong-viec-service';
import CongViecToolbar from './components/cong-viec-toolbar';
import CongViecTable from './components/cong-viec-table';
import CongViecStats from './components/cong-viec-stats';
import { useEmployees } from './hooks/use-employee-options';

const CongViecForm = lazy(() => import('./components/cong-viec-form'));
const CongViecDetail = lazy(() => import('./components/cong-viec-detail'));

const DrawerLazyFallback: React.FC = () => (
  <div
    className="fixed inset-0 flex items-center justify-center bg-black/30 pointer-events-none"
    style={{ zIndex: DRAWER_Z_CONTENT_BASE }}
  >
    <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
  </div>
);

type CongViecTableProps = React.ComponentProps<typeof CongViecTable>;
type CongViecToolbarProps = React.ComponentProps<typeof CongViecToolbar>;
type CongViecStatsProps = React.ComponentProps<typeof CongViecStats>;
type CongViecWrapperProps = Omit<CongViecTableProps, 'employeeMap'>;

/**
 * Wrapper fetch nhân viên một lần ở cấp module — giữ employeeMap ổn định,
 * tránh vòng lặp re-render khi đặt hook trong memo table.
 */
const CongViecTableWrapper: React.FC<Omit<CongViecTableProps, 'employeeMap'>> = memo(function CongViecTableWrapper(props) {
  const allEmployees = useEmployees();
  const employeeMap = useMemo(
    () => new Map(allEmployees.map((e) => [e.id, e.ho_ten])),
    [allEmployees],
  );
  return <CongViecTable {...props} employeeMap={employeeMap} />;
});

const CongViecStatsWrapper: React.FC<CongViecStatsProps> = memo(function CongViecStatsWrapper(props) {
  const allEmployees = useEmployees();
  const employeeMap = useMemo(
    () => new Map(allEmployees.map((e) => [e.id, e.ho_ten])),
    [allEmployees],
  );
  const employeeTeamMap = useMemo(
    () => new Map(allEmployees.map((e) => [e.id, e.to_phong ?? ''])),
    [allEmployees],
  );
  return <CongViecStats {...props} employeeMap={employeeMap} employeeTeamMap={employeeTeamMap} />;
});

function useCongViecImportLookupSheets(): ImportLookupSheet[] {
  return useMemo(
    () => [
      {
        sheetName: 'Cap',
        title: txt('congViec.field.cap'),
        columns: [{ key: 'cap', label: txt('congViec.field.cap') }],
        rows: CAP_OPTIONS.map((o) => ({ cap: o.value })),
        mapsToImportKeys: ['cap'],
      },
      {
        sheetName: 'Uu_tien',
        title: txt('congViec.field.uuTien'),
        columns: [{ key: 'uu_tien', label: txt('congViec.field.uuTien') }],
        rows: UU_TIEN_OPTIONS.map((o) => ({ uu_tien: o.value })),
        mapsToImportKeys: ['uu_tien'],
      },
    ],
    [],
  );
}

/**
 * List công việc phân trang server nên rawData chỉ có 1 trang.
 * Hook này trả về hàm fetch TOÀN BỘ công việc theo filter/sort/search hiện tại
 * (page 100 dòng/lần đến hết) cho phạm vi "Tất cả" của ExportDialog.
 */
function useFetchAllCongViecForExport(): () => Promise<CongViec[]> {
  const { sort, searchTerm, filters } = useCongViecStore(
    useShallow((s) => ({ sort: s.sort, searchTerm: s.searchTerm, filters: s.filters })),
  );

  return useCallback(async () => {
    const pageSize = 100;
    const base = toListParams(1, pageSize, sort, searchTerm, filters);
    const first = await getCongViecPage({ ...base, offset: 0 });
    const all = [...first.items];
    while (all.length < first.total) {
      const page = await getCongViecPage({ ...base, offset: all.length });
      if (page.items.length === 0) break;
      all.push(...page.items);
    }
    return all;
  }, [sort, searchTerm, filters]);
}

const CongViecPage = createFeatureModule<CongViec, CongViecFilters, CongViecWrapperProps, CongViecToolbarProps, CongViecStatsProps>({
  name: 'Công việc',

  tabs: [
    { id: 'list', label: txt('congViec.tabList'), icon: List },
    { id: 'ton', label: txt('congViec.tabTon'), icon: AlertTriangle },
    { id: 'stats', label: txt('congViec.tabStats'), icon: BarChart3 },
  ],

  urlTabs: { validTabs: ['list', 'ton', 'stats'], defaultTab: 'list' },

  useData: (ctx) => {
    const result = useCongViec(ctx);
    return {
      data: result.data,
      isLoading: result.isLoading,
      total: result.total,
      isServerPaginated: true,
      mode: result.mode,
    };
  },

  useStore: useCongViecStore,
  keyExtractor: (item) => item.id,

  filterFn: () => true,
  skipClientSort: () => true,
  enableServerPaginationEffects: true,

  TableComponent: CongViecTableWrapper,
  ToolbarComponent: CongViecToolbar,
  FormComponent: CongViecForm,
  DetailComponent: CongViecDetail,
  StatsComponent: CongViecStatsWrapper,

  lazyDrawers: DrawerLazyFallback,
  getFormKey: (editing) => editing?.id ?? 'new',
  trackFormOrigin: true,
  usePageHandlers: useCongViecPageHandlers,

  useFetchAllForExport: useFetchAllCongViecForExport,

  importColumns: [
    { key: 'cap', label: txt('congViec.field.cap'), required: true },
    { key: 'tieu_de', label: txt('congViec.field.tieuDe'), required: true },
    { key: 'to_ar', label: txt('congViec.field.toAr'), required: true },
    { key: 'to_r', label: txt('congViec.field.toR') },
    { key: 'mnv_a', label: txt('congViec.field.mnvA'), required: true },
    { key: 'mnv_r', label: txt('congViec.field.mnvR') },
    { key: 'mnv_c', label: txt('congViec.field.mnvC') },
    { key: 'uu_tien', label: txt('congViec.field.uuTien'), required: true },
    { key: 'ngay_bd', label: txt('congViec.field.ngayBd'), required: true },
    { key: 'ngay_kt', label: txt('congViec.field.ngayKt'), required: true },
    { key: 'mo_ta', label: txt('congViec.field.moTa') },
    { key: 'ghi_chu', label: txt('congViec.field.ghiChu') },
  ],
  exportColumns: [
    { key: 'id', label: 'ID' },
    { key: 'tieu_de', label: txt('congViec.field.tieuDe') },
    { key: 'cap', label: txt('congViec.field.cap') },
    { key: 'to_ar', label: txt('congViec.field.toAr') },
    { key: 'to_r', label: txt('congViec.field.toR') },
    { key: 'mnv_a', label: txt('congViec.field.mnvA') },
    { key: 'mnv_r', label: txt('congViec.field.mnvR') },
    { key: 'mnv_c', label: txt('congViec.field.mnvC') },
    { key: 'uu_tien', label: txt('congViec.field.uuTien') },
    { key: 'ngay_bd', label: txt('congViec.field.ngayBd') },
    { key: 'ngay_kt', label: txt('congViec.field.ngayKt') },
    { key: 'ngay_ht', label: txt('congViec.field.ngayHt') },
    { key: 'mo_ta', label: txt('congViec.field.moTa') },
    { key: 'ghi_chu', label: txt('congViec.field.ghiChu') },
  ],
  exportMapFn: (item) => ({
    id: item.id,
    tieu_de: item.tieu_de,
    cap: item.cap,
    to_ar: item.to_ar,
    to_r: item.to_r ?? '',
    mnv_a: item.mnv_a,
    mnv_r: item.mnv_r ?? '',
    mnv_c: item.mnv_c ?? '',
    uu_tien: item.uu_tien,
    ngay_bd: item.ngay_bd,
    ngay_kt: item.ngay_kt,
    ngay_ht: item.ngay_ht ?? '',
    mo_ta: item.mo_ta ?? '',
    ghi_chu: item.ghi_chu ?? '',
  }),
  exportFileName: 'Danh_Sach_Cong_Viec',
  importFileName: 'Mau_Import_Cong_Viec',
  useImportLookupSheets: useCongViecImportLookupSheets,
  useImportMutation: useImportCongViec,
});

export default CongViecPage;
