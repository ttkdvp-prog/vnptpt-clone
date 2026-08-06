// @vitest-environment node
/**
 * Hồi quy phân quyền theo trường cho `PATCH /nhan-vien/:id` và `POST /nhan-vien`.
 * Chứng minh 3 lỗ đã đóng, và quan trọng không kém: self-service KHÔNG vỡ.
 */
import { describe, it, expect, vi, beforeAll, beforeEach } from 'vitest';

vi.mock('@/server/db', () => ({
  prisma: {},
  sql: {},
  assertPrismaModel: () => {},
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(async () => '$2a$10$stubhash'),
    compare: vi.fn(async () => true),
  },
}));

vi.mock('@/server/repositories/nhan-vien', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/repositories/nhan-vien')>()),
  findEmployeeById: vi.fn(),
  updateEmployee: vi.fn(),
  createEmployee: vi.fn(),
  findEmployeeChucVuId: vi.fn(),
}));

vi.mock('@/server/repositories/phan-quyen', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/repositories/phan-quyen')>()),
  findQuyenCsvByChucVuAndModule: vi.fn(),
}));

vi.mock('@/server/repositories/chuc-vu', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/server/repositories/chuc-vu')>()),
  findPositionById: vi.fn(),
}));

const TEST_SECRET = 'test-secret-for-authz';
const SELF_ID = 7;

/** Hồ sơ hiện tại trong DB — app-shaped, như findEmployeeById trả về. */
const currentEmployee = {
  id: String(SELF_ID),
  ho_ten: 'Nguyễn Văn A',
  email: 'a@congty.vn',
  email_ca_nhan: null,
  so_dien_thoai: '0901234567',
  ten_dang_nhap: 'nguyenvana',
  must_change_password: false,
  phong_ban_id: '3',
  chuc_vu_id: '10',
  cap_bac: 4,
  trang_thai: 'Đang làm việc',
  gioi_tinh: 'Nam',
  anh_dai_dien: '/uploads/cu.webp',
  nguoi_tao: '1',
};

let createHonoApp: typeof import('@/server/hono-app').createHonoApp;
let signSessionToken: typeof import('@/server/auth').signSessionToken;
let repo: typeof import('@/server/repositories/nhan-vien');
let phanQuyen: typeof import('@/server/repositories/phan-quyen');
let chucVu: typeof import('@/server/repositories/chuc-vu');
let bcrypt: { hash: ReturnType<typeof vi.fn>; compare: ReturnType<typeof vi.fn> };

beforeAll(async () => {
  process.env.AUTH_SECRET = TEST_SECRET;
  ({ createHonoApp } = await import('@/server/hono-app'));
  ({ signSessionToken } = await import('@/server/auth'));
  repo = await import('@/server/repositories/nhan-vien');
  phanQuyen = await import('@/server/repositories/phan-quyen');
  chucVu = await import('@/server/repositories/chuc-vu');
  bcrypt = (await import('bcryptjs')).default as unknown as typeof bcrypt;
});

/** Cấp quyền qua CSV token trên chức vụ của phiên (không phải super). */
function grant(tokens: string) {
  vi.mocked(repo.findEmployeeChucVuId).mockResolvedValue(10);
  vi.mocked(phanQuyen.findQuyenCsvByChucVuAndModule).mockResolvedValue(tokens);
}

async function patch(
  id: number,
  body: Record<string, unknown>,
  session = { employee_id: String(SELF_ID), tai_khoan: 'nguyenvana', cap_bac: 4 },
) {
  const token = await signSessionToken(session);
  const app = createHonoApp();
  const res = await app.fetch(
    new Request(`http://localhost/nhan-vien/${id}`, {
      method: 'PATCH',
      headers: { Cookie: `aht_session=${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }),
  );
  return res;
}

/** Payload y như client thật gửi: toàn bộ form + ten_dang_nhap + cap_bac cũ. */
function fullPayload(overrides: Record<string, unknown> = {}) {
  return {
    ho_ten: currentEmployee.ho_ten,
    email: currentEmployee.email,
    email_ca_nhan: currentEmployee.email_ca_nhan,
    so_dien_thoai: currentEmployee.so_dien_thoai,
    gioi_tinh: currentEmployee.gioi_tinh,
    ten_dang_nhap: currentEmployee.ten_dang_nhap,
    phong_ban_id: currentEmployee.phong_ban_id,
    chuc_vu_id: currentEmployee.chuc_vu_id,
    trang_thai: currentEmployee.trang_thai,
    anh_dai_dien: currentEmployee.anh_dai_dien,
    cap_bac: currentEmployee.cap_bac,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(repo.findEmployeeById).mockResolvedValue(
    currentEmployee as unknown as Awaited<ReturnType<typeof repo.findEmployeeById>>,
  );
  vi.mocked(repo.updateEmployee).mockResolvedValue(
    currentEmployee as unknown as Awaited<ReturnType<typeof repo.updateEmployee>>,
  );
  vi.mocked(repo.createEmployee).mockResolvedValue(
    currentEmployee as unknown as Awaited<ReturnType<typeof repo.createEmployee>>,
  );
  // Chức vụ 10 là cấp 4; chức vụ 99 là cấp 1 (super) — dùng để thử leo quyền.
  vi.mocked(chucVu.findPositionById).mockImplementation(
    async (id: number) =>
      ({ id: String(id), cap_bac: id === 99 ? 1 : 4 }) as unknown as Awaited<
        ReturnType<typeof chucVu.findPositionById>
      >,
  );
});

describe('V1 — không tự nâng cap_bac thành super admin', () => {
  it('người chỉ có `xem` PATCH cap_bac:1 lên hồ sơ mình ⇒ 200 nhưng cap_bac KHÔNG phải 1', async () => {
    grant('xem');
    const res = await patch(SELF_ID, fullPayload({ cap_bac: 1 }));
    expect(res.status).toBe(200);

    expect(repo.updateEmployee).toHaveBeenCalledTimes(1);
    const [, payload] = vi.mocked(repo.updateEmployee).mock.calls[0];
    // chuc_vu_id không đổi ⇒ cap_bac không được ghi lại (undefined), và tuyệt
    // đối không bao giờ là 1 từ body.
    expect(payload.cap_bac).not.toBe(1);
  });

  it('đổi chuc_vu_id sang chức vụ super ⇒ 403 (vector escalation còn lại đã chặn)', async () => {
    grant('xem');
    const res = await patch(SELF_ID, fullPayload({ chuc_vu_id: '99' }));
    expect(res.status).toBe(403);
    expect(repo.updateEmployee).not.toHaveBeenCalled();
  });

  it('quản trị đổi chuc_vu_id ⇒ cap_bac lấy từ chức vụ, không từ body', async () => {
    grant('admin');
    const res = await patch(SELF_ID, fullPayload({ chuc_vu_id: '99', cap_bac: 3 }));
    expect(res.status).toBe(200);
    const [, payload] = vi.mocked(repo.updateEmployee).mock.calls[0];
    expect(payload.cap_bac).toBe(1); // cap_bac của chức vụ 99, không phải 3
  });

  it('POST / với cap_bac:1 ⇒ createEmployee nhận cap_bac suy ra, không phải 1', async () => {
    grant('them');
    const token = await signSessionToken({
      employee_id: String(SELF_ID),
      tai_khoan: 'nguyenvana',
      cap_bac: 4,
    });
    const app = createHonoApp();
    const res = await app.fetch(
      new Request('http://localhost/nhan-vien', {
        method: 'POST',
        headers: { Cookie: `aht_session=${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ho_ten: 'Người Mới',
          ten_dang_nhap: 'nguoimoi',
          mat_khau: 'abc123',
          chuc_vu_id: '10',
          cap_bac: 1,
        }),
      }),
    );
    expect(res.status).toBe(201);
    const [payload] = vi.mocked(repo.createEmployee).mock.calls[0];
    expect(payload.cap_bac).toBe(4);
    expect(payload.must_change_password).toBe(true);
  });
});

describe('V2 — đổi mật khẩu người khác chỉ dành cho quản trị', () => {
  it('token `sua` đặt mật khẩu người khác ⇒ 403, không hash', async () => {
    grant('sua');
    const res = await patch(9, { mat_khau_tam: 'abc123' });
    expect(res.status).toBe(403);
    expect(bcrypt.hash).not.toHaveBeenCalled();
    expect(repo.updateEmployee).not.toHaveBeenCalled();
  });

  it('token `admin` đặt được ⇒ 200 và có hash', async () => {
    grant('admin');
    const res = await patch(9, { mat_khau_tam: 'abc123' });
    expect(res.status).toBe(200);
    expect(bcrypt.hash).toHaveBeenCalledWith('abc123', 10);
  });
});

describe('V3 — buộc đổi mật khẩu được quyết định ở server', () => {
  it('quản trị đặt mật khẩu người khác ⇒ must_change_password = true', async () => {
    grant('admin');
    await patch(9, { mat_khau_tam: 'abc123' });
    const [, payload] = vi.mocked(repo.updateEmployee).mock.calls[0];
    expect(payload.must_change_password).toBe(true);
  });

  it('body gửi must_change_password:false vẫn bị ép true', async () => {
    grant('admin');
    await patch(9, { mat_khau_tam: 'abc123', must_change_password: false });
    const [, payload] = vi.mocked(repo.updateEmployee).mock.calls[0];
    expect(payload.must_change_password).toBe(true);
  });

  it('tự đổi mật khẩu của chính mình ⇒ KHÔNG bị buộc đổi lại', async () => {
    grant('admin');
    await patch(SELF_ID, { mat_khau_tam: 'abc123' });
    const [, payload] = vi.mocked(repo.updateEmployee).mock.calls[0];
    expect(payload.must_change_password).toBe(false);
  });
});

describe('self-service KHÔNG vỡ (hồi quy quan trọng nhất)', () => {
  it('người chỉ có `xem` gửi nguyên form + ảnh mới lên hồ sơ mình ⇒ 200', async () => {
    grant('xem');
    const res = await patch(SELF_ID, fullPayload({ anh_dai_dien: '/uploads/moi.webp' }));
    expect(res.status).toBe(200);
    const [, payload] = vi.mocked(repo.updateEmployee).mock.calls[0];
    expect(payload.anh_dai_dien).toBe('/uploads/moi.webp');
  });

  it('người chỉ có `xem` đổi ho_ten của mình ⇒ 403 (dữ liệu HR-of-record)', async () => {
    grant('xem');
    const res = await patch(SELF_ID, fullPayload({ ho_ten: 'Tên Khác' }));
    expect(res.status).toBe(403);
  });

  it('token `sua` đổi được ho_ten', async () => {
    grant('sua');
    const res = await patch(SELF_ID, fullPayload({ ho_ten: 'Tên Khác' }));
    expect(res.status).toBe(200);
  });

  it('hồ sơ không tồn tại ⇒ 404 trước cả khi xét quyền theo trường', async () => {
    grant('admin');
    vi.mocked(repo.findEmployeeById).mockResolvedValue(null);
    const res = await patch(999, { ho_ten: 'X' });
    expect(res.status).toBe(404);
  });
});

describe('bulk không phải đường bypass tầng trường', () => {
  async function bulk(path: string, method: string, body: unknown) {
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

  it('`xem` không đổi được trạng thái qua /status/bulk (kể cả id của chính mình)', async () => {
    grant('xem');
    const res = await bulk('/nhan-vien/status/bulk', 'PATCH', {
      ids: [SELF_ID],
      trang_thai: 'Nghỉ việc',
    });
    expect(res.status).toBe(403);
  });

  it('`sua` không xoá được qua DELETE /bulk', async () => {
    grant('sua');
    const res = await bulk('/nhan-vien/bulk', 'DELETE', { ids: [SELF_ID] });
    expect(res.status).toBe(403);
  });
});
