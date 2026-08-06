import { describe, it, expect } from 'vitest';
import { createMockId } from '../mock-id';

/**
 * Bug gốc: id sinh bằng `` `pos-${Date.now()}` `` (không có phần ngẫu nhiên) nên
 * hai bản ghi tạo trong cùng một millisecond trùng id — `findIndex`/`find` sau
 * đó trả sai bản ghi. Bug bị che vì mock repository ngủ thật 300–600ms mỗi thao
 * tác, đủ để hai lần tạo luôn lệch millisecond.
 */
describe('createMockId', () => {
  it('không trùng khi tạo liên tiếp trong cùng một millisecond', () => {
    const ids = Array.from({ length: 1000 }, () => createMockId('pos'));
    expect(new Set(ids).size).toBe(1000);
  });

  it('giữ prefix để phân biệt loại bản ghi', () => {
    expect(createMockId('dep').startsWith('dep-')).toBe(true);
    expect(createMockId('EMP').startsWith('EMP-')).toBe(true);
  });
});
