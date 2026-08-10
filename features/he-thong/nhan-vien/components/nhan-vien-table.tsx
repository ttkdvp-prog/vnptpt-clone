import React, { memo, useCallback, useMemo, useState } from 'react';
import { txt } from '@/lib/text';
import { Employee } from '../core/types';
import { useEmployeeStore } from '../store/useEmployeeStore';
import { useShallow } from 'zustand/react/shallow';
import type { ColumnConfig } from '@/store/createGenericStore';
import { cn, getAvatarUrl } from '@/lib/utils';
import GenericTable from '@/components/shared/GenericTable';
import { MobileListCard } from '@/components/shared/MobileListCard';
import EnumBadge from '@/components/ui/EnumBadge';
import { useFilterCounts } from '../hooks/use-filter-counts';
import { STATUS_OPTIONS, STATUS_BADGE_CONFIG } from '../core/constants';
import { ColumnHeaderFilter } from '@/components/shared/column-header/ColumnHeaderFilter';
import { ColumnHeaderSortMenu } from '@/components/shared/column-header/ColumnHeaderSortMenu';
import { ColumnHeaderSearch } from '@/components/shared/column-header/ColumnHeaderSearch';
import { EmployeeTableRowActions } from './employee-table-row-actions';
import { getEmployeeCellText } from '../utils/get-employee-cell-text';

interface Props {
    data: Employee[];
    isLoading: boolean;
    /** Danh sách gốc (sau phân quyền) để đếm filter — giống toolbar. */
    employeesForFilterCounts: Employee[];
    totalRecordCount?: number;
    serverPaginated?: boolean;
    onEdit: (item: Employee) => void;
    onDelete: (id: string) => void;
    onStatusChange: (item: Employee) => void;
    onView: (item: Employee) => void;
    onDuplicate?: (item: Employee) => void;
}

const EmployeeTable = memo(function EmployeeTable({
  data,
  isLoading,
  employeesForFilterCounts,
  totalRecordCount,
  serverPaginated = false,
  onEdit,
  onDelete,
  onStatusChange,
  onView,
  onDuplicate,
}: Props) {
    const [rowMenuOpenId, setRowMenuOpenId] = useState<string | null>(null);
    const {
        columns, pagination, setPage, setPageSize,
        selectedIds, toggleSelection, toggleAllSelection,
        sort, setSort, resizeColumn, density,
        searchTerm, filters, setFilter,
    } = useEmployeeStore(
      useShallow((s) => ({
        columns: s.columns,
        pagination: s.pagination,
        setPage: s.setPage,
        setPageSize: s.setPageSize,
        selectedIds: s.selectedIds,
        toggleSelection: s.toggleSelection,
        toggleAllSelection: s.toggleAllSelection,
        sort: s.sort,
        setSort: s.setSort,
        resizeColumn: s.resizeColumn,
        density: s.density,
        searchTerm: s.searchTerm,
        filters: s.filters,
        setFilter: s.setFilter,
      })),
    );

    const { statusCounts } = useFilterCounts(
      employeesForFilterCounts,
      searchTerm,
      filters,
    );

    const statusOptions = useMemo(
      () => STATUS_OPTIONS.map((s) => ({
        label: s.label,
        value: String(s.value),
        count: statusCounts[String(s.value)] || 0,
      })),
      [statusCounts],
    );

    const renderColumnHeaderAccessory = useCallback(
      (col: ColumnConfig) => {
        const cs = filters.columnSearch;
        const colSearchActive = Boolean(cs[col.id]?.trim());
        const columnSearchEl = (
          <ColumnHeaderSearch
            variant="inDropdown"
            value={cs[col.id] ?? ''}
            onChange={(v) =>
              setFilter('columnSearch', {
                ...cs,
                [col.id]: v,
              })
            }
            ariaLabel={`${col.label} — ${txt('common.search')}`}
          />
        );

        switch (col.id) {
          case 'trang_thai':
            return (
              <ColumnHeaderFilter
                options={statusOptions}
                value={filters.trang_thai}
                onChange={(v) => setFilter('trang_thai', v)}
                ariaLabel={txt('employee.toolbar.status')}
                sortColumnId="trang_thai"
                sort={sort}
                setSort={setSort}
              />
            );
          default:
            return (
              <ColumnHeaderSortMenu
                ariaLabel={col.label}
                sortColumnId={col.id}
                sort={sort}
                setSort={setSort}
                columnSearch={columnSearchEl}
                columnSearchActive={colSearchActive}
              />
            );
        }
      },
      [statusOptions, filters, setFilter, sort, setSort],
    );

    const renderCell = useCallback((colId: string, item: Employee) => {
        switch (colId) {
            case 'ho_ten':
                return (
                    <div className="flex items-center gap-2.5 min-w-0">
                        <img src={item.anh_dai_dien || getAvatarUrl(item.ho_ten ?? '')} className="w-8 h-8 rounded-full border border-border shadow-sm object-cover shrink-0" alt={item.ho_ten} />
                        <span className="font-semibold text-foreground text-body-sm truncate">{item.ho_ten}</span>
                    </div>
                );
            case 'trang_thai':
                return <EnumBadge value={item.trang_thai} config={STATUS_BADGE_CONFIG} truncate />;
            case 'chuc_danh':
                return <span className="truncate text-body-sm">{item.chuc_danh || '—'}</span>;
            case 'to_phong':
                return <span className="truncate text-body-sm">{item.to_phong || '—'}</span>;
            case 'actions':
                return (
                    <EmployeeTableRowActions
                      item={item}
                      menuOpenId={rowMenuOpenId}
                      onMenuOpenChange={setRowMenuOpenId}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onStatusChange={onStatusChange}
                      onDuplicate={onDuplicate}
                    />
                );
            default:
                return null;
        }
    }, [onEdit, onDelete, onStatusChange, onDuplicate, rowMenuOpenId]);

    const renderMobileCard = useCallback((item: Employee, isSelected: boolean) => (
        <MobileListCard
          selected={isSelected}
          onBodyClick={() => onView(item)}
          onBodyKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onView(item);
            }
          }}
          leading={(
            <div className="relative shrink-0">
              <img
                src={item.anh_dai_dien || getAvatarUrl(item.ho_ten ?? '')}
                className="h-14 w-14 rounded-xl border border-border object-cover shadow-sm"
                alt={item.ho_ten}
              />
              <div
                className={cn(
                  'absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-card',
                  item.trang_thai === 'Đang làm việc' ? 'bg-emerald-500' : 'bg-muted-foreground/30'
                )}
                aria-hidden
              />
            </div>
          )}
          titleRow={(
            <div className="flex min-w-0 items-center justify-between gap-2">
              <h4 className="truncate text-base font-semibold text-foreground">{item.ho_ten}</h4>
              <div className="shrink-0">
                <EnumBadge
                  value={item.trang_thai}
                  config={STATUS_BADGE_CONFIG}
                  className="text-sm px-2.5 py-1"
                />
              </div>
            </div>
          )}
          footerStart={(
            <label className="inline-flex min-h-[44px] min-w-[44px] shrink-0 cursor-pointer items-center justify-center rounded-lg">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelection(item.id)}
                onClick={(e) => e.stopPropagation()}
                aria-label={txt('common.select')}
                className="h-4 w-4 cursor-pointer rounded border-border text-primary accent-primary"
              />
            </label>
          )}
          footerEnd={(
            <EmployeeTableRowActions
              compact
              item={item}
              menuOpenId={rowMenuOpenId}
              onMenuOpenChange={setRowMenuOpenId}
              onEdit={onEdit}
              onDelete={onDelete}
              onStatusChange={onStatusChange}
              onDuplicate={onDuplicate}
            />
          )}
        />
    ), [onEdit, onDelete, onStatusChange, onDuplicate, onView, rowMenuOpenId, toggleSelection]);

    return (
        <GenericTable
            data={data}
            columns={columns}
            isLoading={isLoading}
            loadingText={txt('common.loadingData')}
            selectedIds={selectedIds}
            onToggleSelection={toggleSelection}
            onToggleAll={toggleAllSelection}
            page={pagination.page}
            pageSize={pagination.pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            sort={sort}
            onSort={setSort}
            renderCell={renderCell}
            getCellText={getEmployeeCellText}
            renderMobileCard={renderMobileCard}
            onRowClick={onView}
            keyExtractor={item => item.id}
            onResizeColumn={resizeColumn}
            density={density}
            stickyLeftCount={2}
            renderColumnHeaderAccessory={renderColumnHeaderAccessory}
            hideSortOnColumnLabel
            totalRecordCount={totalRecordCount}
            serverPaginated={serverPaginated}
        />
    );
});

export default EmployeeTable;
