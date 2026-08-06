import { describe, expect, it } from 'vitest';
import { safeFileName } from '../file-name';

describe('safeFileName', () => {
  it('đổi khoảng trắng thành gạch dưới, giữ dấu tiếng Việt', () => {
    expect(safeFileName('Nguyễn Văn Ánh Dương')).toBe('Nguyễn_Văn_Ánh_Dương');
  });

  it('loại ký tự không hợp lệ cho tên file', () => {
    expect(safeFileName('a/b\\c:d*e?f"g<h>i|j')).toBe('abcdefghij');
  });

  it('gộp nhiều khoảng trắng liền nhau', () => {
    expect(safeFileName('Lê   Thị  Mai')).toBe('Lê_Thị_Mai');
  });
});
