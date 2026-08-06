import { afterEach, describe, expect, it, vi } from 'vitest';

describe('resolveDataSource defaults', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('uses mock in dev when DATA_SOURCE is unset', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_DATA_SOURCE', '');
    const { isMock, isApi } = await import('./config');
    expect(isMock()).toBe(true);
    expect(isApi()).toBe(false);
  });

  it('uses api in production when DATA_SOURCE is unset', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_DATA_SOURCE', '');
    const { isMock, isApi } = await import('./config');
    expect(isMock()).toBe(false);
    expect(isApi()).toBe(true);
  });

  it('honours explicit NEXT_PUBLIC_DATA_SOURCE=mock in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('NEXT_PUBLIC_DATA_SOURCE', 'mock');
    const { isMock } = await import('./config');
    expect(isMock()).toBe(true);
  });

  it('honours explicit NEXT_PUBLIC_DATA_SOURCE=api', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('NEXT_PUBLIC_DATA_SOURCE', 'api');
    const { isApi } = await import('./config');
    expect(isApi()).toBe(true);
  });
});
