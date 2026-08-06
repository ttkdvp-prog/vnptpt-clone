import React from 'react';
import EmptyState from './EmptyState';
import LoadingSpinnerWithText from './LoadingSpinnerWithText';

interface TableLoadingRowProps {
  colSpan: number;
  text?: string;
}

/** Hàng loading inline trong `<tbody>` — dùng cho bảng không có skeleton riêng (HierarchyTable, EmbeddedChildDataGrid). */
export const TableLoadingRow: React.FC<TableLoadingRowProps> = ({ colSpan, text = 'Đang tải dữ liệu' }) => (
  <tr>
    <td colSpan={colSpan} className="py-10 text-center bg-card">
      <LoadingSpinnerWithText text={text} centered />
    </td>
  </tr>
);

interface TableEmptyRowProps {
  colSpan: number;
  title?: string;
  description?: string;
}

/** Hàng empty-state inline trong `<tbody>` — dùng chung cho mọi bảng để nhất quán UI rỗng. */
export const TableEmptyRow: React.FC<TableEmptyRowProps> = ({ colSpan, title, description }) => (
  <tr>
    <td colSpan={colSpan} className="py-16 text-center bg-card">
      <EmptyState title={title} description={description} />
    </td>
  </tr>
);
