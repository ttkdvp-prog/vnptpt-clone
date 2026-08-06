import type { ZodError } from 'zod';

export interface BulkImportRowError {
  index: number;
  message: string;
}

/**
 * Lỗi zod của một dòng import, viết bằng tiếng Việt cho người dùng cuối.
 * Client đã validate trước bằng schema của feature (message tiếng Việt);
 * đây là lớp chặn cuối nên chỉ cần nêu rõ trường sai.
 */
export function bulkImportZodMessage(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) return 'Dữ liệu không hợp lệ';
  const field = issue.path.filter((p) => typeof p === 'string').join('.');
  return field ? `Trường "${field}" không hợp lệ` : 'Dữ liệu không hợp lệ';
}

export interface BulkImportResult {
  created: number;
  errors: BulkImportRowError[];
}

/** Số item tối đa mỗi request bulk import. */
export const BULK_IMPORT_MAX_ITEMS = 200;

/**
 * Chạy bulk import tuần tự từng item — partial success, lỗi được gom theo index
 * để client map ngược về số dòng Excel. Tuần tự (không Promise.allSettled) để
 * dòng trùng nhau trong cùng file fail có thứ tự xác định.
 */
export async function runBulkImport(
  items: unknown[],
  handleOne: (raw: unknown, index: number) => Promise<void>,
  translateError: (err: unknown) => string,
): Promise<BulkImportResult> {
  const errors: BulkImportRowError[] = [];
  let created = 0;

  for (let index = 0; index < items.length; index++) {
    try {
      await handleOne(items[index], index);
      created++;
    } catch (err) {
      errors.push({ index, message: translateError(err) });
    }
  }

  return { created, errors };
}
