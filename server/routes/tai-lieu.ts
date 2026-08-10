import { Hono } from 'hono';
import { z } from 'zod';
import { requireAuth, type AuthVariables } from '@/server/auth';
import { assertModulePermission } from '@/server/permissions/assert-module';
import {
  countTaiLieu,
  createTaiLieu,
  deleteTaiLieu,
  deleteTaiLieuMany,
  findTaiLieuById,
  findTaiLieuPage,
  getDistinctDanhMuc,
  getDistinctTenHoSo,
  getTaiLieuFilterCounts,
  getTaiLieuStatsAggregates,
  updateTaiLieu,
  type TaiLieuListFilters,
} from '@/server/repositories/tai-lieu';

const MODULE_KEY = 'cong-viec/tai-lieu';

function splitCsv(value: string | undefined): string[] {
  if (!value?.trim()) return [];
  return value.split(',').map((s) => s.trim()).filter(Boolean);
}

function parseListFilters(c: { req: { query: (key: string) => string | undefined } }): TaiLieuListFilters {
  return {
    search: c.req.query('search') ?? undefined,
    tinh_trang: splitCsv(c.req.query('tinh_trang')),
    danh_muc: splitCsv(c.req.query('danh_muc')),
    to: splitCsv(c.req.query('to')),
  };
}

const taiLieuRoutes = new Hono<{ Variables: AuthVariables }>();
taiLieuRoutes.use('*', requireAuth);

const bodySchema = z.object({
  ten_ho_so: z.string().min(1),
  danh_muc: z.string().min(1),
  to: z.string().min(1),
  ngay_ban_hanh: z.string().min(1),
  ngay_ket_thuc: z.union([z.string(), z.null()]).optional(),
  tinh_trang: z.string().min(1),
  url: z.union([z.string(), z.null()]).optional(),
  mo_ta: z.union([z.string(), z.null()]).optional(),
});

const updateBodySchema = bodySchema.partial();

taiLieuRoutes.get('/', async (c) => {
  const denied = await assertModulePermission(c, MODULE_KEY, 'xem');
  if (denied) return denied;

  const limit = Number(c.req.query('limit') ?? 20);
  const offset = Number(c.req.query('offset') ?? 0);
  const orderBy = c.req.query('orderBy') ?? 'id';
  const ascending = c.req.query('ascending') !== 'false';
  const filters = parseListFilters(c);

  const result = await findTaiLieuPage({
    limit: Number.isFinite(limit) ? limit : 20,
    offset: Number.isFinite(offset) ? offset : 0,
    orderBy,
    ascending,
    ...filters,
  });
  return c.json(result);
});

taiLieuRoutes.get('/count', async (c) => {
  const denied = await assertModulePermission(c, MODULE_KEY, 'xem');
  if (denied) return denied;
  const total = await countTaiLieu(parseListFilters(c));
  return c.json({ total });
});

taiLieuRoutes.get('/filter-counts', async (c) => {
  const denied = await assertModulePermission(c, MODULE_KEY, 'xem');
  if (denied) return denied;
  const counts = await getTaiLieuFilterCounts(parseListFilters(c));
  return c.json(counts);
});

taiLieuRoutes.get('/stats/aggregates', async (c) => {
  const denied = await assertModulePermission(c, MODULE_KEY, 'xem');
  if (denied) return denied;
  const aggregates = await getTaiLieuStatsAggregates(parseListFilters(c));
  return c.json(aggregates);
});

/** Gợi ý combobox tự do `danh_muc` — chỉ cần đăng nhập, không cần quyền `xem` module. */
taiLieuRoutes.get('/distinct-danh-muc', async (c) => {
  const items = await getDistinctDanhMuc();
  return c.json({ items });
});

/** Gợi ý `ten_ho_so` đã có — tránh gõ trùng/lệch chính tả tên hồ sơ. */
taiLieuRoutes.get('/distinct-ten-ho-so', async (c) => {
  const items = await getDistinctTenHoSo();
  return c.json({ items });
});

taiLieuRoutes.get('/:id', async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'Invalid id' }, 400);

  const item = await findTaiLieuById(id);
  if (!item) return c.json({ error: 'Not found' }, 404);

  const denied = await assertModulePermission(c, MODULE_KEY, 'xem', {
    recordNguoiTao: item.nguoi_tao,
  });
  if (denied) return denied;

  return c.json(item);
});

taiLieuRoutes.post('/', async (c) => {
  const denied = await assertModulePermission(c, MODULE_KEY, 'them');
  if (denied) return denied;

  const raw = await c.req.json();
  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json({ error: 'Invalid body', details: parsed.error.flatten() }, 400);
  }
  const body = parsed.data;
  if (body.ngay_ket_thuc && body.ngay_ket_thuc < body.ngay_ban_hanh) {
    return c.json({ error: 'ngay_ket_thuc phải >= ngay_ban_hanh' }, 400);
  }

  const session = c.get('session');
  const created = await createTaiLieu({
    ten_ho_so: body.ten_ho_so,
    danh_muc: body.danh_muc,
    to: body.to,
    ngay_ban_hanh: body.ngay_ban_hanh,
    ngay_ket_thuc: body.ngay_ket_thuc,
    tinh_trang: body.tinh_trang,
    url: body.url,
    mo_ta: body.mo_ta,
    nguoi_tao: session.employee_id,
  });
  return c.json(created, 201);
});

taiLieuRoutes.patch('/:id', async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'Invalid id' }, 400);

  const current = await findTaiLieuById(id);
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

  const nextStart = body.ngay_ban_hanh ?? current.ngay_ban_hanh;
  const nextEnd = body.ngay_ket_thuc !== undefined ? body.ngay_ket_thuc : current.ngay_ket_thuc;
  if (nextEnd && nextEnd < nextStart) {
    return c.json({ error: 'ngay_ket_thuc phải >= ngay_ban_hanh' }, 400);
  }

  const updated = await updateTaiLieu(id, body);
  if (!updated) return c.json({ error: 'Not found' }, 404);
  return c.json(updated);
});

/** Bulk delete — must be registered before /:id */
taiLieuRoutes.delete('/bulk', async (c) => {
  const denied = await assertModulePermission(c, MODULE_KEY, 'xoa', { allowOwnRow: false });
  if (denied) return denied;

  const raw = await c.req.json().catch(() => ({}));
  const idsRaw = Array.isArray(raw.ids) ? raw.ids : [];
  const ids = idsRaw.map((v: unknown) => String(v)).filter((s: string) => s.length > 0);
  if (ids.length === 0) return c.json({ error: 'ids là bắt buộc' }, 400);

  const count = await deleteTaiLieuMany(ids);
  return c.json({ ok: true, count });
});

taiLieuRoutes.delete('/:id', async (c) => {
  const id = c.req.param('id');
  if (!id) return c.json({ error: 'Invalid id' }, 400);

  const denied = await assertModulePermission(c, MODULE_KEY, 'xoa', { allowOwnRow: false });
  if (denied) return denied;

  const ok = await deleteTaiLieu(id);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true });
});

export { taiLieuRoutes };
