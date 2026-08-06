import { describe, expect, it } from 'vitest';
import {
  REMEMBER_SESSION_MAX_AGE,
  SHORT_SESSION_MAX_AGE,
  isSessionTokenCookieName,
  parseRememberFlag,
  resolveSessionMaxAge,
} from '@/lib/employee-auth/session-lifetime';

describe('resolveSessionMaxAge', () => {
  it('gives the long lifetime when remembered', () => {
    expect(resolveSessionMaxAge(true)).toBe(REMEMBER_SESSION_MAX_AGE);
    expect(REMEMBER_SESSION_MAX_AGE).toBe(60 * 60 * 24 * 30);
  });

  it('shortens the lifetime when not remembered', () => {
    expect(resolveSessionMaxAge(false)).toBe(SHORT_SESSION_MAX_AGE);
    expect(SHORT_SESSION_MAX_AGE).toBeLessThan(REMEMBER_SESSION_MAX_AGE);
  });

  it('defaults to remembered when the flag is missing', () => {
    expect(resolveSessionMaxAge(undefined)).toBe(REMEMBER_SESSION_MAX_AGE);
    expect(resolveSessionMaxAge(null)).toBe(REMEMBER_SESSION_MAX_AGE);
  });
});

describe('parseRememberFlag', () => {
  it('reads the string form Auth.js passes through credentials', () => {
    expect(parseRememberFlag('false')).toBe(false);
    expect(parseRememberFlag('true')).toBe(true);
  });

  it('passes booleans through', () => {
    expect(parseRememberFlag(false)).toBe(false);
    expect(parseRememberFlag(true)).toBe(true);
  });

  it('defaults to true for missing or unexpected values', () => {
    expect(parseRememberFlag(undefined)).toBe(true);
    expect(parseRememberFlag(null)).toBe(true);
    expect(parseRememberFlag('')).toBe(true);
  });
});

describe('isSessionTokenCookieName', () => {
  it('matches the plain and secure session cookies', () => {
    expect(isSessionTokenCookieName('authjs.session-token')).toBe(true);
    expect(isSessionTokenCookieName('__Secure-authjs.session-token')).toBe(true);
  });

  it('matches chunked session cookies', () => {
    expect(isSessionTokenCookieName('authjs.session-token.0')).toBe(true);
    expect(isSessionTokenCookieName('__Secure-authjs.session-token.12')).toBe(true);
  });

  it('ignores other auth cookies', () => {
    expect(isSessionTokenCookieName('authjs.csrf-token')).toBe(false);
    expect(isSessionTokenCookieName('authjs.callback-url')).toBe(false);
    expect(isSessionTokenCookieName('authjs.session-token-evil')).toBe(false);
    expect(isSessionTokenCookieName('my-authjs.session-token')).toBe(false);
  });
});
