import { randomUUID } from 'node:crypto';
import { Hono } from 'hono';
import { MEDIA_SERVER_MAX_BYTES } from '@/lib/media/compress-image';
import { CLOUDINARY_FOLDERS } from '@/lib/media/cloudinary-folders';
import { uploadFileToDrive } from '@/lib/storage/drive';
import { requireAuthOrUploadKey, type AuthVariables } from '@/server/auth';

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const ALLOWED_DOCUMENT_MIME: Record<string, string> = {
  'application/pdf': '.pdf',
};

const MAX_BYTES = MEDIA_SERVER_MAX_BYTES;
/** PDF hồ sơ/hợp đồng thường nặng hơn ảnh — cho phép tới 20MB. */
const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;
const FOLDER_RE = /^[a-zA-Z0-9._/-]+$/;

function sanitizeFolder(raw: string | undefined): string {
  const fallback = CLOUDINARY_FOLDERS.generalUpload;
  if (!raw?.trim()) return fallback;
  const cleaned = raw
    .trim()
    .replace(/\\/g, '/')
    .replace(/^\/+|\/+$/g, '')
    .replace(/\.\./g, '');
  if (!cleaned || !FOLDER_RE.test(cleaned) || cleaned.includes('..')) {
    return fallback;
  }
  return cleaned;
}

const uploadsRoutes = new Hono<{ Variables: AuthVariables }>();

/** Upload ảnh — lưu trên Google Drive (folder cố định `GOOGLE_DRIVE_FOLDER_ID`), trả URL xem trực tiếp. */
uploadsRoutes.post('/', requireAuthOrUploadKey, async (c) => {
  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    return c.json({ error: 'Invalid multipart body' }, 400);
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return c.json({ error: 'Missing file' }, 400);
  }

  const mime = (file.type || '').toLowerCase();
  const ext = ALLOWED_MIME[mime];
  if (!ext) {
    return c.json({ error: 'Chỉ chấp nhận ảnh JPEG, PNG, WebP hoặc GIF' }, 400);
  }

  if (file.size <= 0 || file.size > MAX_BYTES) {
    return c.json({ error: `Ảnh vượt quá ${Math.round(MAX_BYTES / (1024 * 1024))}MB` }, 400);
  }

  const folderField = form.get('folder');
  const folder = sanitizeFolder(typeof folderField === 'string' ? folderField : undefined);

  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { url } = await uploadFileToDrive(buffer, filename, mime, folder);
    return c.json({ url });
  } catch (err) {
    console.error('[uploads] Drive upload failed:', err);
    return c.json({ error: 'Không thể tải ảnh lên Google Drive' }, 502);
  }
});

/** Upload tài liệu (PDF) — lưu trên Google Drive, trả URL xem trực tiếp. */
uploadsRoutes.post('/document', requireAuthOrUploadKey, async (c) => {
  let form: FormData;
  try {
    form = await c.req.formData();
  } catch {
    return c.json({ error: 'Invalid multipart body' }, 400);
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return c.json({ error: 'Missing file' }, 400);
  }

  const mime = (file.type || '').toLowerCase();
  const ext = ALLOWED_DOCUMENT_MIME[mime];
  if (!ext) {
    return c.json({ error: 'Chỉ chấp nhận file PDF' }, 400);
  }

  if (file.size <= 0 || file.size > MAX_DOCUMENT_BYTES) {
    return c.json({ error: `File vượt quá ${Math.round(MAX_DOCUMENT_BYTES / (1024 * 1024))}MB` }, 400);
  }

  const folderField = form.get('folder');
  const folder = sanitizeFolder(typeof folderField === 'string' ? folderField : undefined);

  const filename = `${randomUUID()}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const { url } = await uploadFileToDrive(buffer, filename, mime, folder);
    return c.json({ url });
  } catch (err) {
    console.error('[uploads] Drive document upload failed:', err);
    return c.json({ error: 'Không thể tải file lên Google Drive' }, 502);
  }
});

export { uploadsRoutes };
