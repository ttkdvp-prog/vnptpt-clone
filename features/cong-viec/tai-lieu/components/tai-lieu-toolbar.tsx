import React, { useMemo } from 'react';
import { txt } from '@/lib/text';
import { Tag, Building2 } from 'lucide-react';
import { useResourcePermissions } from '@/hooks/use-resource-permissions';
import { useTaiLieuStore } from '../store/useTaiLieuStore';
import { useShallow } from 'zustand/react/shallow';
import GenericToolbar from '@/components/shared/GenericToolbar';
import FilterChipMultiSelect from '@/components/shared/FilterChipMultiSelect';
import ToolbarFilterChipGroup, {
  INLINE_CHIP_CLASS,
  MENU_CHIP_CLASS,
  type ToolbarFilterChipItem,
} from '@/components/shared/ToolbarFilterChipGroup';
import { ListToolbarAddButton } from '@/components/shared/ListToolbarActions';
import { TINH_TRANG_OPTIONS } from '../core/constants';
import { useTaiLieuFilterCounts } from '../hooks/use-filter-counts';
import { useTaiLieuDistinctDanhMuc, useTaiLieuDistinctTo } from '../hooks/use-tai-lieu';

interface Props {
  onAdd: () => void;
  onDeleteMany: (ids: string[]) => void;
}

const chipClass = (layout: 'inline' | 'menu', width?: string) =>
  layout === 'inline' ? (width ?? INLINE_CHIP_CLASS) : MENU_CHIP_CLASS;

const TaiLieuToolbar: React.FC<Props> = ({ onAdd, onDeleteMany }) => {
  const { canCreate, canDelete } = useResourcePermissions('tai-lieu');

  const {
    searchTerm, setSearchTerm, filters, setFilter,
    columns, toggleColumn, reorderColumns, resetColumns,
    density, setDensity, selectedIds, clearSelection,
  } = useTaiLieuStore(
    useShallow((s) => ({
      searchTerm: s.searchTerm,
      setSearchTerm: s.setSearchTerm,
      filters: s.filters,
      setFilter: s.setFilter,
      columns: s.columns,
      toggleColumn: s.toggleColumn,
      reorderColumns: s.reorderColumns,
      resetColumns: s.resetColumns,
      density: s.density,
      setDensity: s.setDensity,
      selectedIds: s.selectedIds,
      clearSelection: s.clearSelection,
    })),
  );

  const { tinhTrangCounts, danhMucCounts } = useTaiLieuFilterCounts(searchTerm, filters);
  const { data: danhMucList = [] } = useTaiLieuDistinctDanhMuc();
  const { data: toList = [] } = useTaiLieuDistinctTo();

  const tinhTrangOptions = useMemo(
    () => TINH_TRANG_OPTIONS.map((s) => ({ label: s.label, value: String(s.value), count: tinhTrangCounts[String(s.value)] || 0 })),
    [tinhTrangCounts],
  );
  const danhMucOptions = useMemo(
    () => danhMucList.map((d) => ({ label: d, value: d, count: danhMucCounts[d] || 0 })),
    [danhMucList, danhMucCounts],
  );
  const toOptions = useMemo(() => toList.map((t) => ({ label: t, value: t })), [toList]);

  const activeFilterCount = useMemo(
    () =>
      (searchTerm ? 1 : 0) +
      (filters.tinh_trang.length > 0 ? 1 : 0) +
      (filters.danh_muc.length > 0 ? 1 : 0) +
      (filters.to.length > 0 ? 1 : 0),
    [searchTerm, filters],
  );

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilter('tinh_trang', []);
    setFilter('danh_muc', []);
    setFilter('to', []);
  };

  const filterGroups = useMemo(
    () => [
      {
        key: 'tinh_trang',
        label: txt('congViecTaiLieu.toolbar.status'),
        icon: Tag,
        options: tinhTrangOptions,
        value: filters.tinh_trang,
        onChange: (val: string[]) => setFilter('tinh_trang', val),
      },
      {
        key: 'danh_muc',
        label: txt('congViecTaiLieu.toolbar.danhMuc'),
        icon: Tag,
        options: danhMucOptions,
        value: filters.danh_muc,
        onChange: (val: string[]) => setFilter('danh_muc', val),
      },
      {
        key: 'to',
        label: txt('congViecTaiLieu.toolbar.to'),
        icon: Building2,
        options: toOptions,
        value: filters.to,
        onChange: (val: string[]) => setFilter('to', val),
      },
    ],
    [tinhTrangOptions, danhMucOptions, toOptions, filters, setFilter],
  );

  const filterChipItems = useMemo<ToolbarFilterChipItem[]>(
    () => [
      {
        id: 'tinh_trang',
        active: filters.tinh_trang.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={tinhTrangOptions}
            value={filters.tinh_trang}
            onChange={(val) => setFilter('tinh_trang', val)}
            placeholder={txt('congViecTaiLieu.toolbar.status')}
            icon={Tag}
            className={chipClass(layout, 'w-[140px]')}
          />
        ),
      },
      {
        id: 'danh_muc',
        active: filters.danh_muc.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={danhMucOptions}
            value={filters.danh_muc}
            onChange={(val) => setFilter('danh_muc', val)}
            placeholder={txt('congViecTaiLieu.toolbar.danhMuc')}
            icon={Tag}
            className={chipClass(layout, 'w-[140px]')}
          />
        ),
      },
      {
        id: 'to',
        active: filters.to.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={toOptions}
            value={filters.to}
            onChange={(val) => setFilter('to', val)}
            placeholder={txt('congViecTaiLieu.toolbar.to')}
            icon={Building2}
            className={chipClass(layout, 'w-[140px]')}
          />
        ),
      },
    ],
    [tinhTrangOptions, danhMucOptions, toOptions, filters, setFilter],
  );

  const renderFilters = useMemo(() => <ToolbarFilterChipGroup items={filterChipItems} maxVisible={3} />, [filterChipItems]);

  const renderActions = canCreate ? <ListToolbarAddButton onClick={onAdd} /> : null;

  return (
    <GenericToolbar
      selectedCount={selectedIds.size}
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      onClearSelection={clearSelection}
      actions={renderActions}
      filters={renderFilters}
      filterGroups={filterGroups}
      onAdd={canCreate ? onAdd : undefined}
      onDeleteMany={canDelete ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      density={density}
      onSetDensity={setDensity}
      showBack
      activeFilterCount={activeFilterCount}
      onClearAllFilters={handleClearAllFilters}
    />
  );
};

export default TaiLieuToolbar;
