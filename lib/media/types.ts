/** Media storage provider identifier */
export type MediaProviderId = 'local' | 'cloudinary' | 'uploads';

/** Context passed when uploading an image (folder/tags) */
export interface ImageUploadContext {
  /** Storage folder, e.g. `5f/company/logo` (Cloudinary or VPS disk) */
  folder?: string;
  /** Optional tags for Cloudinary asset management */
  tags?: string[];
}

/** Result of a successful image upload */
export interface ImageUploadResult {
  url: string;
  publicId?: string;
  width?: number;
  height?: number;
}

export interface MediaConfig {
  provider: MediaProviderId;
  cloudinary?: {
    cloudName: string;
    uploadPreset: string;
  };
}
