import { useCallback, useMemo } from 'react';
import { Activity, Building2, Download, FileType2, Upload, UserRound, Users } from 'lucide-react';
import { txt } from '@/lib/text';
import { getLanguage } from '@/lib/utils';
import { matchesSearchTerm } from '@/lib/searchUtils';
import { isAllStatsDateRange } from '@/lib/stats-date-range';
import GenericToolbar from '@/components/shared/GenericToolbar';
import FilterChipMultiSelect from '@/components/shared/FilterChipMultiSelect';
import ToolbarFilterChipGroup, {
  INLINE_CHIP_CLASS,
  MENU_CHIP_CLASS,
  type ToolbarFilterChipItem,
} from '@/components/shared/ToolbarFilterChipGroup';
import {
  ListToolbarAddButton,
  ListToolbarIconButton,
} from '@/components/shared/ListToolbarActions';
import DateRangePicker from '@/components/ui/DateRangePicker';
import { useResourcePermissions } from '@/hooks/use-resource-permissions';
import { useDepartments } from '@/features/he-thong/phong-ban/hooks/use-phong-ban';
import { getDateRangeFromPreset } from '@/features/he-thong/nhan-vien/utils/stats-date-range';
import {
  DATE_RANGE_PRESETS,
  type DateRangePresetId,
} from '@/features/hanh-chinh/thong-ke-phieu-hanh-chinh/core/stats-constants';
import { useShallow } from 'zustand/react/shallow';
import { useSavedViewsController } from '@/hooks/use-saved-views-controller';
import type { PhieuHanhChinh } from '../core/types';
import { PHIEU_HANH_CHINH_STATUS_LABELS } from '../core/types';
import { usePhieuHanhChinhStore } from '../store/usePhieuHanhChinhStore';
import { usePhieuHanhChinh } from '../hooks/use-phieu-hanh-chinh';
import { PHIEU_HANH_CHINH_SEARCHABLE_KEYS } from '../utils/search-keys';

interface Props {
  onAdd: () => void;
  onExport: () => void;
  onImport: () => void;
  onDeleteMany: (ids: string[]) => void;
}

const chipClass = (layout: 'inline' | 'menu', width?: string) =>
  layout === 'inline' ? (width ?? INLINE_CHIP_CLASS) : MENU_CHIP_CLASS;

interface ChipOption {
  value: string;
  label: string;
  count: number;
}

const PhieuHanhChinhToolbar: React.FC<Props> = ({
  onAdd,
  onExport,
  onImport,
  onDeleteMany,
}) => {
  const { canCreate, canImport, canExport, canDelete } =
    useResourcePermissions('adminForms');
  const { data: items = [] } = usePhieuHanhChinh();
  const { data: departments = [] } = useDepartments();

  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
    resetFilters,
    columns,
    toggleColumn,
    reorderColumns,
    resetColumns,
    density,
    setDensity,
    sort,
    applyView,
    selectedIds,
    clearSelection,
  } = usePhieuHanhChinhStore(
    useShallow((s) => ({
      searchTerm: s.searchTerm,
      setSearchTerm: s.setSearchTerm,
      filters: s.filters,
      setFilter: s.setFilter,
      resetFilters: s.resetFilters,
      columns: s.columns,
      toggleColumn: s.toggleColumn,
      reorderColumns: s.reorderColumns,
      resetColumns: s.resetColumns,
      density: s.density,
      setDensity: s.setDensity,
      sort: s.sort,
      applyView: s.applyView,
      selectedIds: s.selectedIds,
      clearSelection: s.clearSelection,
    })),
  );

  const { views, activeViewId, onApplyView, onSaveView, onDeleteView } = useSavedViewsController({
    storageKey: 'table-phieu-hanh-chinh',
    filters, sort, columns, density, searchTerm, applyView,
  });

  const selectedCount = selectedIds.size;

  const dateRange = useMemo(
    () =>
      getDateRangeFromPreset(
        filters.date_preset as DateRangePresetId,
        filters.date_custom_start ? new Date(filters.date_custom_start) : undefined,
        filters.date_custom_end ? new Date(filters.date_custom_end) : undefined,
      ),
    [filters.date_preset, filters.date_custom_start, filters.date_custom_end],
  );

  const dateRangeValue = useMemo(
    () => ({
      preset: filters.date_preset,
      customStart: filters.date_custom_start,
      customEnd: filters.date_custom_end,
    }),
    [filters.date_preset, filters.date_custom_start, filters.date_custom_end],
  );

  const handleDateRangeChange = useCallback(
    (v: { preset: string; customStart: string; customEnd: string }) => {
      setFilter('date_preset', v.preset);
      setFilter('date_custom_start', v.customStart);
      setFilter('date_custom_end', v.customEnd);
    },
    [setFilter],
  );

  const dateRangePicker = useCallback(
    (className?: string) => (
      <DateRangePicker
        presets={DATE_RANGE_PRESETS.map((p) => ({ id: p.id, label: p.label }))}
        value={dateRangeValue}
        onChange={handleDateRangeChange}
        displayLabel={
          isAllStatsDateRange(filters.date_preset) ? undefined : dateRange.label
        }
        placeholder={txt('adminForm.filterDateRange')}
        className={className}
      />
    ),
    [dateRange.label, dateRangeValue, filters.date_preset, handleDateRangeChange],
  );

  const buildOptions = useCallback(
    (
      getValue: (item: PhieuHanhChinh) => string | null | undefined,
      getLabel: (item: PhieuHanhChinh) => string | null | undefined,
    ): ChipOption[] => {
      const counts = new Map<string, number>();
      const labels = new Map<string, string>();
      for (const item of items) {
        if (
          !matchesSearchTerm(
            item as unknown as Record<string, unknown>,
            searchTerm,
            [...PHIEU_HANH_CHINH_SEARCHABLE_KEYS],
          )
        ) {
          continue;
        }
        const value = getValue(item);
        if (!value) continue;
        counts.set(value, (counts.get(value) ?? 0) + 1);
        if (!labels.has(value)) {
          labels.set(value, getLabel(item)?.trim() || value);
        }
      }
      return [...counts.entries()]
        .map(([value, count]) => ({ value, label: labels.get(value) ?? value, count }))
        .sort((a, b) => a.label.localeCompare(b.label, getLanguage()));
    },
    [items, searchTerm],
  );

  const typeOptions = useMemo(
    () => buildOptions((i) => i.ma_phieu, (i) => i.ten_loai_phieu),
    [buildOptions],
  );
  const statusOptions = useMemo(
    () =>
      buildOptions(
        (i) => i.trang_thai,
        (i) =>
          PHIEU_HANH_CHINH_STATUS_LABELS[
            i.trang_thai as keyof typeof PHIEU_HANH_CHINH_STATUS_LABELS
          ] ?? i.trang_thai,
      ),
    [buildOptions],
  );
  const employeeOptions = useMemo(
    () => buildOptions((i) => i.id_nhan_vien, (i) => i.ten_nhan_vien),
    [buildOptions],
  );
  /** Options từ var_phong_ban; count theo phòng ban của NV trên phiếu (var_nhan_vien). */
  const departmentOptions = useMemo((): ChipOption[] => {
    const counts = new Map<string, number>();
    for (const item of items) {
      if (
        !matchesSearchTerm(
          item as unknown as Record<string, unknown>,
          searchTerm,
          [...PHIEU_HANH_CHINH_SEARCHABLE_KEYS],
        )
      ) {
        continue;
      }
      const deptId = item.id_phong_ban;
      if (!deptId) continue;
      counts.set(deptId, (counts.get(deptId) ?? 0) + 1);
    }
    return departments
      .map((d) => ({
        value: d.id,
        label: d.ten_phong_ban,
        count: counts.get(d.id) ?? 0,
      }))
      .sort((a, b) => a.label.localeCompare(b.label, getLanguage()));
  }, [departments, items, searchTerm]);
  const creatorOptions = useMemo(
    () => buildOptions((i) => i.nguoi_tao, (i) => i.ten_nguoi_tao),
    [buildOptions],
  );

  const activeFilterCount = useMemo(
    () =>
      (searchTerm.trim() ? 1 : 0) +
      (filters.ma_phieu.length > 0 ? 1 : 0) +
      (filters.trang_thai.length > 0 ? 1 : 0) +
      (filters.id_nhan_vien.length > 0 ? 1 : 0) +
      (filters.id_phong_ban.length > 0 ? 1 : 0) +
      (filters.nguoi_tao.length > 0 ? 1 : 0) +
      (isAllStatsDateRange(filters.date_preset) ? 0 : 1),
    [
      searchTerm,
      filters.ma_phieu.length,
      filters.trang_thai.length,
      filters.id_nhan_vien.length,
      filters.id_phong_ban.length,
      filters.nguoi_tao.length,
      filters.date_preset,
    ],
  );

  const filterGroups = useMemo(
    () => [
      {
        key: 'ma_phieu',
        label: txt('adminForm.filterType'),
        icon: FileType2,
        options: typeOptions,
        value: filters.ma_phieu,
        onChange: (val: string[]) => setFilter('ma_phieu', val),
      },
      {
        key: 'trang_thai',
        label: txt('adminForm.filterStatus'),
        icon: Activity,
        options: statusOptions,
        value: filters.trang_thai,
        onChange: (val: string[]) => setFilter('trang_thai', val),
      },
      {
        key: 'id_phong_ban',
        label: txt('adminForm.filterDepartment'),
        icon: Building2,
        options: departmentOptions,
        value: filters.id_phong_ban,
        onChange: (val: string[]) => setFilter('id_phong_ban', val),
      },
      {
        key: 'id_nhan_vien',
        label: txt('adminForm.filterEmployee'),
        icon: Users,
        options: employeeOptions,
        value: filters.id_nhan_vien,
        onChange: (val: string[]) => setFilter('id_nhan_vien', val),
      },
      {
        key: 'nguoi_tao',
        label: txt('adminForm.filterCreator'),
        icon: UserRound,
        options: creatorOptions,
        value: filters.nguoi_tao,
        onChange: (val: string[]) => setFilter('nguoi_tao', val),
      },
    ],
    [
      typeOptions,
      statusOptions,
      departmentOptions,
      employeeOptions,
      creatorOptions,
      filters.ma_phieu,
      filters.trang_thai,
      filters.id_phong_ban,
      filters.id_nhan_vien,
      filters.nguoi_tao,
      setFilter,
    ],
  );

  const filterChipItems = useMemo<ToolbarFilterChipItem[]>(
    () => [
      {
        id: 'date_range',
        active: !isAllStatsDateRange(filters.date_preset),
        renderChip: (layout) =>
          dateRangePicker(chipClass(layout, 'w-[168px]')),
      },
      {
        id: 'ma_phieu',
        active: filters.ma_phieu.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={typeOptions}
            value={filters.ma_phieu}
            onChange={(val) => setFilter('ma_phieu', val)}
            placeholder={txt('adminForm.filterType')}
            icon={FileType2}
            className={chipClass(layout, 'w-[148px]')}
          />
        ),
      },
      {
        id: 'trang_thai',
        active: filters.trang_thai.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={statusOptions}
            value={filters.trang_thai}
            onChange={(val) => setFilter('trang_thai', val)}
            placeholder={txt('adminForm.filterStatus')}
            icon={Activity}
            className={chipClass(layout, 'w-[148px]')}
          />
        ),
      },
      {
        id: 'id_phong_ban',
        active: filters.id_phong_ban.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={departmentOptions}
            value={filters.id_phong_ban}
            onChange={(val) => setFilter('id_phong_ban', val)}
            placeholder={txt('adminForm.filterDepartment')}
            icon={Building2}
            className={chipClass(layout, 'w-[148px]')}
          />
        ),
      },
      {
        id: 'id_nhan_vien',
        active: filters.id_nhan_vien.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={employeeOptions}
            value={filters.id_nhan_vien}
            onChange={(val) => setFilter('id_nhan_vien', val)}
            placeholder={txt('adminForm.filterEmployee')}
            icon={Users}
            className={chipClass(layout, 'w-[136px]')}
          />
        ),
      },
      {
        id: 'nguoi_tao',
        active: filters.nguoi_tao.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={creatorOptions}
            value={filters.nguoi_tao}
            onChange={(val) => setFilter('nguoi_tao', val)}
            placeholder={txt('adminForm.filterCreator')}
            icon={UserRound}
            className={chipClass(layout, 'w-[148px]')}
          />
        ),
      },
    ],
    [
      dateRangePicker,
      typeOptions,
      statusOptions,
      departmentOptions,
      employeeOptions,
      creatorOptions,
      filters.date_preset,
      filters.ma_phieu,
      filters.trang_thai,
      filters.id_phong_ban,
      filters.id_nhan_vien,
      filters.nguoi_tao,
      setFilter,
    ],
  );

  const renderFilters = useMemo(
    () => <ToolbarFilterChipGroup items={filterChipItems} maxVisible={4} />,
    [filterChipItems],
  );

  const mobileActions = useMemo(
    () => [
      ...(canImport
        ? [{ key: 'import', label: txt('common.import'), icon: Upload, onClick: onImport, description: '' }]
        : []),
      ...(canExport
        ? [{ key: 'export', label: txt('common.export'), icon: Download, onClick: onExport, description: '' }]
        : []),
    ],
    [onImport, onExport, canImport, canExport],
  );

  return (
    <GenericToolbar
      searchTerm={searchTerm}
      onSearchChange={setSearchTerm}
      searchPlaceholder={txt('common.searchPlaceholder')}
      searchTrailing={
        <div className="sm:hidden shrink-0">{dateRangePicker('w-[148px]')}</div>
      }
      columns={columns}
      onToggleColumn={toggleColumn}
      onReorderColumns={reorderColumns}
      onResetColumns={resetColumns}
      density={density}
      onSetDensity={setDensity}
      savedViews={views}
      activeViewId={activeViewId}
      onApplyView={onApplyView}
      onSaveView={onSaveView}
      onDeleteView={onDeleteView}
      activeFilterCount={activeFilterCount}
      onClearAllFilters={() => {
        setSearchTerm('');
        resetFilters();
      }}
      selectedCount={selectedCount}
      onClearSelection={clearSelection}
      onDeleteMany={
        canDelete && selectedCount > 0 ? () => onDeleteMany([...selectedIds]) : undefined
      }
      showBack
      filters={renderFilters}
      filterGroups={filterGroups}
      mobileActions={mobileActions}
      onAdd={canCreate ? onAdd : undefined}
      actions={
        <>
          {canImport && (
            <ListToolbarIconButton
              icon={Upload}
              tooltip={txt('common.import')}
              onClick={onImport}
            />
          )}
          {canExport && (
            <ListToolbarIconButton
              icon={Download}
              tooltip={txt('common.export')}
              onClick={onExport}
            />
          )}
          {canCreate && <ListToolbarAddButton onClick={onAdd} />}
        </>
      }
    />
  );
};

export default PhieuHanhChinhToolbar;
