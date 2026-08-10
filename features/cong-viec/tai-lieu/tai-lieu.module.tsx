import React, { lazy } from 'react';
import { List, BarChart3 } from 'lucide-react';
import { txt } from '@/lib/text';
import { DRAWER_Z_CONTENT_BASE } from '@/lib/dialog-sizes';
import { createFeatureModule } from '@/lib/factories/create-feature-module';
import type { TaiLieu, TaiLieuFilters } from './core/types';
import { useTaiLieuStore } from './store/useTaiLieuStore';
import { useTaiLieu } from './hooks/use-tai-lieu';
import { useTaiLieuPageHandlers } from './hooks/use-tai-lieu-page-handlers';
import TaiLieuToolbar from './components/tai-lieu-toolbar';
import TaiLieuTable from './components/tai-lieu-table';
import TaiLieuStats from './components/tai-lieu-stats';

const TaiLieuForm = lazy(() => import('./components/tai-lieu-form'));
const TaiLieuDetail = lazy(() => import('./components/tai-lieu-detail'));

const DrawerLazyFallback: React.FC = () => (
  <div
    className="fixed inset-0 flex items-center justify-center bg-black/30 pointer-events-none"
    style={{ zIndex: DRAWER_Z_CONTENT_BASE }}
  >
    <div className="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
  </div>
);

type TaiLieuTableProps = React.ComponentProps<typeof TaiLieuTable>;
type TaiLieuToolbarProps = React.ComponentProps<typeof TaiLieuToolbar>;
type TaiLieuStatsProps = React.ComponentProps<typeof TaiLieuStats>;

const TaiLieuPage = createFeatureModule<TaiLieu, TaiLieuFilters, TaiLieuTableProps, TaiLieuToolbarProps, TaiLieuStatsProps>({
  name: 'Tài liệu',

  tabs: [
    { id: 'list', label: txt('congViecTaiLieu.tabList'), icon: List },
    { id: 'stats', label: txt('congViecTaiLieu.tabStats'), icon: BarChart3 },
  ],

  urlTabs: { validTabs: ['list', 'stats'], defaultTab: 'list' },

  useData: () => {
    const result = useTaiLieu();
    return {
      data: result.data,
      isLoading: result.isLoading,
      total: result.total,
      isServerPaginated: true,
      mode: result.mode,
    };
  },

  useStore: useTaiLieuStore,
  keyExtractor: (item) => item.id,

  filterFn: () => true,
  skipClientSort: () => true,
  enableServerPaginationEffects: true,

  TableComponent: TaiLieuTable,
  ToolbarComponent: TaiLieuToolbar,
  FormComponent: TaiLieuForm,
  DetailComponent: TaiLieuDetail,
  StatsComponent: TaiLieuStats,

  lazyDrawers: DrawerLazyFallback,
  getFormKey: (editing) => editing?.id ?? 'new',
  trackFormOrigin: true,
  usePageHandlers: useTaiLieuPageHandlers,

  importColumns: [],
  exportColumns: [
    { key: 'id', label: 'ID' },
    { key: 'ten_ho_so', label: txt('congViecTaiLieu.field.tenHoSo') },
    { key: 'danh_muc', label: txt('congViecTaiLieu.field.danhMuc') },
    { key: 'tinh_trang', label: txt('congViecTaiLieu.field.tinhTrang') },
  ],
  exportMapFn: (item) => ({
    id: item.id,
    ten_ho_so: item.ten_ho_so,
    danh_muc: item.danh_muc,
    tinh_trang: item.tinh_trang,
  }),
  exportFileName: 'Danh_Sach_Tai_Lieu',
  importFileName: 'Mau_Import_Tai_Lieu',
});

export default TaiLieuPage;
