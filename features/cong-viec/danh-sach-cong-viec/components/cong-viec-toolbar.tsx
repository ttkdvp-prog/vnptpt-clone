import React, { useMemo } from 'react';
import { txt } from '@/lib/text';
import { Tag, Building2, User, Download, Upload } from 'lucide-react';
import { useResourcePermissions } from '@/hooks/use-resource-permissions';
import { useCongViecStore } from '../store/useCongViecStore';
import { useShallow } from 'zustand/react/shallow';
import GenericToolbar from '@/components/shared/GenericToolbar';
import FilterChipMultiSelect from '@/components/shared/FilterChipMultiSelect';
import ToolbarFilterChipGroup, {
  INLINE_CHIP_CLASS,
  MENU_CHIP_CLASS,
  type ToolbarFilterChipItem,
} from '@/components/shared/ToolbarFilterChipGroup';
import { ListToolbarAddButton, ListToolbarIconButton } from '@/components/shared/ListToolbarActions';
import { TRANG_THAI_OPTIONS } from '../core/constants';
import { useCongViecDistinctTo } from '../hooks/use-cong-viec';
import { useEmployeeOptions } from '../hooks/use-employee-options';

interface Props {
  onAdd: () => void;
  onExport: () => void;
  onImport: () => void;
  onDeleteMany: (ids: string[]) => void;
}

const chipClass = (layout: 'inline' | 'menu', width?: string) =>
  layout === 'inline' ? (width ?? INLINE_CHIP_CLASS) : MENU_CHIP_CLASS;

const CongViecToolbar: React.FC<Props> = ({ onAdd, onExport, onImport, onDeleteMany }) => {
  const { canCreate, canDelete, canExport, canImport } = useResourcePermissions('cong-viec');

  const {
    searchTerm, setSearchTerm, filters, setFilter,
    columns, toggleColumn, reorderColumns, resetColumns,
    density, setDensity, selectedIds, clearSelection,
  } = useCongViecStore(
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

  const { data: toList = [] } = useCongViecDistinctTo();
  const employeeOptions = useEmployeeOptions();

  const toArOptions = useMemo(() => toList.map((t) => ({ label: t, value: t })), [toList]);
  const trangThaiOptions = useMemo(() => TRANG_THAI_OPTIONS.map((s) => ({ label: s.label, value: String(s.value) })), []);

  const activeFilterCount = useMemo(
    () =>
      (searchTerm ? 1 : 0) +
      (filters.to_ar.length > 0 ? 1 : 0) +
      (filters.to_r.length > 0 ? 1 : 0) +
      (filters.mnv_a.length > 0 ? 1 : 0) +
      (filters.mnv_r.length > 0 ? 1 : 0) +
      (filters.mnv_c.length > 0 ? 1 : 0) +
      (filters.trang_thai.length > 0 ? 1 : 0),
    [searchTerm, filters],
  );

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilter('to_ar', []);
    setFilter('to_r', []);
    setFilter('mnv_a', []);
    setFilter('mnv_r', []);
    setFilter('mnv_c', []);
    setFilter('trang_thai', []);
  };

  const filterGroups = useMemo(
    () => [
      {
        key: 'to_ar',
        label: txt('congViec.toolbar.toAr'),
        icon: Building2,
        options: toArOptions,
        value: filters.to_ar,
        onChange: (val: string[]) => setFilter('to_ar', val),
      },
      {
        key: 'to_r',
        label: txt('congViec.toolbar.toR'),
        icon: Building2,
        options: toArOptions,
        value: filters.to_r,
        onChange: (val: string[]) => setFilter('to_r', val),
      },
      {
        key: 'mnv_a',
        label: txt('congViec.toolbar.mnvA'),
        icon: User,
        options: employeeOptions,
        value: filters.mnv_a,
        onChange: (val: string[]) => setFilter('mnv_a', val),
      },
      {
        key: 'mnv_r',
        label: txt('congViec.toolbar.mnvR'),
        icon: User,
        options: employeeOptions,
        value: filters.mnv_r,
        onChange: (val: string[]) => setFilter('mnv_r', val),
      },
      {
        key: 'mnv_c',
        label: txt('congViec.toolbar.mnvC'),
        icon: User,
        options: employeeOptions,
        value: filters.mnv_c,
        onChange: (val: string[]) => setFilter('mnv_c', val),
      },
      {
        key: 'trang_thai',
        label: txt('congViec.toolbar.trangThai'),
        icon: Tag,
        options: trangThaiOptions,
        value: filters.trang_thai,
        onChange: (val: string[]) => setFilter('trang_thai', val),
      },
    ],
    [toArOptions, trangThaiOptions, employeeOptions, filters, setFilter],
  );

  const filterChipItems = useMemo<ToolbarFilterChipItem[]>(
    () => [
      {
        id: 'to_ar',
        active: filters.to_ar.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={toArOptions}
            value={filters.to_ar}
            onChange={(val) => setFilter('to_ar', val)}
            placeholder={txt('congViec.toolbar.toAr')}
            icon={Building2}
            className={chipClass(layout, 'w-[140px]')}
          />
        ),
      },
      {
        id: 'to_r',
        active: filters.to_r.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={toArOptions}
            value={filters.to_r}
            onChange={(val) => setFilter('to_r', val)}
            placeholder={txt('congViec.toolbar.toR')}
            icon={Building2}
            className={chipClass(layout, 'w-[140px]')}
          />
        ),
      },
      {
        id: 'mnv_a',
        active: filters.mnv_a.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={employeeOptions}
            value={filters.mnv_a}
            onChange={(val) => setFilter('mnv_a', val)}
            placeholder={txt('congViec.toolbar.mnvA')}
            icon={User}
            className={chipClass(layout, 'w-[150px]')}
          />
        ),
      },
      {
        id: 'mnv_r',
        active: filters.mnv_r.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={employeeOptions}
            value={filters.mnv_r}
            onChange={(val) => setFilter('mnv_r', val)}
            placeholder={txt('congViec.toolbar.mnvR')}
            icon={User}
            className={chipClass(layout, 'w-[140px]')}
          />
        ),
      },
      {
        id: 'mnv_c',
        active: filters.mnv_c.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={employeeOptions}
            value={filters.mnv_c}
            onChange={(val) => setFilter('mnv_c', val)}
            placeholder={txt('congViec.toolbar.mnvC')}
            icon={User}
            className={chipClass(layout, 'w-[140px]')}
          />
        ),
      },
      {
        id: 'trang_thai',
        active: filters.trang_thai.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={trangThaiOptions}
            value={filters.trang_thai}
            onChange={(val) => setFilter('trang_thai', val)}
            placeholder={txt('congViec.toolbar.trangThai')}
            icon={Tag}
            className={chipClass(layout, 'w-[140px]')}
          />
        ),
      },
    ],
    [toArOptions, trangThaiOptions, employeeOptions, filters, setFilter],
  );

  const renderFilters = useMemo(() => <ToolbarFilterChipGroup items={filterChipItems} maxVisible={4} />, [filterChipItems]);

  const renderActions = (
    <>
      {canImport && (
        <ListToolbarIconButton icon={Upload} tooltip={txt('congViec.toolbar.importData')} onClick={onImport} />
      )}
      {canExport && (
        <ListToolbarIconButton icon={Download} tooltip={txt('congViec.toolbar.exportData')} onClick={onExport} />
      )}
      {canCreate && <ListToolbarAddButton onClick={onAdd} />}
    </>
  );

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

export default CongViecToolbar;
