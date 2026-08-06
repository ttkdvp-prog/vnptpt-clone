import { afterEach, describe, expect, it, vi } from 'vitest';

describe('getMediaConfig defaults', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('defaults to cloudinary when NEXT_PUBLIC_MEDIA_PROVIDER is unset', async () => {
    vi.stubEnv('NEXT_PUBLIC_MEDIA_PROVIDER', '');
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME', 'demo');
    vi.stubEnv('NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET', 'unsigned');
    const { getMediaConfig } = await import('./config');
    expect(getMediaConfig().provider).toBe('cloudinary');
  });

  it('allows local opt-out via NEXT_PUBLIC_MEDIA_PROVIDER=local', async () => {
    vi.stubEnv('NEXT_PUBLIC_MEDIA_PROVIDER', 'local');
    const { getMediaConfig } = await import('./config');
    expect(getMediaConfig().provider).toBe('local');
  });

  it('allows uploads provider via NEXT_PUBLIC_MEDIA_PROVIDER=uploads', async () => {
    vi.stubEnv('NEXT_PUBLIC_MEDIA_PROVIDER', 'uploads');
    const { getMediaConfig, getUploadDir } = await import('./config');
    expect(getMediaConfig().provider).toBe('uploads');
    expect(getUploadDir()).toBe('/data/uploads');
  });

  it('reads UPLOAD_DIR when set', async () => {
    vi.stubEnv('NEXT_PUBLIC_MEDIA_PROVIDER', 'uploads');
    vi.stubEnv('UPLOAD_DIR', '/var/app/uploads');
    const { getUploadDir } = await import('./config');
    expect(getUploadDir()).toBe('/var/app/uploads');
  });
});
