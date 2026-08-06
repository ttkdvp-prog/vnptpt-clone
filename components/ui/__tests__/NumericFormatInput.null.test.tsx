import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import NumericFormatInput from '../NumericFormatInput';

/**
 * Trước đây DataField ép `value` về `0` khi rỗng (Number(null/''/undefined) là
 * NaN → `Number.isFinite ? vNum : 0`), nên để trống một ô số lưu ra 0, không
 * phân biệt được với 0 thật. Test này khoá hành vi đúng: null round-trip.
 */
describe('NumericFormatInput — null round-trip, không ép về 0', () => {
  it('value=null hiện ô rỗng, không phải "0"', () => {
    render(<NumericFormatInput label="Số" value={null} placeholder="0" />);
    const input = screen.getByLabelText('Số') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('value=undefined hiện ô rỗng', () => {
    render(<NumericFormatInput label="Số" value={undefined} />);
    const input = screen.getByLabelText('Số') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('xoá trống ô đang có giá trị ⇒ onChange(null), không phải onChange(0)', () => {
    const onChange = vi.fn();
    render(<NumericFormatInput label="Số" value={5} onChange={onChange} />);
    const input = screen.getByLabelText('Số') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '' } });
    expect(onChange).toHaveBeenCalledWith(null);
    expect(onChange).not.toHaveBeenCalledWith(0);
  });

  it('value=0 thật vẫn hiện rỗng (giới hạn đã biết: 0 và trống hiện giống nhau)', () => {
    // Đây KHÔNG phải hồi quy — formatNumber(0) trả '' từ trước, hành vi hiển thị
    // giữ nguyên. Điều đã sửa là onChange/value không còn NHẦM giữa hai trạng
    // thái đó ở tầng dữ liệu (0 thật vẫn là 0, trống thật là null).
    render(<NumericFormatInput label="Số" value={0} />);
    const input = screen.getByLabelText('Số') as HTMLInputElement;
    expect(input.value).toBe('');
  });

  it('gõ số thật vẫn hoạt động bình thường', () => {
    const onChange = vi.fn();
    render(<NumericFormatInput label="Số" value={null} onChange={onChange} />);
    const input = screen.getByLabelText('Số') as HTMLInputElement;
    fireEvent.change(input, { target: { value: '42' } });
    expect(onChange).toHaveBeenCalledWith(42);
  });
});
