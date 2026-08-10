import { Hono } from 'hono';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { requireAuth, type AuthVariables } from '@/server/auth';
import {
  assertNhanVienPermission,
  hasNhanVienModuleAction,
  isNhanVienAdmin,
} from '@/server/permissions/nhan-vien';
import { classifyEmployeeUpdate } from '@/server/permissions/nhan-vien-fields';
import { BULK_IMPORT_MAX_ITEMS, bulkImportZodMessage, runBulkImport } from '@/server/bulk-import';
import { translateCreateError } from '@/server/prisma-errors';
import {
  countEmployees,
  createEmployee,
  deleteEmployee,
  deleteEmployeesMany,
  findEmployeeById,
  findEmployeesByIds,
  findEmployeesPage,
  getDistinctChucDanh,
  getDistinctIdPhongBan,
  getEmployeeFilterCounts,
  getEmployeeStatsAggregates,
  updateEmployee,
  updateEmployeeStatusMany,
} from '@/server/repositories/nhan-vien';
import type { NhanVienListFilters } from '@/server/repositories/nhan-vien-list-query';

function splitCsv(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseListFilters(c: {
  req: { query: (key: string) => string | undefined };
}): NhanVienListFilters {
  let columnSearch: Record<string, string> | undefined;
  const csRaw = c.req.query('columnSearch');
  if (csRaw) {
    try {
      const parsed = JSON.parse(csRaw) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        columnSearch = Object.fromEntries(
          Object.entries(parsed as Record<string, unknown>)
            .filter(([, v]) => typeof v === 'string' && v.trim())
            .map(([k, v]) => [k, String(v)]),
        );
      }
    } catch {
      columnSearch = undefined;
    }
  }
  return {
    search: c.req.query('search') ?? undefined,
    trang_thai: splitCsv(c.req.query('trang_thai')),
    columnSearch,
    asAt: c.req.query('asAt') ?? undefined,
    dateFrom: c.req.query('dateFrom') ?? undefined,
    dateTo: c.req.query('dateTo') ?? undefined,
  };
}

const nhanVienRoutes = new Hono<{ Variables: AuthVariables }>();
nhanVienRoutes.use('*', requireAuth);

const createBodySchema = z.object({
  id: z.string().min(1).optional(),
  ho_ten: z.string().min(1).optional(),
  ho_va_ten: z.string().min(1).optional(),
  mat_khau: z.string().min(6).optional(),
  mat_khau_tam: z.string().min(6).optional(),
  trang_thai: z.string().optional(),
  anh_dai_dien: z.union([z.string(), z.null()]).optional(),
  hinh_anh: z.union([z.string(), z.null()]).optional(),
  must_change_password: z.boolean().optional(),
  ten_dang_nhap: z.union([z.string(), z.null()]).optional(),
});

const updateBodySchema = createBodySchema.partial();

/** Tạo nhân viên + mật khẩu tạm (hash bcrypt) — dùng chung cho POST / và POST /import. */
async function createOne(
  body: z.infer<typeof createBodySchema>,
): Promise<Awaited<ReturnType<typeof createEmployee>>> {
  const id = String(body.id ?? '').trim();
  const hoTen = String(body.ho_ten ?? body.ho_va_ten ?? '').trim();
  const password = String(body.mat_khau ?? body.mat_khau_tam ?? '');
  if (!id || !hoTen || password.length < 6) {
    throw new Error('id, ho_ten và mat_khau (≥6) là bắt buộc');
  }

  const hash = await bcrypt.hash(password, 10);
  return createEmployee({
    id,
    ho_ten: hoTen,
    mat_khau_hash: hash,
    trang_thai: body.trang_thai,
    anh_dai_dien:
      body.anh_dai_dien !== undefined
        ? body.anh_dai_dien
        : body.hinh_anh !== undefined
          ? body.hinh_anh
          : null,
    // Mật khẩu của tài khoản mới do người khác đặt ⇒ luôn buộc đổi lần đầu.
    must_change_password: true,
    ten_dang_nhap: body.ten_dang_nhap ?? null,
  });
}

nhanVienRoutes.get('/', async (c) => {
  const denied = await assertNhanVienPermission(c, 'xem');
  if (denied) return denied;

  const limit = Number(c.req.query('limit') ?? 50);
  const offset = Number(c.req.query('offset') ?? 0);
  const orderBy = c.req.query('orderBy') ?? 'id';
  const ascending = c.req.query('ascending') !== 'false';
  const filters = parseListFilters(c);

  const result = await findEmployeesPage({
    limit: Number.isFinite(limit) ? limit : 50,
    offset: Number.isFinite(offset) ? offset : 0,
    orderBy,
    ascending,
    ...filters,
  });
  return c.json(result);
});

nhanVienRoutes.get('/count', async (c) => {
  const denied = await assertNhanVienPermission(c, 'xem');
  if (denied) return denied;
  const total = await countEmployees(parseListFilters(c));
  return c.json({ total });
});

nhanVienRoutes.get('/filter-counts', async (c) => {
  const denied = await assertNhanVienPermission(c, 'xem');
  if (denied) return denied;
  const counts = await getEmployeeFilterCounts(parseListFilters(c));
  return c.json(counts);
});

nhanVienRoutes.get('/stats/aggregates', async (c) => {
  const denied = await assertNhanVienPermission(c, 'xem');
  if (denied) return denied;
  const aggregates = await getEmployeeStatsAggregates(parseListFilters(c));
  return c.json(aggregates);
});

/** Trục vai_tro của ma trận Phân quyền — chỉ cần đăng nhập, không cần quyền `xem` nhân viên. */
nhanVienRoutes.get('/chuc-danh', async (c) => {
  const items = await getDistinctChucDanh();
  return c.json({ items });
});

/** Nguồn dropdown `to` (tổ/phòng) của module Tài liệu — cross-feature reuse, chỉ cần đăng nhập. */
nhanVienRoutes.get('/distinct-phong-ban', async (c) => {
  const items = await getDistinctIdPhongBan();
  return c.json({ items });
});

/** Lấy nhiều nhân viên theo ids trong 1 request — dùng cho bulk actions (reset password...). */
nhanVienRoutes.get('/by-ids', async (c) => {
  const denied = await assertNhanVienPermission(c, 'xem');
  if (denied) return denied;
  const ids = splitCsv(c.req.query('ids'));
  if (ids.length === 0) return c.json({ items: [] });
  const items = await findEmployeesByIds(ids);
  return c.json({ items });
});

nhanVienRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'Invalid id' }, 400);

  const employee = await findEmployeeById(id);
  if (!employee) return c.json({ error: 'Not found' }, 404);

  const denied = await assertNhanVienPermission(c, 'xem', {
    recordId: employee.id,
  });
  if (denied) return denied;

  return c.json(employee);
});

nhanVienRoutes.post('/', async (c) => {
  const denied = await assertNhanVienPermission(c, 'them');
  if (denied) return denied;

  const raw = await c.req.json();
  const parsed = createBodySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
  }
  const body = parsed.data;

  try {
    const employee = await createOne(body);
    return c.json(employee, 201);
  } catch (err) {
    return c.json({ error: translateCreateError(err, 'Không thể tạo nhân viên') }, 400);
  }
});

nhanVienRoutes.post('/import', async (c) => {
  const denied = await assertNhanVienPermission(c, 'them');
  if (denied) return denied;

  const raw = await c.req.json();
  const items = Array.isArray((raw as { items?: unknown[] })?.items)
    ? (raw as { items: unknown[] }).items
    : null;
  if (!items) return c.json({ error: 'Invalid body' }, 400);
  if (items.length > BULK_IMPORT_MAX_ITEMS) {
    return c.json({ error: `Tối đa ${BULK_IMPORT_MAX_ITEMS} dòng mỗi lần import` }, 400);
  }

  const result = await runBulkImport(
    items,
    async (item) => {
      const parsed = createBodySchema.safeParse(item);
      if (!parsed.success) {
        throw new Error(bulkImportZodMessage(parsed.error));
      }
      await createOne(parsed.data);
    },
    (err) => translateCreateError(err, 'Không thể tạo nhân viên'),
  );
  return c.json(result);
});

/** Bulk status — must be registered before /:id */
nhanVienRoutes.patch('/status/bulk', async (c) => {
  const denied = await assertNhanVienPermission(c, 'sua');
  if (denied) return denied;

  const raw = await c.req.json().catch(() => ({}));
  const idsRaw = Array.isArray(raw.ids) ? raw.ids : [];
  const ids = idsRaw.map((v: unknown) => String(v)).filter((s: string) => s.length > 0);
  const trangThai = String(raw.trang_thai ?? '').trim();
  if (ids.length === 0 || !trangThai) {
    return c.json({ error: 'ids và trang_thai là bắt buộc' }, 400);
  }

  const items = await updateEmployeeStatusMany(ids, trangThai);
  return c.json({ items, total: items.length });
});

nhanVienRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'Invalid id' }, 400);

  // Snapshot app-shaped dùng để: cổng own-row, và phân quyền theo trường so diff.
  const current = await findEmployeeById(id);
  if (!current) return c.json({ error: 'Not found' }, 404);

  const denied = await assertNhanVienPermission(c, 'sua', {
    recordId: String(id),
  });
  if (denied) return denied;

  const raw = await c.req.json();
  const parsed = updateBodySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
  }
  const body = parsed.data;

  /**
   * Cổng route ở trên cho `isSelf` đi qua (đó là thứ cho phép nhân viên chỉ có
   * quyền `xem` tự đổi ảnh đại diện). Nên tầng trường phải hỏi lại: trường nào
   * THỰC SỰ đổi giá trị, và người này có đủ quyền cho trường đó không.
   */
  const { requiresSua, requiresAdmin, carriesPassword } = classifyEmployeeUpdate(
    body,
    current,
  );

  if (requiresAdmin.length > 0 || carriesPassword) {
    if (!(await isNhanVienAdmin(c))) {
      const fields = carriesPassword
        ? [...requiresAdmin, 'mật khẩu']
        : requiresAdmin;
      return c.json(
        { error: `Chỉ quản trị mới được sửa: ${fields.join(', ')}`, fields },
        403,
      );
    }
  }

  if (requiresSua.length > 0 && !(await hasNhanVienModuleAction(c, 'sua'))) {
    return c.json(
      {
        error: `Không có quyền sửa các trường: ${requiresSua.join(', ')}`,
        fields: requiresSua,
      },
      403,
    );
  }

  let matKhauHash: string | undefined;
  const newPassword = String(body.mat_khau ?? body.mat_khau_tam ?? '').trim();
  if (newPassword) {
    if (newPassword.length < 6) {
      return c.json({ error: 'mat_khau phải ≥ 6 ký tự' }, 400);
    }
    matKhauHash = await bcrypt.hash(newPassword, 10);
  }

  /**
   * Quản trị đặt mật khẩu cho NGƯỜI KHÁC ⇒ luôn buộc đổi ở lần đăng nhập kế tiếp,
   * quyết định ở server chứ không tin client gửi cờ (trước đây client tự bù ở
   * `nhan-vien-service.ts:725`, nên caller ngoài UI có mật khẩu vĩnh viễn).
   * Tự đổi mật khẩu của chính mình thì không buộc.
   */
  const session = c.get('session');
  const isSelfEdit = String(id) === session.employee_id;
  const mustChangePassword = carriesPassword
    ? !isSelfEdit || (body.must_change_password ?? false)
    : body.must_change_password;

  const employee = await updateEmployee(id, {
    ho_ten:
      body.ho_ten != null || body.ho_va_ten != null
        ? String(body.ho_ten ?? body.ho_va_ten).trim()
        : undefined,
    mat_khau_hash: matKhauHash,
    trang_thai: body.trang_thai,
    anh_dai_dien:
      body.anh_dai_dien !== undefined
        ? body.anh_dai_dien
        : body.hinh_anh !== undefined
          ? body.hinh_anh
          : undefined,
    must_change_password: mustChangePassword,
    ten_dang_nhap: body.ten_dang_nhap !== undefined ? body.ten_dang_nhap : undefined,
  });

  if (!employee) return c.json({ error: 'Not found' }, 404);
  return c.json(employee);
});

/** Bulk delete — must be registered before /:id */
nhanVienRoutes.delete('/bulk', async (c) => {
  const denied = await assertNhanVienPermission(c, 'xoa');
  if (denied) return denied;

  const raw = await c.req.json().catch(() => ({}));
  const idsRaw = Array.isArray(raw.ids) ? raw.ids : [];
  const ids = idsRaw.map((v: unknown) => String(v)).filter((s: string) => s.length > 0);
  if (ids.length === 0) return c.json({ error: 'ids là bắt buộc' }, 400);

  const count = await deleteEmployeesMany(ids);
  return c.json({ ok: true, count });
});

nhanVienRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'Invalid id' }, 400);

  const denied = await assertNhanVienPermission(c, 'xoa');
  if (denied) return denied;

  const ok = await deleteEmployee(id);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true });
});

export { nhanVienRoutes };
