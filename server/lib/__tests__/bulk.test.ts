import { describe, it, expect, vi } from 'vitest';
import { parseBulkIds, runBulkPartial, BULK_MAX_ITEMS } from '../bulk';

describe('parseBulkIds', () => {
  it('parse mảng số hợp lệ', () => {
    expect(parseBulkIds({ ids: [1, 2, 3] })).toEqual({ ids: [1, 2, 3] });
  });

  it('không phải object / thiếu ids ⇒ lỗi', () => {
    expect(parseBulkIds(undefined)).toEqual({ error: 'ids là bắt buộc và phải là mảng' });
    expect(parseBulkIds({})).toEqual({ error: 'ids là bắt buộc và phải là mảng' });
    expect(parseBulkIds({ ids: 'not-array' })).toEqual({ error: 'ids là bắt buộc và phải là mảng' });
  });

  it('mảng rỗng sau khi lọc ⇒ lỗi "không được rỗng"', () => {
    expect(parseBulkIds({ ids: [] })).toEqual({ error: 'ids không được rỗng' });
    expect(parseBulkIds({ ids: ['abc', NaN, undefined] })).toEqual({ error: 'ids không được rỗng' });
  });

  it('vượt BULK_MAX_ITEMS ⇒ lỗi giới hạn, ids KHÔNG bị cắt bớt để xử lý một phần', () => {
    const ids = Array.from({ length: BULK_MAX_ITEMS + 1 }, (_, i) => i + 1);
    expect(parseBulkIds({ ids })).toEqual({
      error: `Chỉ xử lý tối đa ${BULK_MAX_ITEMS} bản ghi mỗi lần`,
    });
  });

  it('đúng BULK_MAX_ITEMS ⇒ hợp lệ', () => {
    const ids = Array.from({ length: BULK_MAX_ITEMS }, (_, i) => i + 1);
    const result = parseBulkIds({ ids });
    expect('ids' in result && result.ids.length).toBe(BULK_MAX_ITEMS);
  });

  /**
   * [hành vi hiện tại — cố ý pin] Coerce lỏng bằng `Number(v)`: `true` → 1,
   * `null` → 0, chuỗi số → number, string không phải số/NaN bị lọc bỏ. Client
   * cũ có thể đang gửi id dạng string nên không siết thành `Number.isInteger`
   * mà không kiểm tra kỹ trước — nhưng cũng có nghĩa `true`/`null` lẫn vào
   * mảng ids KHÔNG bị 400 mà âm thầm biến thành id 1 / id 0.
   */
  it('[hành vi hiện tại] coerce lỏng: true→1, null→0, "1"→1, NaN/chuỗi rác bị lọc', () => {
    const result = parseBulkIds({ ids: ['1', 2, true, null, 'x', NaN, '3.5'] });
    expect('ids' in result && result.ids).toEqual([1, 2, 1, 0, 3.5]);
  });
});

describe('runBulkPartial', () => {
  it('mảng rỗng ⇒ kết quả rỗng, không gọi handleOne', async () => {
    const handleOne = vi.fn(async () => {});
    const result = await runBulkPartial([], handleOne, String);
    expect(result).toEqual({ ok: true, mode: 'partial', succeededIds: [], errors: [] });
    expect(handleOne).not.toHaveBeenCalled();
  });

  it('mọi id thành công ⇒ succeededIds đầy đủ, errors rỗng', async () => {
    const result = await runBulkPartial([1, 2, 3], async () => {}, () => 'lỗi');
    expect(result).toEqual({ ok: true, mode: 'partial', succeededIds: ['1', '2', '3'], errors: [] });
  });

  it('lỗi một id không chặn các id còn lại (partial, không phải Promise.all)', async () => {
    const result = await runBulkPartial(
      [1, 2, 3],
      async (id) => {
        if (id === 2) throw new Error('bị chặn quyền');
      },
      (err) => (err instanceof Error ? err.message : String(err)),
    );
    expect(result.succeededIds).toEqual(['1', '3']);
    expect(result.errors).toEqual([{ id: '2', message: 'bị chặn quyền' }]);
  });

  it('xử lý tuần tự theo đúng thứ tự ids (không song song)', async () => {
    const order: number[] = [];
    await runBulkPartial(
      [3, 1, 2],
      async (id) => {
        order.push(id);
      },
      () => '',
    );
    expect(order).toEqual([3, 1, 2]);
  });

  it('translateError được gọi với đúng lỗi gốc của từng id', async () => {
    const translateError = vi.fn(() => 'đã dịch');
    await runBulkPartial(
      [1],
      async () => {
        throw new Error('lỗi gốc');
      },
      translateError,
    );
    expect(translateError).toHaveBeenCalledWith(expect.any(Error));
  });
});
