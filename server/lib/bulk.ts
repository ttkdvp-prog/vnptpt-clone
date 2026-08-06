/**
 * Số item tối đa mỗi request bulk (status/delete/edit/workflow). Cùng bậc với
 * BULK_IMPORT_MAX_ITEMS (server/bulk-import.ts) nhưng khai riêng vì hai luồng
 * độc lập — đổi ngưỡng import không nên vô tình đổi ngưỡng bulk action.
 */
export const BULK_MAX_ITEMS = 200;

export interface BulkRowError {
  id: string;
  message: string;
}

export interface BulkPartialResult {
  ok: true;
  mode: 'partial';
  succeededIds: string[];
  errors: BulkRowError[];
}

export interface BulkAtomicResult {
  ok: true;
  mode: 'atomic';
  count: number;
  skippedIds?: string[];
}

/**
 * Parse `{ ids: number[] }` từ body thô. Coerce lỏng như route /status/bulk
 * hiện có: `Number(v)` rồi lọc `Number.isFinite` — pin nguyên hợp đồng coerce
 * này bằng test (true→1, null→0) thay vì âm thầm đổi, vì client cũ có thể đang
 * dựa vào nó.
 */
export function parseBulkIds(raw: unknown): { ids: number[] } | { error: string } {
  const idsRaw = raw && typeof raw === 'object' ? (raw as Record<string, unknown>).ids : undefined;
  if (!Array.isArray(idsRaw)) {
    return { error: 'ids là bắt buộc và phải là mảng' };
  }
  const ids = idsRaw.map((v) => Number(v)).filter((n) => Number.isFinite(n));
  if (ids.length === 0) {
    return { error: 'ids không được rỗng' };
  }
  if (ids.length > BULK_MAX_ITEMS) {
    return { error: `Chỉ xử lý tối đa ${BULK_MAX_ITEMS} bản ghi mỗi lần` };
  }
  return { ids };
}

/**
 * Chạy bulk theo mode `partial`: mỗi id một try/catch riêng, dòng lỗi không kéo
 * dòng khác xuống. Sibling có chủ ý của `runBulkImport` (server/bulk-import.ts)
 * — import key theo INDEX (map ngược về dòng Excel), bulk action key theo ID
 * (map ngược về bản ghi thật). Không gộp hai hàm — ngữ nghĩa key khác nhau.
 */
export async function runBulkPartial(
  ids: number[],
  handleOne: (id: number) => Promise<void>,
  translateError: (err: unknown) => string,
): Promise<BulkPartialResult> {
  const succeededIds: string[] = [];
  const errors: BulkRowError[] = [];

  for (const id of ids) {
    try {
      await handleOne(id);
      succeededIds.push(String(id));
    } catch (err) {
      errors.push({ id: String(id), message: translateError(err) });
    }
  }

  return { ok: true, mode: 'partial', succeededIds, errors };
}
