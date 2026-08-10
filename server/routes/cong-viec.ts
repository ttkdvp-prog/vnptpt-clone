import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, type AuthVariables } from '@/server/auth';
import { assertModulePermission, getSessionIsSuperOrModuleAdmin } from '@/server/permissions/assert-module';
import { findEmployeeById } from '@/server/repositories/nhan-vien';
import {
  countCongViec,
  createCongViec,
  deleteCongViec,
  deleteCongViecMany,
  findCongViecById,
  findCongViecPage,
  getCongViecFilterCounts,
  getCongViecStatsAggregates,
  getDistinctTieuDe,
  updateCongViec,
  type CongViecListFilters,
} from '@/server/repositories/cong-viec';

const MODULE_KEY = 'cong-viec/danh-sach-cong-viec';

function splitCsv(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

function parseListFilters(c: { req: { query: (key: string) => string | undefined } }): CongViecListFilters {
  return {
    search: c.req.query('search') ?? undefined,
    cap: splitCsv(c.req.query('cap')),
    uu_tien: splitCsv(c.req.query('uu_tien')),
    to_ar: splitCsv(c.req.query('to_ar')),
    to_r: splitCsv(c.req.query('to_r')),
    trang_thai: splitCsv(c.req.query('trang_thai')),
  };
}

/**
 * Tổ của người đăng nhập, dùng để giới hạn phạm vi xem/tạo khi không phải
 * super user / module admin. LƯU Ý: `assert-module.ts` hiện coi mọi phiên đăng
 * nhập hợp lệ là admin của mọi module (không còn tra được cấp bậc/chức vụ ở
 * server — xem comment trong file đó), nên `getSessionIsSuperOrModuleAdmin`
 * hiện luôn trả `true` và nhánh giới hạn theo tổ dưới đây thực chất chưa kích
 * hoạt được cho tới khi cơ chế phân quyền server được khôi phục đầy đủ. Viết
 * đúng theo đặc tả để sẵn sàng khi đó, không phải suy đoán sai hành vi.
 */
async function getOwnTeam(c: { get: (key: 'session') => { employee_id: string } | undefined }): Promise<string | null> {
  const session = c.get('session');
  if (!session?.employee_id) return null;
  const employee = await findEmployeeById(session.employee_id);
  return employee?.to_phong ?? null;
}

const congViecRoutes = new Hono<{ Variables: AuthVariables }>();
congViecRoutes.use('*', requireAuth);

const bodySchema = z.object({
  cap: z.string().min(1),
  tieu_de: z.string().min(1),
  mo_ta: z.union([z.string(), z.null()]).optional(),
  to_ar: z.string().min(1),
  to_r: z.union([z.string(), z.null()]).optional(),
  mnv_a: z.string().min(1),
  mnv_r: z.union([z.string(), z.null()]).optional(),
  mnv_c: z.union([z.string(), z.null()]).optional(),
  uu_tien: z.string().min(1),
  ngay_bd: z.string().min(1),
  ngay_kt: z.string().min(1),
  ghi_chu: z.union([z.string(), z.null()]).optional(),
  ngay_ht: z.union([z.string(), z.null()]).optional(),
  tep_dinh_kem: z.union([z.string(), z.null()]).optional(),
});

const updateBodySchema = bodySchema.partial();

congViecRoutes.get('/', async (c) => {
  const denied = await assertModulePermission(c, MODULE_KEY, 'xem');
  if (denied) return denied;

  const limit = Number(c.req.query('limit') ?? 20);
  const offset = Number(c.req.query('offset') ?? 0);
  const orderBy = c.req.query('orderBy') ?? 'id';
  const ascending = c.req.query('ascending') !== 'false';
  const filters = parseListFilters(c);

  const isAdmin = await getSessionIsSuperOrModuleAdmin(c, MODULE_KEY);
  if (!isAdmin) {
    const ownTeam = await getOwnTeam(c);
    filters.scopeTeams = ownTeam ? [ownTeam] : [];
  }

  const result = await findCongViecPage({
    limit: Number.isFinite(limit) ? limit : 20,
    offset: Number.isFinite(offset) ? offset : 0,
    orderBy,
    ascending,
    ...filters,
  });
  return c.json(result);
});

congViecRoutes.get('/count', async (c) => {
  const denied = await assertModulePermission(c, MODULE_KEY, 'xem');
  if (denied) return denied;
  const filters = parseListFilters(c);
  const isAdmin = await getSessionIsSuperOrModuleAdmin(c, MODULE_KEY);
  if (!isAdmin) {
    const ownTeam = await getOwnTeam(c);
    filters.scopeTeams = ownTeam ? [ownTeam] : [];
  }
  const total = await countCongViec(filters);
  return c.json({ total });
});

congViecRoutes.get('/filter-counts', async (c) => {
  const denied = await assertModulePermission(c, MODULE_KEY, 'xem');
  if (denied) return denied;
  const filters = parseListFilters(c);
  const isAdmin = await getSessionIsSuperOrModuleAdmin(c, MODULE_KEY);
  if (!isAdmin) {
    const ownTeam = await getOwnTeam(c);
    filters.scopeTeams = ownTeam ? [ownTeam] : [];
  }
  const counts = await getCongViecFilterCounts(filters);
  return c.json(counts);
});

congViecRoutes.get('/stats/aggregates', async (c) => {
  const denied = await assertModulePermission(c, MODULE_KEY, 'xem');
  if (denied) return denied;
  const filters = parseListFilters(c);
  const isAdmin = await getSessionIsSuperOrModuleAdmin(c, MODULE_KEY);
  if (!isAdmin) {
    const ownTeam = await getOwnTeam(c);
    filters.scopeTeams = ownTeam ? [ownTeam] : [];
  }
  const aggregates = await getCongViecStatsAggregates(filters);
  return c.json(aggregates);
});

/** Gợi ý combobox tự do `tieu_de` — chỉ cần đăng nhập, không cần quyền `xem` module. */
congViecRoutes.get('/distinct-tieu-de', async (c) => {
  const items = await getDistinctTieuDe();
  return c.json({ items });
});

congViecRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'Invalid id' }, 400);

  const item = await findCongViecById(id);
  if (!item) return c.json({ error: 'Not found' }, 404);

  const denied = await assertModulePermission(c, MODULE_KEY, 'xem', {
    recordNguoiTao: item.nguoi_tao,
  });
  if (denied) return denied;

  const isAdmin = await getSessionIsSuperOrModuleAdmin(c, MODULE_KEY);
  if (!isAdmin) {
    const ownTeam = await getOwnTeam(c);
    if (!ownTeam || (item.to_ar !== ownTeam && item.to_r !== ownTeam)) {
      return c.json({ error: 'Forbidden' }, 403);
    }
  }

  return c.json(item);
});

congViecRoutes.post('/', async (c) => {
  const denied = await assertModulePermission(c, MODULE_KEY, 'them');
  if (denied) return denied;

  const raw = await c.req.json();
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
  }
  const body = parsed.data;
  if (body.ngay_kt < body.ngay_bd) {
    return c.json({ error: 'ngay_kt phải >= ngay_bd' }, 400);
  }

  const session = c.get('session');

  const isAdmin = await getSessionIsSuperOrModuleAdmin(c, MODULE_KEY);
  if (!isAdmin) {
    const ownTeam = await getOwnTeam(c);
    if (!ownTeam || body.to_ar !== ownTeam) {
      return c.json({ error: 'to_ar phải trùng tổ của người tạo' }, 400);
    }
  }

  const created = await createCongViec({
    cap: body.cap,
    tieu_de: body.tieu_de,
    mo_ta: body.mo_ta,
    to_ar: body.to_ar,
    to_r: body.to_r,
    mnv_a: body.mnv_a,
    mnv_r: body.mnv_r,
    mnv_c: body.mnv_c,
    uu_tien: body.uu_tien,
    ngay_bd: body.ngay_bd,
    ngay_kt: body.ngay_kt,
    ghi_chu: body.ghi_chu,
    ngay_ht: body.ngay_ht,
    tep_dinh_kem: body.tep_dinh_kem,
    nguoi_tao: session.employee_id,
  });
  return c.json(created, 201);
});

congViecRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'Invalid id' }, 400);

  const current = await findCongViecById(id);
  if (!current) return c.json({ error: 'Not found' }, 404);

  const denied = await assertModulePermission(c, MODULE_KEY, 'sua', {
    recordNguoiTao: current.nguoi_tao,
  });
  if (denied) return denied;

  const raw = await c.req.json();
  const parsed = updateBodySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
  }
  const body = parsed.data;

  const nextStart = body.ngay_bd ?? current.ngay_bd;
  const nextEnd = body.ngay_kt ?? current.ngay_kt;
  if (nextEnd && nextEnd < nextStart) {
    return c.json({ error: 'ngay_kt phải >= ngay_bd' }, 400);
  }

  const isAdmin = await getSessionIsSuperOrModuleAdmin(c, MODULE_KEY);
  if (!isAdmin && body.to_ar !== undefined) {
    const ownTeam = await getOwnTeam(c);
    if (!ownTeam || body.to_ar !== ownTeam) {
      return c.json({ error: 'to_ar phải trùng tổ của người tạo' }, 400);
    }
  }

  const updated = await updateCongViec(id, body);
  if (!updated) return c.json({ error: 'Not found' }, 404);
  return c.json(updated);
});

/** Bulk delete — must be registered before /:id */
congViecRoutes.delete('/bulk', async (c) => {
  const denied = await assertModulePermission(c, MODULE_KEY, 'xoa', { allowOwnRow: false });
  if (denied) return denied;

  const raw = await c.req.json().catch(() => ({}));
  const idsRaw = Array.isArray(raw.ids) ? raw.ids : [];
  const ids = idsRaw.map((v: unknown) => String(v)).filter((s: string) => s.length > 0);
  if (ids.length === 0) return c.json({ error: 'ids là bắt buộc' }, 400);

  const count = await deleteCongViecMany(ids);
  return c.json({ ok: true, count });
});

congViecRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'Invalid id' }, 400);

  const denied = await assertModulePermission(c, MODULE_KEY, 'xoa', { allowOwnRow: false });
  if (denied) return denied;

  const ok = await deleteCongViec(id);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true });
});

export { congViecRoutes };
