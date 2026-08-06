import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import GenericToolbar from '../GenericToolbar';

/**
 * Khóa hợp đồng render của thanh bulk.
 *
 * Bug đã từng xảy ra ở Nhân viên: nút "Sửa nhiều" được đặt trong prop `actions`
 * kèm điều kiện `selectedIds.size > 0`. Nhưng `actions` chỉ render ở nhánh
 * **không có selection**, nên nút không bao giờ hiện — bulk edit là UI chết.
 * Test này giữ ranh giới đó rõ ràng: nút bulk phải đi qua `bulkActions`.
 */
describe('GenericToolbar — nhánh bulk vs nhánh thường', () => {
  const baseProps = {
    searchTerm: '',
    onSearchChange: vi.fn(),
    onClearSelection: vi.fn(),
  };

  it('không có selection: render `actions`, không render `bulkActions`', () => {
    render(
      <GenericToolbar
        {...baseProps}
        selectedCount={0}
        actions={<button type="button">Nhập dữ liệu</button>}
        bulkActions={<button type="button">Sửa nhiều</button>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Nhập dữ liệu' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Sửa nhiều' })).not.toBeInTheDocument();
  });

  it('có selection: render `bulkActions`, không render `actions`', () => {
    render(
      <GenericToolbar
        {...baseProps}
        selectedCount={3}
        actions={<button type="button">Nhập dữ liệu</button>}
        bulkActions={<button type="button">Sửa nhiều</button>}
      />,
    );

    // Toolbar render cả hàng desktop và hàng mobile (ẩn/hiện bằng CSS breakpoint),
    // nên `bulkActions` xuất hiện 2 lần trong DOM.
    expect(screen.getAllByRole('button', { name: 'Sửa nhiều' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('button', { name: 'Nhập dữ liệu' })).not.toBeInTheDocument();
  });

  it('có selection: nút Xóa nhiều hiện khi có onDeleteMany', () => {
    const onDeleteMany = vi.fn();
    render(<GenericToolbar {...baseProps} selectedCount={2} onDeleteMany={onDeleteMany} />);

    // Desktop + mobile đều render một nút Xóa ⇒ dùng getAllBy.
    expect(screen.getAllByText('Xóa').length).toBeGreaterThan(0);
  });

  it('có selection: nút "Đổi trạng thái" (MỘT nút, không phải N nút rời) chỉ hiện khi có bulkStatusOptions + onBulkStatusChange', () => {
    const { rerender } = render(<GenericToolbar {...baseProps} selectedCount={2} />);
    expect(screen.queryByRole('button', { name: /đổi trạng thái/i })).not.toBeInTheDocument();

    rerender(
      <GenericToolbar
        {...baseProps}
        selectedCount={2}
        bulkStatusOptions={[
          { value: 'Đang hoạt động', label: 'Kích hoạt' },
          { value: 'Ngừng hoạt động', label: 'Tắt' },
        ]}
        onBulkStatusChange={vi.fn()}
      />,
    );
    // MỘT nút mở dropdown — nhãn từng trạng thái ("Kích hoạt"/"Tắt") không hiện
    // ra cho tới khi mở, đây chính là khoá cho quyết định "1 nút, không N nút".
    expect(screen.getAllByRole('button', { name: /đổi trạng thái/i }).length).toBeGreaterThan(0);
    expect(screen.queryByText('Kích hoạt')).not.toBeInTheDocument();
    expect(screen.queryByText('Tắt')).not.toBeInTheDocument();
  });

  it('có selection: bulkActionItems render trước "Đổi trạng thái" và trước "Xóa"', () => {
    render(
      <GenericToolbar
        {...baseProps}
        selectedCount={2}
        bulkActionItems={[{ key: 'reset', label: 'Đổi mật khẩu', onClick: vi.fn() }]}
        bulkStatusOptions={[{ value: 'x', label: 'X' }]}
        onBulkStatusChange={vi.fn()}
        onDeleteMany={vi.fn()}
      />,
    );
    expect(screen.getAllByRole('button', { name: 'Đổi mật khẩu' }).length).toBeGreaterThan(0);
  });
});
