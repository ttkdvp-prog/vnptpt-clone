import { describe, it, expect, vi } from 'vitest';
import { runChunkedImport } from '../run-chunked-import';
import { runBulkImport } from '@/server/bulk-import';
import type { ImportBatchRow } from '../types';

/**
 * `runChunkedImport` (client) và `runBulkImport` (server) là hợp đồng của cùng
 * một luồng import: server trả lỗi theo `index` TRONG một chunk, client phải map
 * đúng `index` đó về `rowNumber` gốc của file Excel — kể cả khi lỗi rơi ở ranh
 * giới giữa 2 chunk. Lệch một chỗ ⇒ người dùng tải file lỗi về thấy sai dòng,
 * không crash, không log — rất khó phát hiện bằng tay.
 */
describe('runChunkedImport + runBulkImport — hợp đồng index → rowNumber qua ranh giới chunk', () => {
  function makeRows(n: number): ImportBatchRow[] {
    return Array.from({ length: n }, (_, i) => ({
      rowNumber: i + 2, // dòng 1 là header
      data: { ten: `Dòng ${i + 2}` },
    }));
  }

  it('lỗi ở đúng ranh giới chunk (item cuối chunk 1, item đầu chunk 2) map đúng rowNumber', async () => {
    const rows = makeRows(5); // rowNumber 2..6
    const chunkSize = 3; // chunk1: rowNumber 2,3,4 | chunk2: rowNumber 5,6

    const postChunk = vi.fn(async (items: { ten: string }[]) => {
      // Giả lập server: item cuối chunk1 (index 2) và item đầu chunk2 (index 0) lỗi.
      return runBulkImport(
        items,
        async (raw, index) => {
          const isLastOfFirstCall = items.length === 3 && index === 2;
          const isFirstOfSecondCall = items.length === 2 && index === 0;
          if (isLastOfFirstCall || isFirstOfSecondCall) {
            throw new Error('Trùng dữ liệu');
          }
        },
        (err) => (err instanceof Error ? err.message : String(err)),
      );
    });

    const result = await runChunkedImport(
      rows,
      (data) => ({ ten: data.ten as string }),
      postChunk,
      { chunkSize },
    );

    expect(result.created).toBe(3);
    expect(result.failed.map((f) => f.rowNumber).sort()).toEqual([4, 5]);
    expect(postChunk).toHaveBeenCalledTimes(2);
  });

  it('lỗi build payload (zod) ở một dòng không làm lệch index của các dòng còn lại trong chunk', async () => {
    const rows = makeRows(4); // rowNumber 2..5
    const postChunk = vi.fn(async (items: { ten: string }[]) =>
      runBulkImport(items, async () => {}, () => ''),
    );

    const result = await runChunkedImport(
      rows,
      (data, rowNumber) => {
        if (rowNumber === 3) throw new Error('Trường "ten" không hợp lệ');
        return { ten: data.ten as string };
      },
      postChunk,
      { chunkSize: 100 },
    );

    expect(result.failed).toEqual([
      { rowNumber: 3, message: 'Trường "ten" không hợp lệ', data: { ten: 'Dòng 3' } },
    ]);
    // Chunk gửi lên chỉ còn 3 item hợp lệ (rowNumber 2,4,5) — không có dòng lỗi build payload.
    expect(postChunk).toHaveBeenCalledWith([{ ten: 'Dòng 2' }, { ten: 'Dòng 4' }, { ten: 'Dòng 5' }]);
    expect(result.created).toBe(3);
  });

  it('cả chunk lỗi (postChunk throw, vd mất mạng) — mọi dòng trong chunk đó thành failed, không mất dòng', async () => {
    const rows = makeRows(2);
    const postChunk = vi.fn(async () => {
      throw new Error('Network error');
    });

    const result = await runChunkedImport(rows, (data) => data, postChunk, { chunkSize: 100 });

    expect(result.created).toBe(0);
    expect(result.failed).toHaveLength(2);
    expect(result.failed.every((f) => f.message === 'Network error')).toBe(true);
  });

  it('onProgress được gọi tích lũy đúng, kể cả dòng lỗi build payload', async () => {
    const rows = makeRows(3);
    const onProgress = vi.fn();
    const postChunk = vi.fn(async (items: unknown[]) => ({ created: items.length, errors: [] }));

    await runChunkedImport(
      rows,
      (data, rowNumber) => {
        if (rowNumber === 2) throw new Error('lỗi');
        return data;
      },
      postChunk,
      { chunkSize: 100, onProgress },
    );

    const calls = onProgress.mock.calls as Array<[number, number]>;
    expect(calls[calls.length - 1]).toEqual([3, 3]);
  });
});
