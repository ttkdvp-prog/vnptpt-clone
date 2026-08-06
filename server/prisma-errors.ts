import { Prisma } from '@prisma/client';

/** Lỗi vi phạm unique constraint (P2002). Giữ fallback check chuỗi cho lỗi đã wrap. */
export function isUniqueViolation(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    return true;
  }
  const message = err instanceof Error ? err.message : '';
  return message.includes('Unique constraint') || message.includes('unique');
}

/**
 * Dịch lỗi khi tạo/sửa bản ghi sang tiếng Việt dễ hiểu cho người dùng.
 * Lỗi Prisma thô được log phía server, không bao giờ trả nguyên văn về client.
 */
export function translateCreateError(err: unknown, uniqueMessage?: string): string {
  if (isUniqueViolation(err)) {
    return uniqueMessage ?? 'Dữ liệu bị trùng với bản ghi đã có';
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    console.error('[prisma]', err.code, err.message);
    if (err.code === 'P2003') return 'Dữ liệu tham chiếu không tồn tại';
    return 'Không thể lưu dữ liệu. Vui lòng kiểm tra lại thông tin.';
  }
  if (err instanceof Prisma.PrismaClientValidationError) {
    console.error('[prisma]', err.message);
    return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
  }
  if (err instanceof Error) return err.message;
  return 'Đã xảy ra lỗi không xác định';
}
