import { getMediaConfigSafe } from './config';
import { uploadDocumentCloudinary } from './providers/cloudinary-provider';
import { uploadImageLocal } from './providers/local-provider';
import { uploadDocumentToServer } from './providers/uploads-provider';
import type { ImageUploadContext, ImageUploadResult, MediaProviderId } from './types';

export interface UploadDocumentOptions {
  context?: ImageUploadContext;
  /** Override provider from env */
  provider?: MediaProviderId;
}

/**
 * Upload a non-image file (PDF...) via configured provider.
 * - local: base64 data URL (dev/mock)
 * - uploads: server route `/uploads/document` → Google Drive (`lib/storage/drive.ts`)
 * - cloudinary: `resource_type=raw` upload — không phụ thuộc quota Google Drive của
 *   service account, ưu tiên dùng khi provider `uploads` gặp lỗi storageQuotaExceeded.
 */
export async function uploadDocument(
  file: File,
  options?: UploadDocumentOptions,
): Promise<ImageUploadResult> {
  const config = getMediaConfigSafe();
  const provider = options?.provider ?? config.provider;

  if (provider === 'cloudinary') {
    return uploadDocumentCloudinary(file, options?.context);
  }

  if (provider === 'uploads') {
    return uploadDocumentToServer(file, options?.context);
  }

  return uploadImageLocal(file);
}
