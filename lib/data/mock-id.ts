/**
 * Sinh id cho bản ghi mock. Phần ngẫu nhiên là **bắt buộc**: `Date.now()` một
 * mình trùng ngay khi hai bản ghi được tạo trong cùng một millisecond (tạo nhanh
 * hai lần, import nhiều dòng, bulk create). Trước khi gom về đây, ba service
 * dùng `` `pos-${Date.now()}` `` / `` `dep-${Date.now()}` `` / `` `EMP-${Date.now()}` ``
 * và id trùng làm `findIndex`/`find` trả sai bản ghi — bug này bị che vì mock
 * repository ngủ 300–600ms mỗi thao tác, đủ để hai lần tạo lệch millisecond.
 *
 * Cùng khuôn với `createViewId` (`lib/saved-views.ts`).
 */
export function createMockId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
