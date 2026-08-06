import type { MediaConfig, MediaProviderId } from './types';

function parseProvider(raw: string | undefined): MediaProviderId {
  if (raw === 'local') return 'local';
  if (raw === 'uploads') return 'uploads';
  return 'cloudinary';
}

/** Read media upload config. Defaults to Cloudinary; opt-out: local | uploads */
export function getMediaConfig(): MediaConfig {
  const provider = parseProvider(process.env.NEXT_PUBLIC_MEDIA_PROVIDER);
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME?.trim() ?? '';
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET?.trim() ?? '';

  if (provider === 'cloudinary') {
    if (!cloudName || !uploadPreset) {
      throw new Error(
        'Cloudinary chưa cấu hình: cần NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME và NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET',
      );
    }
    return {
      provider: 'cloudinary',
      cloudinary: { cloudName, uploadPreset },
    };
  }

  if (provider === 'uploads') {
    return { provider: 'uploads' };
  }

  return { provider: 'local' };
}

/** Safe config read — returns local when Cloudinary env is incomplete */
export function getMediaConfigSafe(): MediaConfig {
  try {
    return getMediaConfig();
  } catch {
    return { provider: 'local' };
  }
}

/** Server-only: filesystem root for provider `uploads` (default `/data/uploads`) */
export function getUploadDir(): string {
  const raw = process.env.UPLOAD_DIR?.trim();
  return raw && raw.length > 0 ? raw : '/data/uploads';
}

/**
 * Public site origin for absolute upload URLs (no trailing slash).
 * Prefer request Host / forwarded headers; env is fallback only.
 * e.g. `https://anhungthinh.5fedu.com` or `http://localhost:3000`
 */
export function getAppPublicOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? '';
  return raw.replace(/\/+$/, '');
}

/** Resolve public origin from the incoming upload request (Coolify/proxy-aware). */
export function resolvePublicOriginFromHeaders(
  headers: Headers,
  requestUrl?: string,
): string {
  const originHeader = headers.get('origin')?.trim();
  if (originHeader && /^https?:\/\//i.test(originHeader)) {
    return originHeader.replace(/\/+$/, '');
  }

  const forwardedHost = headers.get('x-forwarded-host')?.split(',')[0]?.trim();
  const host = forwardedHost || headers.get('host')?.trim();
  if (host) {
    const forwardedProto = headers.get('x-forwarded-proto')?.split(',')[0]?.trim();
    let proto = forwardedProto || 'http';
    if (!forwardedProto && (host.includes('localhost') || host.startsWith('127.'))) {
      proto = 'http';
    } else if (!forwardedProto && !host.includes('localhost')) {
      proto = 'https';
    }
    return `${proto}://${host}`.replace(/\/+$/, '');
  }

  if (requestUrl) {
    try {
      return new URL(requestUrl).origin;
    } catch {
      /* ignore */
    }
  }

  return getAppPublicOrigin();
}

/** Turn `/uploads/...` into absolute URL using request origin or env fallback */
export function toPublicUploadUrl(
  relativeOrAbsolute: string,
  originOverride?: string,
): string {
  if (/^https?:\/\//i.test(relativeOrAbsolute)) return relativeOrAbsolute;
  const path = relativeOrAbsolute.startsWith('/')
    ? relativeOrAbsolute
    : `/${relativeOrAbsolute}`;
  const origin = (originOverride ?? getAppPublicOrigin()).replace(/\/+$/, '');
  return origin ? `${origin}${path}` : path;
}
