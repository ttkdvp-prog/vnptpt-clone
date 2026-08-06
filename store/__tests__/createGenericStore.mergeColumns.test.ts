import { describe, it, expect } from 'vitest';
import { createGenericStore, type ColumnConfig } from '../createGenericStore';

/**
 * `mergeColumns` (private, chỉ gọi được qua `applyView`/persist `merge`) gộp
 * cấu hình cột đã lưu (localStorage cũ hoặc Saved View) với cột hiện tại trong
 * code. Test qua `applyView` — hành vi công khai duy nhất chạm tới nó.
 */
describe('createGenericStore — mergeColumns qua applyView', () => {
  function makeStore(defaultColumns: ColumnConfig[]) {
    return createGenericStore<Record<string, never>>({}, defaultColumns, `test:${Math.random()}`);
  }

  it('width đã lưu vượt maxWidth (vd localStorage cũ hoặc Saved View hỏng) bị clamp lại, không giữ nguyên 9999', () => {
    const store = makeStore([{ id: 'ten', label: 'Tên', visible: true, order: 0, maxWidth: 400 }]);
    store.getState().applyView({
      filters: {},
      sort: { column: null, direction: null },
      density: 'default',
      searchTerm: '',
      columns: [{ id: 'ten', visible: true, order: 0, width: 9999 }],
    });
    expect(store.getState().columns.find((c) => c.id === 'ten')?.width).toBe(400);
  });

  it('width đã lưu dưới minWidth bị kéo lên minWidth', () => {
    const store = makeStore([{ id: 'ten', label: 'Tên', visible: true, order: 0, minWidth: 80 }]);
    store.getState().applyView({
      filters: {},
      sort: { column: null, direction: null },
      density: 'default',
      searchTerm: '',
      columns: [{ id: 'ten', visible: true, order: 0, width: 10 }],
    });
    expect(store.getState().columns.find((c) => c.id === 'ten')?.width).toBe(80);
  });

  it('width nằm trong khoảng hợp lệ giữ nguyên', () => {
    const store = makeStore([
      { id: 'ten', label: 'Tên', visible: true, order: 0, minWidth: 80, maxWidth: 400 },
    ]);
    store.getState().applyView({
      filters: {},
      sort: { column: null, direction: null },
      density: 'default',
      searchTerm: '',
      columns: [{ id: 'ten', visible: true, order: 0, width: 200 }],
    });
    expect(store.getState().columns.find((c) => c.id === 'ten')?.width).toBe(200);
  });

  it('width undefined trong bản lưu (chưa resize) giữ undefined, không bị ép về minWidth', () => {
    const store = makeStore([{ id: 'ten', label: 'Tên', visible: true, order: 0, minWidth: 80 }]);
    store.getState().applyView({
      filters: {},
      sort: { column: null, direction: null },
      density: 'default',
      searchTerm: '',
      columns: [{ id: 'ten', visible: true, order: 0, width: undefined }],
    });
    expect(store.getState().columns.find((c) => c.id === 'ten')?.width).toBeUndefined();
  });

  it('cột mới thêm sau (không có trong bản lưu) dùng cấu hình mặc định từ code, không mất cột', () => {
    const store = makeStore([
      { id: 'ten', label: 'Tên', visible: true, order: 0 },
      { id: 'moi', label: 'Cột mới', visible: true, order: 1 },
    ]);
    store.getState().applyView({
      filters: {},
      sort: { column: null, direction: null },
      density: 'default',
      searchTerm: '',
      columns: [{ id: 'ten', visible: true, order: 0, width: 100 }],
    });
    const cols = store.getState().columns;
    expect(cols.map((c) => c.id)).toContain('moi');
  });

  it('[hành vi hiện tại đáng ngờ] cột mới thêm sau dùng order mặc định từ code, có thể trùng order đã lưu ⇒ thứ tự không xác định', () => {
    // Bản lưu cũ chỉ có 1 cột với order=0. Code hiện tại có 2 cột, cột mới
    // "moi" có order mặc định = index của nó trong defaultColumns (1) — không
    // va chạm ở ví dụ này, nhưng nếu defaultColumns không set order tường minh
    // và cột mới được CHÈN vào giữa (không phải cuối), order suy ra theo index
    // có thể trùng với order đã lưu của cột khác. Pin hành vi: không có cơ chế
    // renumber, `.sort` dùng trực tiếp giá trị order có thể trùng.
    const store = makeStore([
      { id: 'a', label: 'A', visible: true, order: 0 },
      { id: 'b', label: 'B', visible: true, order: 0 }, // cố tình trùng order với "a"
    ]);
    store.getState().applyView({
      filters: {},
      sort: { column: null, direction: null },
      density: 'default',
      searchTerm: '',
      columns: [{ id: 'a', visible: true, order: 0, width: undefined }],
    });
    const orders = store.getState().columns.map((c) => c.order);
    expect(orders).toEqual([0, 0]);
  });
});
