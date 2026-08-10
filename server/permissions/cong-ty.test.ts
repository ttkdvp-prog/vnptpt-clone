import { describe, expect, it } from 'vitest';
import { assertCongTyPermission } from '@/server/permissions/cong-ty';

function mockContext(session: { employee_id: string } | undefined) {
  return {
    get: (key: string) => (key === 'session' ? session : undefined),
    json: (body: unknown, status?: number) =>
      new Response(JSON.stringify(body), { status: status ?? 200 }),
  } as never;
}

describe('assertCongTyPermission', () => {
  it('allows any authenticated session (không còn chức vụ/cấp bậc để tra quyền)', async () => {
    const c = mockContext({ employee_id: '1' });
    expect(await assertCongTyPermission(c, 'sua')).toBeNull();
    expect(await assertCongTyPermission(c, 'xem')).toBeNull();
  });

  it('denies when unauthenticated', async () => {
    const c = mockContext(undefined);
    const denied = await assertCongTyPermission(c, 'xem');
    expect(denied).toBeTruthy();
    expect((denied as { status: number }).status).toBe(401);
  });
});
