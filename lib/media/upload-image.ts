import { getMediaConfigSafe } from './config';
import { compressImageForUpload } from './compress-image';
import { uploadImageCloudinary } from './providers/cloudinary-provider';
import { uploadImageLocal } from './providers/local-provider';
import { uploadImageToServer } from './providers/uploads-provider';
import type { ImageUploadContext, ImageUploadResult, MediaProviderId } from './types';

export interface UploadImageOptions {
  context?: ImageUploadContext;
  /** Override provider from env */
  provider?: MediaProviderId;
  /** Skip browser compress (tests / special cases) */
  skipCompress?: boolean;
}

/**
 * Upload an image via configured provider.
 * Always compresses in the browser first (aspect ratio preserved, ~700KB–1MB)
 * unless `skipCompress` is set.
 * - local: base64 data URL (dev/mock)
 * - uploads: public URL `/uploads/...` or absolute via NEXT_PUBLIC_APP_URL
 * - cloudinary: HTTPS URL from Cloudinary CDN
 */
export async function uploadImage(
  file: File,
  options?: UploadImageOptions,
): Promise<ImageUploadResult> {
  const config = getMediaConfigSafe();
  const provider = options?.provider ?? config.provider;

  const prepared = options?.skipCompress
    ? file
    : await compressImageForUpload(file, { context: options?.context });

  if (provider === 'cloudinary') {
    return uploadImageCloudinary(prepared, options?.context);
  }

  if (provider === 'uploads') {
    return uploadImageToServer(prepared, options?.context);
  }

  return uploadImageLocal(prepared);
}
