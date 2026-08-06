// @vitest-environment node
// `jose` kiểm tra `instanceof Uint8Array`; global của jsdom khác realm với Node nên
// phải chạy file này ở environment node.
import { describe, expect, it } from 'vitest';
import { decode, encode } from 'next-auth/jwt';
import {
  REMEMBER_SESSION_MAX_AGE,
  SHORT_SESSION_MAX_AGE,
  resolveSessionMaxAge,
} from '@/lib/employee-auth/session-lifetime';

/**
 * `auth.ts` override `jwt.encode` để đặt hạn phiên theo từng lần đăng nhập. Cách đó
 * chỉ đúng nếu `encode` lấy exp từ tham số `maxAge` truyền vào chứ không từ config
 * tĩnh — test này chốt giả định đó, để nâng cấp next-auth mà đổi hành vi thì biết ngay.
 */
describe('jwt encode honours a per-call maxAge', () => {
  const secret = 'test-secret-at-least-32-characters-long!!';
  const salt = 'authjs.session-token';

  async function expOf(remember: boolean): Promise<number> {
    const token = await encode({
      token: { sub: '1', remember },
      secret,
      salt,
      maxAge: resolveSessionMaxAge(remember),
    });
    const decoded = await decode({ token, secret, salt });
    return decoded?.exp ?? 0;
  }

  it('expires a not-remembered session far sooner than a remembered one', async () => {
    const now = Math.floor(Date.now() / 1000);
    const shortExp = await expOf(false);
    const longExp = await expOf(true);

    expect(shortExp - now).toBeGreaterThan(SHORT_SESSION_MAX_AGE - 60);
    expect(shortExp - now).toBeLessThanOrEqual(SHORT_SESSION_MAX_AGE + 60);
    expect(longExp - now).toBeGreaterThan(REMEMBER_SESSION_MAX_AGE - 60);
    expect(longExp).toBeGreaterThan(shortExp);
  });
});
