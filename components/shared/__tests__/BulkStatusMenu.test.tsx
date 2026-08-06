import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import BulkStatusMenu from '../BulkStatusMenu';

const OPTIONS = [
  { value: 'Đang làm việc', label: 'Đang làm việc' },
  { value: 'Nghỉ việc', label: 'Nghỉ việc' },
  { value: 'Thử việc', label: 'Thử việc' },
  { value: 'Nghỉ phép', label: 'Nghỉ phép' },
];

describe('BulkStatusMenu', () => {
  it('render một nút, không phải N nút rời theo số trạng thái', () => {
    render(<BulkStatusMenu options={OPTIONS} onSelect={vi.fn()} />);

    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('button')).toHaveAccessibleName('Đổi trạng thái');
    // Chưa mở menu ⇒ chưa có trạng thái nào trong DOM.
    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });

  it('mở menu hiện đủ mọi trạng thái và gọi onSelect với value tương ứng', () => {
    const onSelect = vi.fn();
    render(<BulkStatusMenu options={OPTIONS} onSelect={onSelect} />);

    fireEvent.click(screen.getByRole('button', { name: 'Đổi trạng thái' }));

    expect(screen.getAllByRole('menuitem')).toHaveLength(OPTIONS.length);

    fireEvent.click(screen.getByRole('menuitem', { name: 'Thử việc' }));
    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('Thử việc');
  });

  it('chọn xong thì đóng menu', () => {
    render(<BulkStatusMenu options={OPTIONS} onSelect={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Đổi trạng thái' }));
    fireEvent.click(screen.getByRole('menuitem', { name: 'Nghỉ việc' }));

    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
  });

  it('disabled thì không mở được menu', () => {
    const onSelect = vi.fn();
    render(<BulkStatusMenu options={OPTIONS} onSelect={onSelect} disabled />);

    fireEvent.click(screen.getByRole('button', { name: 'Đổi trạng thái' }));

    expect(screen.queryByRole('menuitem')).not.toBeInTheDocument();
    expect(onSelect).not.toHaveBeenCalled();
  });
});
