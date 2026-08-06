import React, { lazy, useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { List, BarChart3 } from 'lucide-react';
import { txt } from '@/lib/text';
import { SERVER_GC_TIME_MS } from '@/lib/query/query-config';
import {
  departmentsQueryOptions,
  jobLevelsQueryOptions,
  activePositionsQueryOptions,
  positionsQueryOptions,
} from '@/features/he-thong/queries/master-data';
import { DRAWER_Z_CONTENT_BASE } from '@/lib/dialog-sizes';
import { createFeatureModule } from '@/lib/factories/create-feature-module';
import type { ImportLookupSheet } from '@/lib/import';
import { useDepartments } from '@/features/he-thong/phong-ban/hooks/use-phong-ban';
import { useActivePositions } from '@/features/he-thong/chuc-vu/hooks/use-chuc-vu';
import { formatDate } from '@/lib/utils';
import type { Employee, EmployeeFilters } from './core/types';
import { TRANG_THAI_NHAN_VIEN } from './core/constants';
import { useEmployeeStore } from './store/useEmployeeStore';
import { useEmployees, useImportEmployees } from './hooks/use-nhan-vien';
import { toListParams } from './hooks/use-employees-list';
import { getEmployeesPage } from './services/nhan-vien-service';
import { useEmployeePageHandlers } from './hooks/use-employee-page-handlers';
import EmployeeToolbar from './components/nhan-vien-toolbar';
import EmployeeTable from './components/nhan-vien-table';
import EmployeeStats from './components/nhan-vien-stats';
import BulkEditSheet from './components/nhan-vien-bulk-edit';

const EmployeeForm = lazy(() => import('./components/nhan-vien-form'));
const EmployeeDetail = lazy(() => import('./components/nhan-vien-detail'));

const DrawerLazyFallback: React.FC = () => (
  <div
    className="fixed inset-0 flex items-center justify-center bg-black/30 pointer-events-none"
    style={{ zIndex: DRAWER_Z_CONTENT_BASE }}
  >
    <div
      className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent"
      aria-hidden
    />
  </div>
);

function useEmployeeImportLookupSheets(): ImportLookupSheet[] {
  const { data: departments = [] } = useDepartments();
  const { data: positions = [] } = useActivePositions();

  return useMemo(
    () => [
      {
        sheetName: 'Phong_ban',
        title: txt('employee.department'),
        columns: [
          { key: 'ma_phong_ban', label: txt('department.code') },
          { key: 'ten_phong_ban', label: txt('department.name') },
        ],
        rows: departments.map((d) => ({
          ma_phong_ban: d.ma_phong_ban,
          ten_phong_ban: d.ten_phong_ban,
        })),
        mapsToImportKeys: ['ma_phong_ban'],
      },
      {
        sheetName: 'Chuc_vu',
        title: txt('employee.position'),
        columns: [
          { key: 'ma_chuc_vu', label: txt('position.form.code') },
          { key: 'ten_chuc_vu', label: txt('position.form.name') },
        ],
        rows: positions.map((p) => ({
          ma_chuc_vu: p.ma_chuc_vu,
          ten_chuc_vu: p.ten_chuc_vu,
        })),
        mapsToImportKeys: ['ma_chuc_vu'],
      },
      {
        sheetName: 'Trang_thai_NV',
        title: txt('employee.status'),
        columns: [{ key: 'trang_thai', label: txt('employee.status') }],
        rows: TRANG_THAI_NHAN_VIEN.map((trang_thai) => ({ trang_thai })),
        mapsToImportKeys: ['trang_thai'],
      },
      {
        sheetName: 'Gioi_tinh',
        title: txt('employee.gender'),
        columns: [{ key: 'gioi_tinh', label: txt('employee.gender') }],
        rows: [{ gioi_tinh: 'Nam' }, { gioi_tinh: 'Nữ' }, { gioi_tinh: 'Khác' }],
        mapsToImportKeys: ['gioi_tinh'],
      },
    ],
    [departments, positions],
  );
}

/**
 * List nhân viên phân trang server nên rawData chỉ có 1 trang.
 * Hook này trả về hàm fetch TOÀN BỘ nhân viên theo filter/sort/search hiện tại
 * (page 100 dòng/lần đến hết) cho phạm vi "Tất cả" của ExportDialog.
 */
function useFetchAllEmployeesForExport(): () => Promise<Employee[]> {
  const { sort, searchTerm, filters } = useEmployeeStore(
    useShallow((s) => ({ sort: s.sort, searchTerm: s.searchTerm, filters: s.filters })),
  );

  return useCallback(async () => {
    const pageSize = 100;
    const base = toListParams(1, pageSize, sort, searchTerm, filters);
    const first = await getEmployeesPage({ ...base, offset: 0 });
    const all = [...first.items];
    while (all.length < first.total) {
      const page = await getEmployeesPage({ ...base, offset: all.length });
      if (page.items.length === 0) break;
      all.push(...page.items);
    }
    return all;
  }, [sort, searchTerm, filters]);
}

type EmployeeTableProps = React.ComponentProps<typeof EmployeeTable>;
type EmployeeToolbarProps = React.ComponentProps<typeof EmployeeToolbar>;
type EmployeeStatsProps = React.ComponentProps<typeof EmployeeStats>;

const NhanVienPage = createFeatureModule<
  Employee,
  EmployeeFilters,
  EmployeeTableProps,
  EmployeeToolbarProps,
  EmployeeStatsProps
>({
  name: 'Nhân viên',

  tabs: [
    { id: 'list', label: txt('employee.tabList'), icon: List },
    { id: 'stats', label: txt('employee.tabStats'), icon: BarChart3 },
  ],

  urlTabs: { validTabs: ['list', 'stats'], defaultTab: 'list' },

  useData: () => {
    const result = useEmployees();
    return {
      data: result.data,
      isLoading: result.isLoading,
      total: result.total,
      isServerPaginated: true,
      mode: result.mode,
    };
  },

  useStore: useEmployeeStore,
  keyExtractor: (e) => e.id,

  useFetchAllForExport: useFetchAllEmployeesForExport,

  /** List filtering/sort is server-side — pass through page rows. */
  filterFn: () => true,

  skipClientSort: () => true,
  enableServerPaginationEffects: true,

  useMount: (queryClient) => {
    const prefetchOpts = { staleTime: Infinity, gcTime: SERVER_GC_TIME_MS };
    const prefetchMaster = () => {
      void queryClient.prefetchQuery({ ...departmentsQueryOptions(), ...prefetchOpts });
      void queryClient.prefetchQuery({ ...positionsQueryOptions(), ...prefetchOpts });
      void queryClient.prefetchQuery({ ...activePositionsQueryOptions(), ...prefetchOpts });
      void queryClient.prefetchQuery({ ...jobLevelsQueryOptions(), ...prefetchOpts });
    };
    const idleId =
      typeof requestIdleCallback !== 'undefined'
        ? requestIdleCallback(prefetchMaster, { timeout: 3000 })
        : window.setTimeout(prefetchMaster, 500);
    return () => {
      if (typeof cancelIdleCallback !== 'undefined' && typeof idleId === 'number') {
        cancelIdleCallback(idleId);
      } else {
        clearTimeout(idleId as number);
      }
    };
  },

  getToolbarExtraProps: ({ rawData }) => ({ employees: rawData }),
  getTableExtraProps: ({ rawData }) => ({ employeesForFilterCounts: rawData }),

  buildStatsProps: ({ onViewItem }) => ({
    onViewItem,
  }),

  TableComponent: EmployeeTable,
  ToolbarComponent: EmployeeToolbar,
  FormComponent: EmployeeForm,
  DetailComponent: EmployeeDetail,
  StatsComponent: EmployeeStats,
  BulkEditComponent: ({ selectedItems, onClose, onSuccess }) => (
    <BulkEditSheet
      selectedEmployees={selectedItems}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  ),

  lazyDrawers: DrawerLazyFallback,
  getFormKey: (editing) => editing?.id ?? 'new',
  trackFormOrigin: true,
  usePageHandlers: useEmployeePageHandlers,

  importColumns: [
    { key: 'ho_ten', label: txt('employee.name'), required: true },
    { key: 'email', label: txt('employee.form.workEmail'), required: true },
    { key: 'so_dien_thoai', label: txt('employee.phone'), required: true },
    { key: 'ma_chuc_vu', label: txt('position.form.code'), required: true },
    { key: 'ma_phong_ban', label: txt('department.code') },
    { key: 'gioi_tinh', label: txt('employee.gender') },
    { key: 'trang_thai', label: txt('employee.status') },
    { key: 'ten_dang_nhap', label: txt('employee.form.loginName') },
    { key: 'mat_khau_tam', label: txt('employee.form.tempPassword') },
  ],
  exportColumns: [
    { key: 'id', label: 'ID' },
    { key: 'ho_ten', label: txt('employee.name') },
    { key: 'ten_dang_nhap', label: txt('employee.form.loginName') },
    { key: 'gioi_tinh', label: txt('employee.gender') },
    { key: 'email', label: txt('employee.form.workEmail') },
    { key: 'so_dien_thoai', label: txt('employee.phone') },
    { key: 'ten_chuc_vu', label: txt('employee.position') },
    { key: 'ten_phong_ban', label: txt('employee.department') },
    { key: 'ten_bo_phan', label: txt('employee.division') },
    { key: 'trang_thai_text', label: txt('employee.status') },
    { key: 'tg_tao_text', label: txt('employee.store.createdCol') },
  ],
  exportMapFn: (emp) => ({
    id: emp.id,
    ho_ten: emp.ho_ten,
    ten_dang_nhap: emp.ten_dang_nhap ?? '',
    gioi_tinh: emp.gioi_tinh,
    email: emp.email,
    so_dien_thoai: emp.so_dien_thoai,
    ten_chuc_vu: emp.ten_chuc_vu,
    ten_phong_ban: emp.ten_phong_ban,
    ten_bo_phan: emp.ten_bo_phan ?? '',
    trang_thai_text: emp.trang_thai,
    tg_tao_text: emp.tg_tao ? formatDate(emp.tg_tao) : '',
  }),
  exportFileName: txt('employee.exportFileName'),
  importFileName: txt('employee.importTemplateName'),
  useImportLookupSheets: useEmployeeImportLookupSheets,
  useImportMutation: useImportEmployees,
});

export default NhanVienPage;
