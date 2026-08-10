import { describe, expect, it } from 'vitest';
import { sanitizeQuyenCsv } from '@/server/repositories/phan-quyen';
import { assertPhanQuyenPermission } from '@/server/permissions/phan-quyen';

function mockContext(session: { employee_id: string } | undefined) {
  return {
    get: (key: string) => (key === 'session' ? session : undefined),
    json: (body: unknown, status?: number) =>
      new Response(JSON.stringify(body), { status: status ?? 200 }),
  } as never;
}

describe('assertPhanQuyenPermission', () => {
  it('allows any authenticated session (không còn chức vụ/cấp bậc để tra quyền)', async () => {
    const c = mockContext({ employee_id: '2' });
    expect(await assertPhanQuyenPermission(c, 'sua')).toBeNull();
    expect(await assertPhanQuyenPermission(c, 'xem')).toBeNull();
  });

  it('denies when unauthenticated', async () => {
    const c = mockContext(undefined);
    const denied = await assertPhanQuyenPermission(c, 'xem');
    expect(denied).toBeTruthy();
    expect((denied as { status: number }).status).toBe(401);
  });
});

describe('sanitizeQuyenCsv', () => {
  it('strips admin tokens when stripAdmin', () => {
    expect(sanitizeQuyenCsv('xem,admin,tat_ca', { stripAdmin: true })).toBe('xem');
  });

  it('keeps admin when not stripping', () => {
    expect(sanitizeQuyenCsv('xem,admin')).toBe('xem,admin');
  });
});
