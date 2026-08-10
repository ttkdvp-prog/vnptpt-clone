import { getApiBaseUrl, getStoredApiToken, ApiError } from '@/lib/api/client';
import type { ImageUploadContext, ImageUploadResult } from '@/lib/media/types';

interface UploadsApiResponse {
  url?: string;
  error?: string;
}

/** Upload image to self-hosted `/uploads` API (VPS disk). */
export async function uploadImageToServer(
  file: File,
  context?: ImageUploadContext,
): Promise<ImageUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  if (context?.folder) {
    formData.append('folder', context.folder);
  }

  const headers = new Headers();
  const token = getStoredApiToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${getApiBaseUrl()}/uploads`, {
    method: 'POST',
    body: formData,
    headers,
    credentials: 'include',
  });

  let data: UploadsApiResponse = {};
  try {
    data = (await res.json()) as UploadsApiResponse;
  } catch {
    /* ignore */
  }

  if (!res.ok || !data.url) {
    throw new ApiError(data.error ?? `Upload failed (${res.status})`, res.status);
  }

  return { url: data.url };
}

/** Upload PDF to self-hosted `/uploads/document` API (Google Drive). */
export async function uploadDocumentToServer(
  file: File,
  context?: ImageUploadContext,
): Promise<ImageUploadResult> {
  const formData = new FormData();
  formData.append('file', file);
  if (context?.folder) {
    formData.append('folder', context.folder);
  }

  const headers = new Headers();
  const token = getStoredApiToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const res = await fetch(`${getApiBaseUrl()}/uploads/document`, {
    method: 'POST',
    body: formData,
    headers,
    credentials: 'include',
  });

  let data: UploadsApiResponse = {};
  try {
    data = (await res.json()) as UploadsApiResponse;
  } catch {
    /* ignore */
  }

  if (!res.ok || !data.url) {
    throw new ApiError(data.error ?? `Upload failed (${res.status})`, res.status);
  }

  return { url: data.url };
}
