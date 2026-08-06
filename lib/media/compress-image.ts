import { CLOUDINARY_FOLDERS } from '@/lib/media/cloudinary-folders';
import type { ImageUploadContext } from '@/lib/media/types';

/** Max size when user picks a file (before compress) */
export const MEDIA_PICK_MAX_MB = 10;

/** Soft target after browser compress (prefer under this) */
export const MEDIA_COMPRESS_TARGET_BYTES = 700 * 1024;

/** Hard cap after browser compress */
export const MEDIA_COMPRESS_MAX_BYTES = 1024 * 1024;

/** Server safety limit (slightly above compress max) */
export const MEDIA_SERVER_MAX_BYTES = 2 * 1024 * 1024;

export interface CompressImageOptions {
  /** Longest edge in px (aspect ratio preserved; never upscale) */
  maxEdge?: number;
  /** Prefer staying under this size */
  targetBytes?: number;
  /** Never exceed this size when possible */
  maxBytes?: number;
  /** MIME preference */
  mimeType?: 'image/webp' | 'image/jpeg';
}

interface CompressPreset {
  maxEdge: number;
  targetBytes: number;
  maxBytes: number;
}

const DEFAULT_PRESET: CompressPreset = {
  maxEdge: 2048,
  targetBytes: MEDIA_COMPRESS_TARGET_BYTES,
  maxBytes: MEDIA_COMPRESS_MAX_BYTES,
};

const AVATAR_PRESET: CompressPreset = {
  maxEdge: 2048,
  targetBytes: MEDIA_COMPRESS_TARGET_BYTES,
  maxBytes: MEDIA_COMPRESS_MAX_BYTES,
};

const LOGO_PRESET: CompressPreset = {
  maxEdge: 2560,
  targetBytes: MEDIA_COMPRESS_TARGET_BYTES,
  maxBytes: MEDIA_COMPRESS_MAX_BYTES,
};

/** Resolve compress preset from upload folder context */
export function getCompressPreset(context?: ImageUploadContext): CompressPreset {
  const folder = context?.folder;
  if (folder === CLOUDINARY_FOLDERS.employeeAvatar) return AVATAR_PRESET;
  if (folder === CLOUDINARY_FOLDERS.companyLogo) return LOGO_PRESET;
  return DEFAULT_PRESET;
}

function loadImageBitmap(file: File): Promise<ImageBitmap> {
  return createImageBitmap(file);
}

function scaleSize(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longest = Math.max(width, height);
  if (longest <= maxEdge) {
    return { width, height };
  }
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function supportsWebp(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').startsWith('data:image/webp');
  } catch {
    return false;
  }
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), type, quality);
  });
}

async function encodeAtSize(
  source: ImageBitmap,
  width: number,
  height: number,
  type: string,
  quality: number,
): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);
  return canvasToBlob(canvas, type, quality);
}

/**
 * Find best quality in [minQ, maxQ] that stays under maxBytes.
 * Starts high for sharpness; only lowers when needed.
 */
async function encodeUnderBudget(
  source: ImageBitmap,
  width: number,
  height: number,
  type: string,
  maxBytes: number,
  targetBytes: number,
): Promise<Blob | null> {
  const highQ = 0.92;
  const lowQ = 0.8;

  let best: Blob | null = null;

  // Prefer targetBytes if achievable at decent quality
  let lo = lowQ;
  let hi = highQ;
  for (let i = 0; i < 7; i++) {
    const mid = (lo + hi) / 2;
    const blob = await encodeAtSize(source, width, height, type, mid);
    if (!blob) break;
    if (blob.size <= targetBytes) {
      best = blob;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  if (best && best.size <= maxBytes) return best;

  // Relax to maxBytes with binary search
  lo = lowQ;
  hi = highQ;
  best = null;
  for (let i = 0; i < 8; i++) {
    const mid = (lo + hi) / 2;
    const blob = await encodeAtSize(source, width, height, type, mid);
    if (!blob) break;
    if (blob.size <= maxBytes) {
      best = blob;
      lo = mid;
    } else {
      hi = mid;
    }
  }

  if (best) return best;

  // Last resort at min quality
  return encodeAtSize(source, width, height, type, lowQ);
}

const EDGE_STEPS = [2560, 2048, 1920, 1600, 1280, 1024, 800, 640] as const;

/**
 * Browser-side image compress for upload:
 * - Preserves aspect ratio (never crops, never upscales)
 * - Prefers WebP, falls back to JPEG
 * - Targets ~700KB, hard cap 1MB when possible
 * - High-quality downsample (imageSmoothingQuality high)
 */
export async function compressImageForUpload(
  file: File,
  options?: CompressImageOptions & { context?: ImageUploadContext },
): Promise<File> {
  if (typeof createImageBitmap !== 'function' || typeof document === 'undefined') {
    return file;
  }

  const preset = getCompressPreset(options?.context);
  const maxEdge = options?.maxEdge ?? preset.maxEdge;
  const targetBytes = options?.targetBytes ?? preset.targetBytes;
  const maxBytes = options?.maxBytes ?? preset.maxBytes;
  const mimeType =
    options?.mimeType ?? (supportsWebp() ? 'image/webp' : 'image/jpeg');

  let bitmap: ImageBitmap;
  try {
    bitmap = await loadImageBitmap(file);
  } catch {
    return file;
  }

  try {
    const { width: srcW, height: srcH } = bitmap;
    const alreadySmallEnough =
      file.size <= targetBytes && Math.max(srcW, srcH) <= maxEdge;
    if (alreadySmallEnough && (file.type === 'image/jpeg' || file.type === 'image/webp')) {
      return file;
    }

    const edgeCandidates = [
      maxEdge,
      ...EDGE_STEPS.filter((e) => e < maxEdge),
    ];

    let bestBlob: Blob | null = null;

    for (const edge of edgeCandidates) {
      const { width, height } = scaleSize(srcW, srcH, edge);
      const blob = await encodeUnderBudget(
        bitmap,
        width,
        height,
        mimeType,
        maxBytes,
        targetBytes,
      );
      if (!blob) continue;
      bestBlob = blob;
      if (blob.size <= maxBytes) break;
    }

    if (!bestBlob) return file;

    // If compress somehow grew the file and original already under max, keep original
    if (bestBlob.size >= file.size && file.size <= maxBytes) {
      return file;
    }

    const ext = mimeType === 'image/webp' ? 'webp' : 'jpg';
    const baseName = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([bestBlob], `${baseName}.${ext}`, {
      type: mimeType,
      lastModified: Date.now(),
    });
  } finally {
    bitmap.close();
  }
}
