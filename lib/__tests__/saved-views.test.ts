import { describe, it, expect, vi, afterEach } from 'vitest';
import { loadViews, saveViews, createViewId } from '../saved-views';

describe('saveViews — không crash khi localStorage.setItem throw (vd QuotaExceededError)', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('setItem throw QuotaExceededError → saveViews không ném lỗi ra ngoài', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('quota exceeded', 'QuotaExceededError');
    });
    expect(() => saveViews('test-module', [])).not.toThrow();
  });

  it('lưu thành công vẫn đọc lại đúng bằng loadViews (round-trip)', () => {
    const view = {
      id: createViewId(),
      name: 'Mặc định',
      filters: {},
      searchTerm: '',
      sort: { column: null, direction: null },
      columns: [],
      density: 'default' as const,
    };
    saveViews('test-module', [view]);
    expect(loadViews('test-module')).toEqual([view]);
  });
});

describe('loadViews — dữ liệu hỏng trong localStorage không crash', () => {
  afterEach(() => localStorage.clear());

  it('JSON không parse được → trả mảng rỗng', () => {
    localStorage.setItem('test-module:views', '{not json');
    expect(loadViews('test-module')).toEqual([]);
  });

  it('JSON hợp lệ nhưng không phải mảng → trả mảng rỗng', () => {
    localStorage.setItem('test-module:views', JSON.stringify({ not: 'an array' }));
    expect(loadViews('test-module')).toEqual([]);
  });

  it('chưa từng lưu → trả mảng rỗng', () => {
    expect(loadViews('never-saved-module')).toEqual([]);
  });
});
