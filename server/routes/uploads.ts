import { randomUUID } from 'node:crypto';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Hono } from 'hono';
import {
  getAppPublicOrigin,
  getUploadDir,
  resolvePublicOriginFromHeaders,
  toPublicUploadUrl,
} from '@/lib/media/config';
import { MEDIA_SERVER_MAX_BYTES } from '@/lib/media/compress-image';
import { CLOUDINARY_FOLDERS } from '@/lib/media/cloudinary-folders';
import { requireAuthOrUploadKey, type AuthVariables } from '@/server/auth';

const ALLOWED_MIME: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

const MAX_BYTES = MEDIA_SERVER_MAX_BYTES;
const FOLDER_RE = /^[a-zA-Z0-9._/-]+$/;

const MIME_BY_EXT: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

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

function resolveUnderUploadRoot(relativePath: string): string | null {
  const root = path.resolve(getUploadDir());
  const absolute = path.resolve(root, relativePath);
  const rel = path.relative(root, absolute);
  if (rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return absolute;
}

function getUploadRemoteBaseUrl(): string {
  return (process.env.UPLOAD_REMOTE_BASE_URL ?? '').trim().replace(/\/+$/, '');
}

/** Prefer fixed public origin (VPS) over request Host when set. */
function resolveUploadPublicOrigin(headers: Headers, requestUrl: string): string {
  const envOrigin = getAppPublicOrigin();
  if (envOrigin) return envOrigin;
  return resolvePublicOriginFromHeaders(headers, requestUrl);
}

async function forwardUploadToRemote(
  file: File,
  folder: string,
): Promise<{ status: number; body: unknown }> {
  const remote = getUploadRemoteBaseUrl();
  const key = process.env.UPLOAD_API_KEY?.trim();
  if (!remote) {
    return { status: 500, body: { error: 'UPLOAD_REMOTE_BASE_URL is not set' } };
  }
  if (!key) {
    return {
      status: 500,
      body: { error: 'UPLOAD_API_KEY is required when UPLOAD_REMOTE_BASE_URL is set' },
    };
  }

  const form = new FormData();
  form.append('file', file);
  form.append('folder', folder);

  const res = await fetch(`${remote}/uploads`, {
    method: 'POST',
    headers: { 'x-upload-key': key },
    body: form,
  });

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = { error: `Remote upload failed (${res.status})` };
  }
  return { status: res.status, body };
}

const uploadsRoutes = new Hono<{ Variables: AuthVariables }>();

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
    return c.json(
      { error: `Ảnh vượt quá ${Math.round(MAX_BYTES / (1024 * 1024))}MB` },
      400,
    );
  }

  const folderField = form.get('folder');
  const folder = sanitizeFolder(
    typeof folderField === 'string' ? folderField : undefined,
  );

  // Local/dev: proxy to VPS so files + public URLs live on production
  if (getUploadRemoteBaseUrl()) {
    const { status, body } = await forwardUploadToRemote(file, folder);
    return c.json(body as { url?: string; error?: string }, status as 200);
  }

  const filename = `${randomUUID()}${ext}`;
  const relativeDisk = path.join(folder, filename);
  const absolute = resolveUnderUploadRoot(relativeDisk);
  if (!absolute) {
    return c.json({ error: 'Invalid folder' }, 400);
  }

  await mkdir(path.dirname(absolute), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolute, buffer);

  const publicPath = `/uploads/${folder.split(path.sep).join('/')}/${filename}`;
  const origin = resolveUploadPublicOrigin(c.req.raw.headers, c.req.url);
  return c.json({ url: toPublicUploadUrl(publicPath, origin) });
});

uploadsRoutes.get('/*', async (c) => {
  const pathname = new URL(c.req.url).pathname;
  const wildcard = pathname.replace(/^\/uploads\/?/, '');
  if (!wildcard || wildcard.includes('\0')) {
    return c.json({ error: 'Not found' }, 404);
  }

  let decoded: string;
  try {
    decoded = decodeURIComponent(wildcard);
  } catch {
    return c.json({ error: 'Not found' }, 404);
  }

  const absolute = resolveUnderUploadRoot(decoded);
  if (!absolute) {
    return c.json({ error: 'Not found' }, 404);
  }

  try {
    await access(absolute);
  } catch {
    return c.json({ error: 'Not found' }, 404);
  }

  const ext = path.extname(absolute).toLowerCase();
  const contentType = MIME_BY_EXT[ext] ?? 'application/octet-stream';
  const body = await readFile(absolute);

  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': String(body.byteLength),
    },
  });
});

export { uploadsRoutes };
