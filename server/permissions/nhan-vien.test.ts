import { describe, expect, it } from 'vitest';
import { assertNhanVienPermission } from '@/server/permissions/nhan-vien';

function mockContext(session: { employee_id: string } | undefined) {
  return {
    get: (key: string) => (key === 'session' ? session : undefined),
    json: (body: unknown, status?: number) => ({ body, status: status ?? 200 }),
  } as never;
}

describe('assertNhanVienPermission', () => {
  it('allows any authenticated session (không còn chức vụ/cấp bậc để tra quyền)', async () => {
    const c = mockContext({ employee_id: '1' });
    expect(await assertNhanVienPermission(c, 'xoa')).toBeNull();
    expect(await assertNhanVienPermission(c, 'them')).toBeNull();
    expect(await assertNhanVienPermission(c, 'sua')).toBeNull();
  });

  it('denies when unauthenticated', async () => {
    const c = mockContext(undefined);
    const denied = await assertNhanVienPermission(c, 'xem');
    expect(denied).toBeTruthy();
    expect((denied as { status: number }).status).toBe(401);
  });
});
