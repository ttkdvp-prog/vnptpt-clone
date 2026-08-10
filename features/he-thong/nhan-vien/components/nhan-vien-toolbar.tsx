
import React, { useMemo, useState } from 'react';
import { txt } from '@/lib/text';
import { Download, Upload, Tag, Pencil, KeyRound } from 'lucide-react';
import Tooltip from '@/components/ui/Tooltip';
import { useResourcePermissions } from '@/hooks/use-resource-permissions';
import { useAuthStore } from '@/store/useStore';
import BulkStatusMenu from '@/components/shared/BulkStatusMenu';
import NhanVienBulkPasswordDialog from './nhan-vien-bulk-password-dialog';
import { useEmployeeStore } from '../store/useEmployeeStore';
import { useShallow } from 'zustand/react/shallow';
import { useSavedViewsController } from '@/hooks/use-saved-views-controller';
import GenericToolbar from '@/components/shared/GenericToolbar';
import TablePrintView from '@/components/shared/TablePrintView';
import { getEmployeeCellText } from '../utils/get-employee-cell-text';
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
import { STATUS_OPTIONS, type TrangThaiNhanVien } from '../core/constants';
import { useFilterCounts } from '../hooks/use-filter-counts';
import type { Employee } from '../core/types';
import { countColumnSearchActive } from '../utils/column-search';

interface Props {
  /** Danh sách nhân viên người dùng được phép xem (sau phân quyền). Count trong filter chip đếm trên chính list này. */
  employees: Employee[];
  onAdd: () => void;
  onExport: () => void;
  onImport: () => void;
  onDeleteMany: (ids: string[]) => void;
  onStatusChangeMany: (ids: string[], status: TrangThaiNhanVien) => void;
  onBulkEdit?: () => void;
}

const chipClass = (layout: 'inline' | 'menu', width?: string) =>
  layout === 'inline' ? (width ?? INLINE_CHIP_CLASS) : MENU_CHIP_CLASS;

const EmployeeToolbar: React.FC<Props> = ({
    employees, onAdd, onExport, onImport, onDeleteMany, onStatusChangeMany, onBulkEdit,
}) => {
  const { canCreate, canImport, canExport, canEdit, canDelete } = useResourcePermissions('employees');
  const currentUser = useAuthStore((state) => state.user);
  /** Cùng cổng quyền với nút Đổi mật khẩu ở drawer chi tiết (`nhan-vien-detail.tsx`). */
  const canResetPassword = currentUser?.role === 'admin';
  const [bulkPasswordOpen, setBulkPasswordOpen] = useState(false);
  const [printOpen, setPrintOpen] = useState(false);

  const {
    searchTerm,
    setSearchTerm,
    filters,
    setFilter,
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
  } = useEmployeeStore(
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
      sort: s.sort,
      applyView: s.applyView,
      selectedIds: s.selectedIds,
      clearSelection: s.clearSelection,
    })),
  );

  const { views, activeViewId, onApplyView, onSaveView, onDeleteView } = useSavedViewsController({
    storageKey: 'table-nhan-vien',
    filters, sort, columns, density, searchTerm, applyView,
  });

  const { statusCounts } = useFilterCounts(employees, searchTerm, filters);

  const statusOptions = useMemo(
    () => STATUS_OPTIONS.map(s => ({ label: s.label, value: String(s.value), count: statusCounts[String(s.value)] || 0 })),
    [statusCounts]
  );

  const activeFilterCount = useMemo(() => {
    const columnSearchN = countColumnSearchActive(filters.columnSearch);
    return (searchTerm ? 1 : 0)
      + columnSearchN
      + (filters.trang_thai.length > 0 ? 1 : 0);
  }, [searchTerm, filters]);

  const handleClearAllFilters = () => {
    setSearchTerm('');
    setFilter('columnSearch', {});
    setFilter('trang_thai', []);
  };

  const filterGroups = useMemo(() => [
    {
      key: 'trang_thai',
      label: txt('employee.toolbar.status'),
      icon: Tag,
      options: statusOptions,
      value: filters.trang_thai,
      onChange: (val: string[]) => setFilter('trang_thai', val),
    },
  ], [statusOptions, filters, setFilter]);

  /** Trạng thái đích cho dropdown "Đổi trạng thái" — đủ 4 giá trị, khớp bulk edit và dialog dòng. */
  const bulkStatusMenuOptions = useMemo(
    () => STATUS_OPTIONS.map((s) => ({ value: String(s.value), label: s.label })),
    [],
  );

  /**
   * Nút bulk phải nằm trong `bulkActions` — `GenericToolbar` chỉ render `actions`
   * và nút mở MobileActionsSheet ở nhánh **không có selection**, nên nút bulk đặt
   * ở đó sẽ không bao giờ hiện. `bulkActions` được render ở cả hàng bulk desktop
   * và hàng bulk mobile.
   */
  const bulkActionsNode = useMemo(
    () => (
      <>
        {onBulkEdit && canEdit && (
          <Tooltip content={txt('employee.toolbar.bulkEdit')} placement="bottom">
            <button
              type="button"
              onClick={onBulkEdit}
              className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 h-8 w-8 sm:w-auto sm:px-3 flex items-center justify-center sm:gap-1.5 text-primary bg-primary/5 rounded-lg border border-primary/30 active:scale-95 sm:hover:bg-primary/10 sm:transition-all"
              aria-label={txt('employee.toolbar.bulkEdit')}
            >
              <Pencil className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline text-xs font-medium">
                {txt('employee.toolbar.editCount', { count: selectedIds.size })}
              </span>
            </button>
          </Tooltip>
        )}
        {canResetPassword && (
          <Tooltip content={txt('employee.bulkPassword.title')} placement="bottom">
            <button
              type="button"
              onClick={() => setBulkPasswordOpen(true)}
              className="min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 h-8 w-8 sm:w-auto sm:px-3 flex items-center justify-center sm:gap-1.5 text-muted-foreground bg-muted/50 rounded-lg border border-border active:scale-95 sm:hover:bg-muted sm:transition-all"
              aria-label={txt('employee.bulkPassword.title')}
            >
              <KeyRound size={14} className="stroke-[2.5px] shrink-0" />
              <span className="hidden sm:inline text-xs font-medium">
                {txt('employee.detail.changePassword')}
              </span>
            </button>
          </Tooltip>
        )}
        {canEdit && (
          <BulkStatusMenu
            options={bulkStatusMenuOptions}
            onSelect={(value) =>
              onStatusChangeMany(Array.from(selectedIds), value as TrangThaiNhanVien)
            }
          />
        )}
      </>
    ),
    [onStatusChangeMany, selectedIds, onBulkEdit, canEdit, canResetPassword, bulkStatusMenuOptions],
  );

  const mobileActions = useMemo(() => [
    ...(canImport ? [{
      key: 'import',
      label: txt('employee.toolbar.importData'),
      icon: Upload,
      onClick: onImport,
      description: txt('employee.toolbar.importDesc'),
    }] : []),
    ...(canExport ? [{
      key: 'export',
      label: txt('employee.toolbar.exportData'),
      icon: Download,
      onClick: onExport,
      description: txt('employee.toolbar.exportDesc'),
    }] : []),
  ], [onImport, onExport, canImport, canExport]);

  const filterChipItems = useMemo<ToolbarFilterChipItem[]>(
    () => [
      {
        id: 'trang_thai',
        active: filters.trang_thai.length > 0,
        renderChip: (layout) => (
          <FilterChipMultiSelect
            options={statusOptions}
            value={filters.trang_thai}
            onChange={(val) => setFilter('trang_thai', val)}
            placeholder={txt('employee.toolbar.status')}
            icon={Tag}
            className={chipClass(layout, 'w-[132px]')}
          />
        ),
      },
    ],
    [statusOptions, filters.trang_thai, setFilter],
  );

  const renderFilters = useMemo(
    () => <ToolbarFilterChipGroup items={filterChipItems} maxVisible={3} />,
    [filterChipItems],
  );

  const renderActions = (
    <>
        {canImport && (
          <ListToolbarIconButton
            icon={Upload}
            tooltip={txt('employee.toolbar.importData')}
            onClick={onImport}
          />
        )}
        {canExport && (
          <ListToolbarIconButton
            icon={Download}
            tooltip={txt('employee.toolbar.exportData')}
            onClick={onExport}
          />
        )}
        {canCreate && <ListToolbarAddButton onClick={onAdd} />}
    </>
  );

  const selectedEmployees = useMemo(
    () => employees.filter((emp) => selectedIds.has(emp.id)),
    [employees, selectedIds],
  );

  return (
    <>
    <GenericToolbar
        selectedCount={selectedIds.size}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onClearSelection={clearSelection}
        actions={renderActions}
        filters={renderFilters}
        filterGroups={filterGroups}
        mobileActions={mobileActions}
        onAdd={canCreate ? onAdd : undefined}
        onDeleteMany={canDelete ? () => onDeleteMany(Array.from(selectedIds)) : undefined}
        bulkActions={canEdit || canResetPassword ? bulkActionsNode : undefined}
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
        onPrint={() => setPrintOpen(true)}
        showBack
        activeFilterCount={activeFilterCount}
        onClearAllFilters={handleClearAllFilters}
    />
    {canResetPassword && bulkPasswordOpen && (
      <NhanVienBulkPasswordDialog
        open={bulkPasswordOpen}
        onClose={() => setBulkPasswordOpen(false)}
        selectedEmployees={selectedEmployees}
        selectedIds={Array.from(selectedIds)}
        onSuccess={clearSelection}
      />
    )}
    {printOpen && (
      <TablePrintView
        title="Danh sách nhân viên"
        columns={columns}
        data={employees}
        getCellText={getEmployeeCellText}
        keyExtractor={(item) => item.id}
        onClose={() => setPrintOpen(false)}
      />
    )}
    </>
  );
};

export default EmployeeToolbar;
