import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AUTH_REMEMBER_KEY,
  AUTH_STORAGE_KEY,
} from '@/lib/employee-auth/session-lifetime';
import type { User } from '@/types';

const testUser: User = {
  id: 'api-1',
  employee_id: '1',
  email: 'testuser@local',
  full_name: 'testuser',
  role: 'user',
  created_at: '2026-01-01T00:00:00.000Z',
};

/** Fresh module graph: zustand persist binds its store once per module load. */
async function loadStore() {
  vi.resetModules();
  return import('@/store/useStore');
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

afterEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('isAuthRemembered', () => {
  it('defaults to remembered when the user has never chosen', async () => {
    const { isAuthRemembered } = await loadStore();
    expect(isAuthRemembered()).toBe(true);
  });

  it('reads the stored choice', async () => {
    const { isAuthRemembered } = await loadStore();
    localStorage.setItem(AUTH_REMEMBER_KEY, 'false');
    expect(isAuthRemembered()).toBe(false);
    localStorage.setItem(AUTH_REMEMBER_KEY, 'true');
    expect(isAuthRemembered()).toBe(true);
  });
});

describe('setAuthRemember', () => {
  it('clears the leftover profile in localStorage when switching to not-remembered', async () => {
    const { setAuthRemember } = await loadStore();
    localStorage.setItem(AUTH_STORAGE_KEY, '{"state":{"user":{"id":"old"}},"version":2}');

    setAuthRemember(false);

    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(AUTH_REMEMBER_KEY)).toBe('false');
  });

  it('clears the sessionStorage copy when switching back to remembered', async () => {
    const { setAuthRemember } = await loadStore();
    sessionStorage.setItem(AUTH_STORAGE_KEY, '{"state":{"user":{"id":"old"}},"version":2}');

    setAuthRemember(true);

    expect(sessionStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(localStorage.getItem(AUTH_REMEMBER_KEY)).toBe('true');
  });
});

describe('auth persist storage follows the current choice', () => {
  it('persists to localStorage when remembered', async () => {
    const { setAuthRemember, useAuthStore } = await loadStore();
    setAuthRemember(true);

    useAuthStore.getState().login(testUser);

    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toContain('testuser');
    expect(sessionStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  it('persists to sessionStorage when not remembered', async () => {
    const { setAuthRemember, useAuthStore } = await loadStore();
    setAuthRemember(false);

    useAuthStore.getState().login(testUser);

    expect(sessionStorage.getItem(AUTH_STORAGE_KEY)).toContain('testuser');
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  /** The bug this guards: the adapter used to bind to one storage at module load. */
  it('switches target without a page reload', async () => {
    const { setAuthRemember, useAuthStore } = await loadStore();

    // Module loaded with the default (remembered) → localStorage.
    useAuthStore.getState().login(testUser);
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toContain('testuser');

    // User unticks on the login form, no reload happens (SPA navigation).
    setAuthRemember(false);
    useAuthStore.getState().login(testUser);

    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
    expect(sessionStorage.getItem(AUTH_STORAGE_KEY)).toContain('testuser');
  });

  it('does not read the stale localStorage copy when not remembered', async () => {
    localStorage.setItem(AUTH_REMEMBER_KEY, 'false');
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ state: { user: testUser, isAuthenticated: true }, version: 2 }),
    );

    const { useAuthStore } = await loadStore();
    await useAuthStore.persist.rehydrate();

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
  });
});
