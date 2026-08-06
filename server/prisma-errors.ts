/** Lỗi ghi Sheets dạng chung — không còn Prisma error code, chỉ phân loại theo message. */

/** Lỗi trùng dữ liệu (unique). Sheets không có ràng buộc thật — repository tự kiểm tra và throw Error với message chứa từ khóa này. */
export function isUniqueViolation(err: unknown): boolean {
  const message = err instanceof Error ? err.message : '';
  return message.includes('Unique constraint') || message.toLowerCase().includes('unique') || message.includes('trùng');
}

/**
 * Dịch lỗi khi tạo/sửa bản ghi sang tiếng Việt dễ hiểu cho người dùng.
 * Lỗi thô được log phía server, không bao giờ trả nguyên văn về client.
 */
export function translateCreateError(err: unknown, uniqueMessage?: string): string {
  if (isUniqueViolation(err)) {
    return uniqueMessage ?? 'Dữ liệu bị trùng với bản ghi đã có';
  }
  if (err instanceof Error) {
    console.error('[sheets]', err.message);
    return err.message;
  }
  return 'Đã xảy ra lỗi không xác định';
}
