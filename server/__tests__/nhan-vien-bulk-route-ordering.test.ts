// @vitest-environment node
/**
 * `/status/bulk` và `/bulk` phải được Hono match TRƯỚC `/:id` — nếu route
 * đăng ký sai thứ tự, Hono sẽ khớp `/:id` với `id='status'`/`id='bulk'` và
 * request rơi vào nhánh `Number.isFinite(id)` → 400 "Invalid id" thay vì chạy
 * đúng handler bulk. Hiện chỉ có comment bảo vệ trong code, không có test —
 * test này khoá lại bằng cách phân biệt response shape của 2 nhánh.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

vi.mock('@/server/db', () => ({
  prisma: {},
  sql: {},
  assertPrismaModel: () => {},
}));

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn(async () => '$2a$10$stubhash'), compare: vi.fn(async () => true) },
}));

vi.mock('@/server/repositories/nhan-vien', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/repositories/nhan-vien')>()),
  updateEmployeeStatusMany: vi.fn(async () => []),
  deleteEmployeesMany: vi.fn(async () => 0),
  findEmployeeChucVuId: vi.fn(),
}));

vi.mock('@/server/repositories/phan-quyen', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/repositories/phan-quyen')>()),
  findQuyenCsvByChucVuAndModule: vi.fn(),
}));

const SELF_ID = 7;

let createHonoApp: typeof import('@/server/hono-app').createHonoApp;
let signSessionToken: typeof import('@/server/auth').signSessionToken;
let repo: typeof import('@/server/repositories/nhan-vien');
let phanQuyen: typeof import('@/server/repositories/phan-quyen');

beforeAll(async () => {
  process.env.AUTH_SECRET = 'test-secret-route-ordering';
  ({ createHonoApp } = await import('@/server/hono-app'));
  ({ signSessionToken } = await import('@/server/auth'));
  repo = await import('@/server/repositories/nhan-vien');
  phanQuyen = await import('@/server/repositories/phan-quyen');
});

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(repo.findEmployeeChucVuId).mockResolvedValue(10);
  vi.mocked(phanQuyen.findQuyenCsvByChucVuAndModule).mockResolvedValue('admin');
});

async function call(path: string, method: string, body: unknown) {
  const token = await signSessionToken({
    employee_id: String(SELF_ID),
    tai_khoan: 'nguyenvana',
    cap_bac: 4,
  });
  const app = createHonoApp();
  return app.fetch(
    new Request(`http://localhost${path}`, {
      method,
      headers: { Cookie: `aht_session=${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
}

describe('route-ordering: /nhan-vien/status/bulk và /nhan-vien/bulk khớp trước /:id', () => {
  it('PATCH /nhan-vien/status/bulk với ids hợp lệ ⇒ chạy handler bulk (200, {items,total}), không phải 400 "Invalid id"', async () => {
    const res = await call('/nhan-vien/status/bulk', 'PATCH', {
      ids: [1, 2],
      trang_thai: 'Đang làm việc',
    });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toHaveProperty('items');
    expect(json).toHaveProperty('total');
    expect(repo.updateEmployeeStatusMany).toHaveBeenCalledWith([1, 2], 'Đang làm việc');
  });

  it('DELETE /nhan-vien/bulk với ids hợp lệ ⇒ chạy handler bulk (200, {ok,count}), không phải 400 "Invalid id"', async () => {
    vi.mocked(repo.deleteEmployeesMany).mockResolvedValue(2);
    const res = await call('/nhan-vien/bulk', 'DELETE', { ids: [1, 2] });
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json).toEqual({ ok: true, count: 2 });
    expect(repo.deleteEmployeesMany).toHaveBeenCalledWith([1, 2]);
  });
});
