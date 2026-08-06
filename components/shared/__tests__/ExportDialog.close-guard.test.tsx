import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ExportDialog from '../ExportDialog';

/**
 * Trước đây backdrop/X/Cancel gọi thẳng `onClose` không kiểm `exporting`, nên
 * đóng dialog giữa lúc export chạy làm `setExporting(false)` chạy trên cây đã
 * unmount. Test này khoá: đóng bị chặn khi đang export, và vẫn đóng được bình
 * thường khi không export.
 */
describe('ExportDialog — chặn đóng khi đang export', () => {
  const baseProps = {
    open: true,
    columns: [{ key: 'name', label: 'Tên' }],
    data: [{ name: 'A' }],
    fileName: 'test',
  };

  it('Cancel đóng được bình thường khi không export', () => {
    const onClose = vi.fn();
    render(<ExportDialog {...baseProps} onClose={onClose} />);
    fireEvent.click(screen.getByText('Hủy'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Escape đóng được bình thường khi không export', () => {
    const onClose = vi.fn();
    render(<ExportDialog {...baseProps} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Cancel KHÔNG đóng được khi đang export', async () => {
    const onClose = vi.fn();
    render(<ExportDialog {...baseProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /Xuất 1 dòng/ }));
    // Ngay sau khi bấm xuất, exporting=true trước khi xlsx dynamic import resolve.
    fireEvent.click(screen.getByText('Hủy'));
    expect(onClose).not.toHaveBeenCalled();

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });

  it('Escape KHÔNG đóng được khi đang export', async () => {
    const onClose = vi.fn();
    render(<ExportDialog {...baseProps} onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: /Xuất 1 dòng/ }));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1));
  });
});
