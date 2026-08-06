import type { ZodError, ZodType } from 'zod';

/** Lấy message dễ đọc đầu tiên từ ZodError (thay vì JSON dump của cả mảng issues). */
export function firstZodIssueMessage(error: ZodError): string {
  const issue = error.issues[0];
  if (!issue) return 'Dữ liệu không hợp lệ';
  const path = issue.path.filter((p) => typeof p === 'string').join('.');
  return path ? `${path}: ${issue.message}` : issue.message;
}

/** safeParse rồi throw Error với message dễ đọc — dùng trong buildPayload khi import. */
export function parseForImport<T>(schema: ZodType<T>, payload: unknown): T {
  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    throw new Error(firstZodIssueMessage(parsed.error));
  }
  return parsed.data;
}
