const DATA_URL_RE = /^data:image\//i;
const HTTP_URL_RE = /^https?:\/\//i;
const UPLOADS_PATH_RE = /^\/uploads\//;
const CLOUDINARY_URL_RE = /res\.cloudinary\.com/i;

export interface OptimizeImageOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'thumb';
  quality?: 'auto' | number;
  /** Cloudinary delivery format, e.g. `png` for PWA icons. */
  format?: 'png' | 'webp' | 'jpg' | 'auto';
}

/** Whether value is a base64 data URL */
export function isDataUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  return DATA_URL_RE.test(value);
}

/** Whether value is an http(s) URL */
export function isHttpImageUrl(value: string | null | undefined): boolean {
  if (!value) return false;
  return HTTP_URL_RE.test(value);
}

/** Whether value is a same-origin self-hosted upload path (`/uploads/...`) */
export function isUploadsPath(value: string | null | undefined): boolean {
  if (!value) return false;
  return UPLOADS_PATH_RE.test(value);
}

/** Accept data URL, http(s) URL, or `/uploads/...` path for form validation */
export function isValidImageSource(value: string | null | undefined): boolean {
  if (!value) return true;
  return isDataUrl(value) || isHttpImageUrl(value) || isUploadsPath(value);
}

function isCloudinaryUrl(url: string): boolean {
  return CLOUDINARY_URL_RE.test(url);
}

/**
 * Return optimized delivery URL when source is Cloudinary.
 * Non-Cloudinary URLs are returned unchanged.
 */
export function getOptimizedImageUrl(
  url: string,
  options: OptimizeImageOptions = {},
): string {
  if (!isCloudinaryUrl(url)) return url;

  const uploadSegment = '/upload/';
  const idx = url.indexOf(uploadSegment);
  if (idx === -1) return url;

  const transforms: string[] = [];
  if (options.crop) transforms.push(`c_${options.crop}`);
  if (options.width) transforms.push(`w_${options.width}`);
  if (options.height) transforms.push(`h_${options.height}`);
  if (options.quality !== undefined) {
    transforms.push(
      typeof options.quality === 'number' ? `q_${options.quality}` : 'q_auto',
    );
  }
  if (options.format) transforms.push(`f_${options.format}`);
  if (transforms.length === 0) return url;

  const transformStr = transforms.join(',');
  const prefix = url.slice(0, idx + uploadSegment.length);
  const suffix = url.slice(idx + uploadSegment.length);
  return `${prefix}${transformStr}/${suffix}`;
}
