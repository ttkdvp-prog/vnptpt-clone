// @vitest-environment node
/**
 * Hồi quy cho lỗ giả mạo header: trước đây `readSession` tin `x-aht-employee-id`
 * vô điều kiện, nên một request KHÔNG đăng nhập gửi kèm `x-aht-cap-bac: 1` là
 * thành super admin trên mọi module. Test này chạy qua Hono app thật.
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';

// hono-app.ts import `prisma` trực tiếp cho route /health, nên phải mock trước
// khi import app — nếu không PrismaClient được khởi tạo và cần DATABASE_URL.
vi.mock('@/server/db', () => ({
  prisma: {},
  sql: {},
  assertPrismaModel: () => {},
}));

// Hai ca "được nhận" đi qua requireAuth rồi tới repository; mock đúng hàm mà
// GET /nhan-vien cần để test khẳng định 200 thay vì chỉ "không phải 401".
vi.mock('@/server/repositories/nhan-vien', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/repositories/nhan-vien')>()),
  findEmployeesPage: vi.fn(async () => ({ items: [], total: 0 })),
}));

const TEST_SECRET = 'test-secret-for-header-spoof';

let createHonoApp: typeof import('@/server/hono-app').createHonoApp;
let computeInternalProof: typeof import('@/server/internal-headers').computeInternalProof;
let INTERNAL_PROOF_HEADER: string;
let signSessionToken: typeof import('@/server/auth').signSessionToken;

beforeAll(async () => {
  // getSecret()/readSecret() đọc process.env lúc gọi, không phải lúc load module.
  process.env.AUTH_SECRET = TEST_SECRET;
  ({ createHonoApp } = await import('@/server/hono-app'));
  ({ computeInternalProof, INTERNAL_PROOF_HEADER } = await import(
    '@/server/internal-headers'
  ));
  ({ signSessionToken } = await import('@/server/auth'));
});

function request(path: string, headers: Record<string, string>) {
  const app = createHonoApp();
  return app.fetch(new Request(`http://localhost${path}`, { method: 'GET', headers }));
}

describe('giả mạo header x-aht-* (không đăng nhập)', () => {
  it('KHÔNG cho qua khi chỉ có header giả — đây là lỗ đã vá', async () => {
    const res = await request('/nhan-vien', {
      'x-aht-employee-id': '1',
      'x-aht-tai-khoan': 'attacker',
      'x-aht-cap-bac': '1',
    });
    expect(res.status).toBe(401);
  });

  it('KHÔNG cho qua khi header giả kèm proof đoán bừa', async () => {
    const res = await request('/nhan-vien', {
      'x-aht-employee-id': '1',
      'x-aht-cap-bac': '1',
      [INTERNAL_PROOF_HEADER]: 'deadbeef'.repeat(8),
    });
    expect(res.status).toBe(401);
  });

  it('không có gì cả → 401', async () => {
    const res = await request('/nhan-vien', {});
    expect(res.status).toBe(401);
  });

  it('nhánh header hợp lệ (có proof) vẫn được nhận — không vỡ đường thật', async () => {
    const proof = computeInternalProof();
    expect(proof).toBeTruthy();
    const res = await request('/nhan-vien', {
      'x-aht-employee-id': '1',
      'x-aht-tai-khoan': 'admin',
      'x-aht-cap-bac': '1',
      [INTERNAL_PROOF_HEADER]: proof as string,
    });
    expect(res.status).toBe(200);
  });

  it('cookie phiên có chữ ký hợp lệ vẫn được nhận — không vỡ đường Bearer/cookie', async () => {
    const token = await signSessionToken({
      employee_id: '1',
    });
    const res = await request('/nhan-vien', { Cookie: `aht_session=${token}` });
    expect(res.status).toBe(200);
  });
});
