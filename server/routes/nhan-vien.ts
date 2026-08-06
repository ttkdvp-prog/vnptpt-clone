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
import { findPositionById } from '@/server/repositories/chuc-vu';
import { BULK_IMPORT_MAX_ITEMS, bulkImportZodMessage, runBulkImport } from '@/server/bulk-import';
import { translateCreateError } from '@/server/prisma-errors';
import {
  countEmployees,
  createEmployee,
  deleteEmployee,
  deleteEmployeesMany,
  findEmployeeById,
  findEmployeeByLogin,
  findEmployeesByIds,
  findEmployeesPage,
  getEmployeeFilterCounts,
  getEmployeeStatsAggregates,
  updateEmployee,
  updateEmployeeStatusMany,
} from '@/server/repositories/nhan-vien';
import type { NhanVienListFilters } from '@/server/repositories/nhan-vien-list-query';
import { findCompany } from '@/server/repositories/cong-ty';
import { inlineUploadImage } from '@/server/media/inline-upload-image';
import { renderHtmlToPdf } from '@/lib/pdf/render-html-to-pdf';
import { safeFileName } from '@/lib/print-document/file-name';
import {
  buildEmployeeProfileFullHTML,
  buildServerProfileModel,
  formatServerDateTime,
} from '@/features/he-thong/nhan-vien/utils/employee-profile-document';
import { buildEmployeeProfileDocx } from '@/features/he-thong/nhan-vien/utils/employee-profile-docx';
import type { CompanyDocInfo } from '@/features/he-thong/nhan-vien/core/profile-document-model';
import type { Employee as EmployeeDoc } from '@/features/he-thong/nhan-vien/core/types';

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
    phong_ban_id: splitCsv(c.req.query('phong_ban_id')),
    chuc_vu_id: splitCsv(c.req.query('chuc_vu_id')),
    gioi_tinh: splitCsv(c.req.query('gioi_tinh')),
    columnSearch,
    asAt: c.req.query('asAt') ?? undefined,
    dateFrom: c.req.query('dateFrom') ?? undefined,
    dateTo: c.req.query('dateTo') ?? undefined,
  };
}

const nhanVienRoutes = new Hono<{ Variables: AuthVariables }>();
nhanVienRoutes.use('*', requireAuth);

const optionalNullableString = z.union([z.string(), z.null()]).optional();

const createBodySchema = z.object({
  ho_ten: z.string().min(1).optional(),
  ho_va_ten: z.string().min(1).optional(),
  ten_dang_nhap: z.string().min(1).optional(),
  tai_khoan: z.string().min(1).optional(),
  mat_khau: z.string().min(6).optional(),
  mat_khau_tam: z.string().min(6).optional(),
  email: z.string().optional(),
  email_ca_nhan: optionalNullableString,
  so_dien_thoai: z.string().optional(),
  gioi_tinh: z.string().optional(),
  ngay_sinh: optionalNullableString,
  so_cccd: optionalNullableString,
  ngay_cap_cccd: optionalNullableString,
  noi_cap_cccd: optionalNullableString,
  dia_chi_thuong_tru: optionalNullableString,
  dia_chi_hien_tai: optionalNullableString,
  que_quan: optionalNullableString,
  dan_toc: optionalNullableString,
  ton_giao: optionalNullableString,
  tinh_trang_hon_nhan: optionalNullableString,
  quoc_tich: optionalNullableString,
  ngay_vao_lam: optionalNullableString,
  ngay_chinh_thuc: optionalNullableString,
  ngay_nghi_viec: optionalNullableString,
  ly_do_nghi: optionalNullableString,
  so_tai_khoan: optionalNullableString,
  ten_chu_tai_khoan: optionalNullableString,
  ngan_hang: optionalNullableString,
  chi_nhanh: optionalNullableString,
  nguoi_lien_he_khan: optionalNullableString,
  sdt_khan: optionalNullableString,
  moi_quan_he: optionalNullableString,
  so_so_bhxh: optionalNullableString,
  so_bhyt: optionalNullableString,
  ma_so_thue_ca_nhan: optionalNullableString,
  trinh_do: optionalNullableString,
  chuyen_nganh: optionalNullableString,
  truong: optionalNullableString,
  phong_ban_id: z.union([z.string(), z.null()]).optional(),
  chuc_vu_id: z.union([z.string(), z.null()]).optional(),
  /**
   * Nhận rồi BỎ QUA — `cap_bac` luôn được suy ra từ `chuc_vu.cap_bac`
   * (xem `resolveCapBacFromChucVu`). Giữ trong schema để client cũ vẫn gửi được
   * mà không bị 400: `nhan-vien-service.ts:643` luôn kèm `cap_bac: before.cap_bac`.
   * KHÔNG bao giờ đọc giá trị này. Đây là bản vá lỗ tự nâng quyền super admin.
   */
  cap_bac: z.union([z.number(), z.string(), z.null()]).optional(),
  trang_thai: z.string().optional(),
  anh_dai_dien: z.union([z.string(), z.null()]).optional(),
  hinh_anh: z.union([z.string(), z.null()]).optional(),
  must_change_password: z.boolean().optional(),
});

const updateBodySchema = createBodySchema.partial();

/**
 * `nhan_vien.cap_bac` PHẢI bằng `chuc_vu.cap_bac` — bất biến này đã có ở client
 * (`nhan-vien-service.ts:826-829`, `core/map-from-db.ts:16`) nhưng server trước
 * đây đọc thẳng từ body, nên bất kỳ ai cũng tự đặt `cap_bac: 1` để thành super
 * admin. Suy ra ở server đóng đường đó vĩnh viễn.
 */
async function resolveCapBacFromChucVu(
  chucVuId: string | null | undefined,
): Promise<number | null> {
  if (chucVuId == null || chucVuId === '') return null;
  const id = Number(chucVuId);
  if (!Number.isFinite(id)) return null;
  const position = await findPositionById(id);
  return position?.cap_bac ?? null;
}

const UNIQUE_MESSAGE = 'Tài khoản đã tồn tại';

/** Tạo nhân viên + tài khoản đăng nhập (hash bcrypt) — dùng chung cho POST / và POST /import. */
async function createOne(
  body: z.infer<typeof createBodySchema>,
  employeeId: string,
): Promise<Awaited<ReturnType<typeof createEmployee>>> {
  const hoTen = String(body.ho_ten ?? body.ho_va_ten ?? '').trim();
  const taiKhoan = String(body.ten_dang_nhap ?? body.tai_khoan ?? '')
    .trim()
    .toLowerCase();
  const password = String(body.mat_khau ?? body.mat_khau_tam ?? '');
  if (!hoTen || !taiKhoan || password.length < 6) {
    throw new Error('ho_ten, tai_khoan và mat_khau (≥6) là bắt buộc');
  }

  const hash = await bcrypt.hash(password, 10);
  return createEmployee({
    ho_ten: hoTen,
    tai_khoan: taiKhoan,
    mat_khau_hash: hash,
    email: body.email != null ? String(body.email) : '',
    email_ca_nhan: body.email_ca_nhan,
    so_dien_thoai: body.so_dien_thoai != null ? String(body.so_dien_thoai) : '',
    gioi_tinh: body.gioi_tinh != null ? String(body.gioi_tinh) : 'Nam',
    ngay_sinh: body.ngay_sinh,
    so_cccd: body.so_cccd,
    ngay_cap_cccd: body.ngay_cap_cccd,
    noi_cap_cccd: body.noi_cap_cccd,
    dia_chi_thuong_tru: body.dia_chi_thuong_tru,
    dia_chi_hien_tai: body.dia_chi_hien_tai,
    que_quan: body.que_quan,
    dan_toc: body.dan_toc,
    ton_giao: body.ton_giao,
    tinh_trang_hon_nhan: body.tinh_trang_hon_nhan,
    quoc_tich: body.quoc_tich,
    ngay_vao_lam: body.ngay_vao_lam,
    ngay_chinh_thuc: body.ngay_chinh_thuc,
    ngay_nghi_viec: body.ngay_nghi_viec,
    ly_do_nghi: body.ly_do_nghi,
    so_tai_khoan: body.so_tai_khoan,
    ten_chu_tai_khoan: body.ten_chu_tai_khoan,
    ngan_hang: body.ngan_hang,
    chi_nhanh: body.chi_nhanh,
    nguoi_lien_he_khan: body.nguoi_lien_he_khan,
    sdt_khan: body.sdt_khan,
    moi_quan_he: body.moi_quan_he,
    so_so_bhxh: body.so_so_bhxh,
    so_bhyt: body.so_bhyt,
    ma_so_thue_ca_nhan: body.ma_so_thue_ca_nhan,
    trinh_do: body.trinh_do,
    chuyen_nganh: body.chuyen_nganh,
    truong: body.truong,
    phong_ban_id: body.phong_ban_id ?? null,
    chuc_vu_id: body.chuc_vu_id ?? null,
    // Suy ra, không đọc body — chặn `them` mint tài khoản cap_bac:1.
    cap_bac: await resolveCapBacFromChucVu(body.chuc_vu_id),
    trang_thai: body.trang_thai,
    anh_dai_dien:
      body.anh_dai_dien !== undefined
        ? body.anh_dai_dien
        : body.hinh_anh !== undefined
          ? body.hinh_anh
          : null,
    // Mật khẩu của tài khoản mới do người khác đặt ⇒ luôn buộc đổi lần đầu.
    // Cố định `true`, không nhận từ body.
    must_change_password: true,
    nguoi_tao: employeeId,
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

/** Lấy nhiều nhân viên theo ids trong 1 request — dùng cho bulk actions (reset password...). */
nhanVienRoutes.get('/by-ids', async (c) => {
  const denied = await assertNhanVienPermission(c, 'xem');
  if (denied) return denied;
  const idsRaw = splitCsv(c.req.query('ids'));
  const ids = idsRaw.map((v) => Number(v)).filter((n) => Number.isFinite(n));
  if (ids.length === 0) return c.json({ items: [] });
  const items = await findEmployeesByIds(ids);
  return c.json({ items });
});

nhanVienRoutes.get('/by-login/:taiKhoan', async (c) => {
  const denied = await assertNhanVienPermission(c, 'xem');
  if (denied) return denied;

  const taiKhoan = decodeURIComponent(c.req.param('taiKhoan')).trim().toLowerCase();
  const employee = await findEmployeeByLogin(taiKhoan);
  if (!employee) return c.json({ error: 'Not found' }, 404);
  return c.json(employee);
});

/** MIME → định dạng ảnh mà `docx` ImageRun nhận trực tiếp (không cần chuyển đổi). */
const DOCX_IMAGE_TYPE: Record<string, 'jpg' | 'png' | 'gif' | 'bmp'> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/bmp': 'bmp',
};

/**
 * data URL → buffer cho `docx`.
 * Ảnh upload trong app mặc định nén thành `webp` (`lib/media/compress-image.ts`), mà `docx`
 * không nhận `webp` trực tiếp → chuyển sang PNG bằng `sharp` trước khi đưa vào `ImageRun`.
 * Lỗi giải mã (file hỏng, định dạng lạ) → trả `null`, .docx thiếu ảnh nhưng vẫn xuất được.
 */
async function dataUrlToBuffer(
  dataUrl: string | null | undefined,
): Promise<{ buffer: Buffer; type: 'jpg' | 'png' | 'gif' | 'bmp' } | null> {
  if (!dataUrl?.startsWith('data:')) return null;
  const match = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl);
  if (!match) return null;

  const mime = match[1].toLowerCase();
  let raw: Buffer;
  try {
    raw = Buffer.from(match[2], 'base64');
  } catch {
    return null;
  }

  const nativeType = DOCX_IMAGE_TYPE[mime];
  if (nativeType) return { buffer: raw, type: nativeType };

  try {
    const sharp = (await import('sharp')).default;
    const png = await sharp(raw).png().toBuffer();
    return { buffer: png, type: 'png' };
  } catch {
    return null;
  }
}

/**
 * Nạp nhân viên + công ty cho tài liệu hồ sơ, dùng chung đúng luật phân quyền của `GET /:id`
 * (kể cả ngoại lệ own-row / xem hồ sơ của chính mình).
 */
async function loadProfileDocumentContext(c: Parameters<typeof assertNhanVienPermission>[0]) {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return { error: c.json({ error: 'Invalid id' }, 400) } as const;

  const employee = await findEmployeeById(id);
  if (!employee) return { error: c.json({ error: 'Not found' }, 404) } as const;

  const denied = await assertNhanVienPermission(c, 'xem', {
    recordNguoiTao: employee.nguoi_tao,
    recordId: employee.id,
  });
  if (denied) return { error: denied } as const;

  const companyRow = await findCompany();
  const logo = await inlineUploadImage(companyRow?.logo ?? null);
  const photo = await inlineUploadImage(employee.anh_dai_dien ?? null);

  const company: CompanyDocInfo = {
    companyName: companyRow?.ten_cong_ty ?? '',
    address: companyRow?.dia_chi ?? null,
    email: companyRow?.email ?? null,
    phone: companyRow?.so_dien_thoai ?? null,
    logo,
  };

  const model = buildServerProfileModel(
    // repository trả `trang_thai: string`, client type hẹp hơn — cùng dữ liệu, thu hẹp tại đây
    { ...employee, anh_dai_dien: photo ?? undefined } as EmployeeDoc,
    company,
    formatServerDateTime(new Date()),
  );

  const baseName = `Ho_so_${safeFileName(employee.ho_ten)}_${employee.id}`;
  return { employee, model, baseName } as const;
}

/** `filename*=UTF-8''…` để tên file tiếng Việt không bị hỏng trên mọi trình duyệt */
function attachmentHeader(fileName: string): string {
  return `attachment; filename="${fileName.replace(/[^\x20-\x7e]/g, '_')}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

nhanVienRoutes.get('/:id/ho-so.pdf', async (c) => {
  const ctx = await loadProfileDocumentContext(c);
  if ('error' in ctx) return ctx.error;

  const html = await buildEmployeeProfileFullHTML(ctx.model);
  const pdf = await renderHtmlToPdf(html, {
    headerText: `${ctx.model.heading.title} · ${ctx.model.heading.name} · ${ctx.model.heading.codeLabel} ${ctx.model.heading.code}`,
  });

  return new Response(new Uint8Array(pdf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': attachmentHeader(`${ctx.baseName}.pdf`),
      'Cache-Control': 'no-store',
    },
  });
});

nhanVienRoutes.get('/:id/ho-so.docx', async (c) => {
  const ctx = await loadProfileDocumentContext(c);
  if ('error' in ctx) return ctx.error;

  const [photo, logo] = await Promise.all([
    dataUrlToBuffer(ctx.model.photo),
    dataUrlToBuffer(ctx.model.company.logo),
  ]);

  const docx = await buildEmployeeProfileDocx(ctx.model, {
    photo: photo?.buffer ?? null,
    photoType: photo?.type,
    logo: logo?.buffer ?? null,
    logoType: logo?.type,
  });

  return new Response(new Uint8Array(docx), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': attachmentHeader(`${ctx.baseName}.docx`),
      'Cache-Control': 'no-store',
    },
  });
});

nhanVienRoutes.get('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const employee = await findEmployeeById(id);
  if (!employee) return c.json({ error: 'Not found' }, 404);

  const denied = await assertNhanVienPermission(c, 'xem', {
    recordNguoiTao: employee.nguoi_tao,
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
  const session = c.get('session');

  try {
    const employee = await createOne(body, session.employee_id);
    return c.json(employee, 201);
  } catch (err) {
    return c.json({ error: translateCreateError(err, UNIQUE_MESSAGE) }, 400);
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
  const session = c.get('session');

  const result = await runBulkImport(
    items,
    async (item) => {
      const parsed = createBodySchema.safeParse(item);
      if (!parsed.success) {
        throw new Error(bulkImportZodMessage(parsed.error));
      }
      await createOne(parsed.data, session.employee_id);
    },
    (err) => translateCreateError(err, UNIQUE_MESSAGE),
  );
  return c.json(result);
});

/** Bulk status — must be registered before /:id */
nhanVienRoutes.patch('/status/bulk', async (c) => {
  const denied = await assertNhanVienPermission(c, 'sua');
  if (denied) return denied;

  const raw = await c.req.json().catch(() => ({}));
  const idsRaw = Array.isArray(raw.ids) ? raw.ids : [];
  const ids = idsRaw.map((v: unknown) => Number(v)).filter((n: number) => Number.isFinite(n));
  const trangThai = String(raw.trang_thai ?? '').trim();
  if (ids.length === 0 || !trangThai) {
    return c.json({ error: 'ids và trang_thai là bắt buộc' }, 400);
  }

  const items = await updateEmployeeStatusMany(ids, trangThai);
  return c.json({ items, total: items.length });
});

nhanVienRoutes.patch('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  // Một query thay cho getEmployeeNguoiTao: vừa làm cổng own-row, vừa là snapshot
  // app-shaped để phân quyền theo trường so diff.
  const current = await findEmployeeById(id);
  if (!current) return c.json({ error: 'Not found' }, 404);

  const denied = await assertNhanVienPermission(c, 'sua', {
    recordNguoiTao: current.nguoi_tao ?? null,
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
    tai_khoan:
      body.ten_dang_nhap != null || body.tai_khoan != null
        ? String(body.ten_dang_nhap ?? body.tai_khoan)
            .trim()
            .toLowerCase()
        : undefined,
    mat_khau_hash: matKhauHash,
    email: body.email != null ? String(body.email) : undefined,
    email_ca_nhan: body.email_ca_nhan,
    so_dien_thoai: body.so_dien_thoai != null ? String(body.so_dien_thoai) : undefined,
    gioi_tinh: body.gioi_tinh != null ? String(body.gioi_tinh) : undefined,
    ngay_sinh: body.ngay_sinh,
    so_cccd: body.so_cccd,
    ngay_cap_cccd: body.ngay_cap_cccd,
    noi_cap_cccd: body.noi_cap_cccd,
    dia_chi_thuong_tru: body.dia_chi_thuong_tru,
    dia_chi_hien_tai: body.dia_chi_hien_tai,
    que_quan: body.que_quan,
    dan_toc: body.dan_toc,
    ton_giao: body.ton_giao,
    tinh_trang_hon_nhan: body.tinh_trang_hon_nhan,
    quoc_tich: body.quoc_tich,
    ngay_vao_lam: body.ngay_vao_lam,
    ngay_chinh_thuc: body.ngay_chinh_thuc,
    ngay_nghi_viec: body.ngay_nghi_viec,
    ly_do_nghi: body.ly_do_nghi,
    so_tai_khoan: body.so_tai_khoan,
    ten_chu_tai_khoan: body.ten_chu_tai_khoan,
    ngan_hang: body.ngan_hang,
    chi_nhanh: body.chi_nhanh,
    nguoi_lien_he_khan: body.nguoi_lien_he_khan,
    sdt_khan: body.sdt_khan,
    moi_quan_he: body.moi_quan_he,
    so_so_bhxh: body.so_so_bhxh,
    so_bhyt: body.so_bhyt,
    ma_so_thue_ca_nhan: body.ma_so_thue_ca_nhan,
    trinh_do: body.trinh_do,
    chuyen_nganh: body.chuyen_nganh,
    truong: body.truong,
    phong_ban_id: body.phong_ban_id,
    chuc_vu_id: body.chuc_vu_id,
    // Suy ra từ chức vụ SAU thay đổi; body.cap_bac bị bỏ qua hoàn toàn.
    cap_bac:
      body.chuc_vu_id !== undefined
        ? await resolveCapBacFromChucVu(body.chuc_vu_id)
        : undefined,
    trang_thai: body.trang_thai,
    anh_dai_dien:
      body.anh_dai_dien !== undefined
        ? body.anh_dai_dien
        : body.hinh_anh !== undefined
          ? body.hinh_anh
          : undefined,
    must_change_password: mustChangePassword,
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
  const ids = idsRaw.map((v: unknown) => Number(v)).filter((n: number) => Number.isFinite(n));
  if (ids.length === 0) return c.json({ error: 'ids là bắt buộc' }, 400);

  const count = await deleteEmployeesMany(ids);
  return c.json({ ok: true, count });
});

nhanVienRoutes.delete('/:id', async (c) => {
  const id = Number(c.req.param('id'));
  if (!Number.isFinite(id)) return c.json({ error: 'Invalid id' }, 400);

  const denied = await assertNhanVienPermission(c, 'xoa');
  if (denied) return denied;

  const ok = await deleteEmployee(id);
  if (!ok) return c.json({ error: 'Not found' }, 404);
  return c.json({ ok: true });
});

export { nhanVienRoutes };
