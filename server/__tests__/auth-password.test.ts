// @vitest-environment node
/**
 * Hồi quy Phase 2: hồi sinh luồng buộc đổi mật khẩu (V4) + chặn /auth/set-password
 * khi không ở trạng thái buộc đổi (V6).
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

vi.mock('@/server/db', () => ({
  prisma: {},
  sql: {},
  assertPrismaModel: () => {},
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(async (pw: string) => `hashed:${pw}`),
    compare: vi.fn(async (plain: string, hash: string) => hash === `hashed:${plain}`),
  },
}));

vi.mock('@/server/repositories/nhan-vien', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/repositories/nhan-vien')>()),
  findEmployeeAuthById: vi.fn(),
  findEmployeePasswordHash: vi.fn(),
  updateEmployeePassword: vi.fn(),
}));

const TEST_SECRET = 'test-secret-for-auth-password';
const EMPLOYEE_ID = 5;

let createHonoApp: typeof import('@/server/hono-app').createHonoApp;
let signSessionToken: typeof import('@/server/auth').signSessionToken;
let repo: typeof import('@/server/repositories/nhan-vien');

beforeAll(async () => {
  process.env.AUTH_SECRET = TEST_SECRET;
  ({ createHonoApp } = await import('@/server/hono-app'));
  ({ signSessionToken } = await import('@/server/auth'));
  repo = await import('@/server/repositories/nhan-vien');
});

async function request(method: string, path: string, body?: unknown) {
  const token = await signSessionToken({
    employee_id: String(EMPLOYEE_ID),
    tai_khoan: 'nguyenvana',
    cap_bac: 4,
  });
  const app = createHonoApp();
  return app.fetch(
    new Request(`http://localhost${path}`, {
      method,
      headers: { Cookie: `aht_session=${token}`, 'Content-Type': 'application/json' },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  );
}

const post = (path: string, body: unknown) => request('POST', path, body);
const get = (path: string) => request('GET', path);

beforeEach(() => {
  vi.clearAllMocks();
});

describe('V4 — must_change_password đọc từ DB, không hardcode', () => {
  it('/auth/me trả đúng giá trị true từ DB (không còn hardcode false)', async () => {
    vi.mocked(repo.findEmployeeAuthById).mockResolvedValue({
      id: EMPLOYEE_ID,
      ho_ten: 'Nguyễn Văn A',
      tai_khoan: 'nguyenvana',
      must_change_password: true,
      tai_khoan_dang_hoat_dong: true,
      trang_thai: 'ACTIVE',
    } as unknown as Awaited<ReturnType<typeof repo.findEmployeeAuthById>>);

    const res = await get('/auth/me');
    expect(res.status).toBe(200);
    const json = (await res.json()) as { user: { must_change_password: boolean } };
    expect(json.user.must_change_password).toBe(true);
  });

  it('/auth/me trả false khi DB false — không phải luôn true theo mặc định mới', async () => {
    vi.mocked(repo.findEmployeeAuthById).mockResolvedValue({
      id: EMPLOYEE_ID,
      ho_ten: 'Nguyễn Văn A',
      tai_khoan: 'nguyenvana',
      must_change_password: false,
      tai_khoan_dang_hoat_dong: true,
      trang_thai: 'ACTIVE',
    } as unknown as Awaited<ReturnType<typeof repo.findEmployeeAuthById>>);

    const res = await get('/auth/me');
    const json = (await res.json()) as { user: { must_change_password: boolean } };
    expect(json.user.must_change_password).toBe(false);
  });
});

describe('V6 — /auth/set-password chỉ dùng được khi đang buộc đổi', () => {
  it('must_change_password=false trong DB ⇒ 403, không ghi mật khẩu', async () => {
    vi.mocked(repo.findEmployeeAuthById).mockResolvedValue({
      id: EMPLOYEE_ID,
      must_change_password: false,
    } as unknown as Awaited<ReturnType<typeof repo.findEmployeeAuthById>>);

    const res = await post('/auth/set-password', { new_password: 'abc123' });
    expect(res.status).toBe(403);
    expect(repo.updateEmployeePassword).not.toHaveBeenCalled();
  });

  it('must_change_password=true trong DB ⇒ 200, ghi mật khẩu mới', async () => {
    vi.mocked(repo.findEmployeeAuthById).mockResolvedValue({
      id: EMPLOYEE_ID,
      must_change_password: true,
    } as unknown as Awaited<ReturnType<typeof repo.findEmployeeAuthById>>);

    const res = await post('/auth/set-password', { new_password: 'abc123' });
    expect(res.status).toBe(200);
    expect(repo.updateEmployeePassword).toHaveBeenCalledWith(EMPLOYEE_ID, 'hashed:abc123');
  });

  it('tài khoản không tồn tại ⇒ 401', async () => {
    vi.mocked(repo.findEmployeeAuthById).mockResolvedValue(null);
    const res = await post('/auth/set-password', { new_password: 'abc123' });
    expect(res.status).toBe(401);
  });

  it('mật khẩu ngắn hơn 6 ký tự ⇒ 400 trước khi đọc DB', async () => {
    const res = await post('/auth/set-password', { new_password: '123' });
    expect(res.status).toBe(400);
    expect(repo.findEmployeeAuthById).not.toHaveBeenCalled();
  });
});

describe('/auth/change-password vẫn hoạt động bình thường (không đổi hành vi)', () => {
  it('mật khẩu hiện tại đúng ⇒ 200, xoá cờ buộc đổi qua updateEmployeePassword', async () => {
    vi.mocked(repo.findEmployeePasswordHash).mockResolvedValue({
      id: EMPLOYEE_ID,
      mat_khau: 'hashed:matkhaucu',
    });
    const res = await post('/auth/change-password', {
      current_password: 'matkhaucu',
      new_password: 'matkhaumoi',
    });
    expect(res.status).toBe(200);
    expect(repo.updateEmployeePassword).toHaveBeenCalledWith(EMPLOYEE_ID, 'hashed:matkhaumoi');
  });

  it('mật khẩu hiện tại sai ⇒ 401, không ghi', async () => {
    vi.mocked(repo.findEmployeePasswordHash).mockResolvedValue({
      id: EMPLOYEE_ID,
      mat_khau: 'hashed:matkhaucu',
    });
    const res = await post('/auth/change-password', {
      current_password: 'sai',
      new_password: 'matkhaumoi',
    });
    expect(res.status).toBe(401);
    expect(repo.updateEmployeePassword).not.toHaveBeenCalled();
  });
});
