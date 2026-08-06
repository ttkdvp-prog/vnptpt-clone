import type { ImportBatchRow, ImportResult, ImportRowError } from './types';

/** Kết quả trả về từ endpoint bulk import (POST /:resource/import). */
export interface BulkImportResult {
  created: number;
  errors: { index: number; message: string }[];
}

const DEFAULT_CHUNK_SIZE = 100;

/**
 * Import theo chunk: build payload cho toàn bộ dòng trước (lỗi zod/FK gom lại tại chỗ),
 * rồi gửi các payload hợp lệ theo từng chunk tới endpoint bulk.
 * `data` trong lỗi luôn là dòng gốc đầy đủ để file lỗi tải về không bị mất cột.
 */
export async function runChunkedImport<TPayload>(
  rows: ImportBatchRow[],
  buildPayload: (data: Record<string, unknown>, rowNumber: number) => TPayload,
  postChunk: (items: TPayload[]) => Promise<BulkImportResult>,
  options?: {
    chunkSize?: number;
    onProgress?: (done: number, total: number) => void;
  },
): Promise<ImportResult> {
  const chunkSize = options?.chunkSize ?? DEFAULT_CHUNK_SIZE;
  const total = rows.length;
  const failed: ImportRowError[] = [];
  let created = 0;
  let done = 0;

  const valid: { row: ImportBatchRow; payload: TPayload }[] = [];
  for (const row of rows) {
    try {
      valid.push({ row, payload: buildPayload(row.data, row.rowNumber) });
    } catch (err) {
      failed.push({
        rowNumber: row.rowNumber,
        message: err instanceof Error ? err.message : String(err),
        data: row.data,
      });
      done++;
      options?.onProgress?.(done, total);
    }
  }

  for (let i = 0; i < valid.length; i += chunkSize) {
    const chunk = valid.slice(i, i + chunkSize);
    try {
      const result = await postChunk(chunk.map((item) => item.payload));
      const errorByIndex = new Map(result.errors.map((e) => [e.index, e.message]));
      chunk.forEach((item, index) => {
        const message = errorByIndex.get(index);
        if (message === undefined) {
          created++;
        } else {
          failed.push({ rowNumber: item.row.rowNumber, message, data: item.row.data });
        }
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      chunk.forEach((item) => {
        failed.push({ rowNumber: item.row.rowNumber, message, data: item.row.data });
      });
    }
    done += chunk.length;
    options?.onProgress?.(done, total);
  }

  return { created, failed };
}
