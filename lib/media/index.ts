export type {
  ImageUploadContext,
  ImageUploadResult,
  MediaConfig,
  MediaProviderId,
} from './types';
export { getMediaConfig, getMediaConfigSafe, getUploadDir, getAppPublicOrigin, resolvePublicOriginFromHeaders, toPublicUploadUrl } from './config';
export { uploadImage, type UploadImageOptions } from './upload-image';
export { CLOUDINARY_FOLDERS } from './cloudinary-folders';
export {
  compressImageForUpload,
  getCompressPreset,
  MEDIA_PICK_MAX_MB,
  MEDIA_COMPRESS_TARGET_BYTES,
  MEDIA_COMPRESS_MAX_BYTES,
  MEDIA_SERVER_MAX_BYTES,
  type CompressImageOptions,
} from './compress-image';
export {
  getOptimizedImageUrl,
  isDataUrl,
  isHttpImageUrl,
  isUploadsPath,
  isValidImageSource,
  type OptimizeImageOptions,
} from './image-url';
/** Client-only: import from `@/lib/media/use-image-upload` — do not re-export here (App Routes / RSC). */