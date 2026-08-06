/**
 * Nhúng ảnh upload nội bộ thành data URL cho tài liệu render ở server.
 *
 * Chromium nhận HTML qua `page.setContent()` nên KHÔNG có origin để giải path tương đối
 * `/uploads/...`. Đọc thẳng từ đĩa vừa chắc chắn hơn (không phụ thuộc origin / proxy /
 * mạng nội bộ) vừa nhanh hơn một round-trip HTTP. Ảnh lỗi trả `null` — tài liệu vẫn ra,
 * chỉ thiếu ảnh, không làm hỏng cả request.
 */
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { getUploadDir } from '@/lib/media/config';

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
};

const MAX_INLINE_BYTES = 4 * 1024 * 1024;

/**
 * - `data:` / `http(s):` → giữ nguyên (Chromium tự tải được)
 * - `/uploads/...` → đọc đĩa, trả data URL
 * - không đọc được → `null`
 */
export async function inlineUploadImage(
  src: string | null | undefined,
): Promise<string | null> {
  if (!src) return null;
  const value = src.trim();
  if (!value) return null;
  if (value.startsWith('data:')) return value;
  if (/^https?:\/\//i.test(value)) return value;

  const match = /^\/?uploads\/(.+)$/i.exec(value);
  if (!match) return null;

  const root = path.resolve(getUploadDir());
  const absolute = path.resolve(root, match[1]);
  const relative = path.relative(root, absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative)) return null;

  const mime = MIME_BY_EXT[path.extname(absolute).toLowerCase()];
  if (!mime) return null;

  try {
    const buffer = await readFile(absolute);
    if (buffer.byteLength > MAX_INLINE_BYTES) return null;
    return `data:${mime};base64,${buffer.toString('base64')}`;
  } catch {
    return null;
  }
}
