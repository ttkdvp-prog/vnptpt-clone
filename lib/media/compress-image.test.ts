import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getCompressPreset,
  MEDIA_COMPRESS_MAX_BYTES,
  MEDIA_COMPRESS_TARGET_BYTES,
  MEDIA_PICK_MAX_MB,
} from './compress-image';
import { CLOUDINARY_FOLDERS } from './cloudinary-folders';

describe('compress-image presets', () => {
  it('exposes 10MB pick limit and ~700KB–1MB compress budget', () => {
    expect(MEDIA_PICK_MAX_MB).toBe(10);
    expect(MEDIA_COMPRESS_TARGET_BYTES).toBe(700 * 1024);
    expect(MEDIA_COMPRESS_MAX_BYTES).toBe(1024 * 1024);
  });

  it('uses 2048 max edge for avatar', () => {
    const preset = getCompressPreset({ folder: CLOUDINARY_FOLDERS.employeeAvatar });
    expect(preset.maxEdge).toBe(2048);
    expect(preset.maxBytes).toBe(MEDIA_COMPRESS_MAX_BYTES);
  });

  it('uses 2560 max edge for company logo', () => {
    const preset = getCompressPreset({ folder: CLOUDINARY_FOLDERS.companyLogo });
    expect(preset.maxEdge).toBe(2560);
  });

  it('defaults for general uploads', () => {
    const preset = getCompressPreset();
    expect(preset.maxEdge).toBe(2048);
    expect(preset.targetBytes).toBe(MEDIA_COMPRESS_TARGET_BYTES);
  });
});

describe('toPublicUploadUrl / resolvePublicOriginFromHeaders', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('returns absolute URL when NEXT_PUBLIC_APP_URL is set', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'https://anhungthinh.5fedu.com');
    const { toPublicUploadUrl } = await import('./config');
    expect(toPublicUploadUrl('/uploads/a.webp')).toBe(
      'https://anhungthinh.5fedu.com/uploads/a.webp',
    );
  });

  it('keeps relative path when origin unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    const { toPublicUploadUrl } = await import('./config');
    expect(toPublicUploadUrl('/uploads/a.webp')).toBe('/uploads/a.webp');
  });

  it('prefers Origin header from the browser request', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', 'http://localhost:3000');
    const { resolvePublicOriginFromHeaders, toPublicUploadUrl } = await import('./config');
    const headers = new Headers({
      origin: 'https://anhungthinh.5fedu.com',
    });
    const origin = resolvePublicOriginFromHeaders(headers);
    expect(toPublicUploadUrl('/uploads/a.webp', origin)).toBe(
      'https://anhungthinh.5fedu.com/uploads/a.webp',
    );
  });

  it('uses x-forwarded-host behind reverse proxy', async () => {
    vi.stubEnv('NEXT_PUBLIC_APP_URL', '');
    const { resolvePublicOriginFromHeaders } = await import('./config');
    const headers = new Headers({
      'x-forwarded-host': 'anhungthinh.5fedu.com',
      'x-forwarded-proto': 'https',
    });
    expect(resolvePublicOriginFromHeaders(headers)).toBe('https://anhungthinh.5fedu.com');
  });
});
