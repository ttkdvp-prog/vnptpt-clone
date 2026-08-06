import { Hono } from 'hono';
import bcrypt from 'bcryptjs';
import {
  clearSessionCookie,
  readSession,
  requireAuth,
  setSessionCookie,
  signSessionToken,
  type AuthVariables,
} from '../auth';
import { mapEmployeeFromDb, type DbNhanVien } from '../mappers';
import {
  findEmployeeAuthById,
  findEmployeeAuthByLogin,
  findEmployeePasswordHash,
  updateEmployeePassword,
  type EmployeeAuthCredential,
} from '@/server/repositories/nhan-vien';

const authRoutes = new Hono<{ Variables: AuthVariables }>();
const MIN_PASSWORD_LENGTH = 6;

function toDbNhanVien(row: EmployeeAuthCredential): DbNhanVien {
  return {
    id: row.id,
    ho_va_ten: row.ho_va_ten,
    hinh_anh: row.hinh_anh,
    email: row.email,
    so_dien_thoai: row.so_dien_thoai,
    gioi_tinh: row.gioi_tinh,
    trang_thai: row.trang_thai,
    id_chuc_vu: row.id_chuc_vu,
    id_phong_ban: row.id_phong_ban,
    cap_bac: row.cap_bac,
    tai_khoan: row.tai_khoan,
    must_change_password: row.must_change_password,
    nguoi_tao: row.nguoi_tao,
    tg_tao: row.tg_tao,
    tg_cap_nhat: row.tg_cap_nhat,
    ten_chuc_vu: row.chuc_vu?.ten_chuc_vu ?? null,
    ten_phong_ban: row.phong_ban?.ten_phong_ban ?? null,
  };
}

authRoutes.post('/login', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const taiKhoan = String(body.tai_khoan ?? body.username ?? '')
    .trim()
    .toLowerCase();
  const password = String(body.password ?? '');

  if (!taiKhoan || !password) {
    return c.json({ error: 'Vui lòng nhập tài khoản và mật khẩu' }, 400);
  }

  const row = await findEmployeeAuthByLogin(taiKhoan);

  if (!row) {
    return c.json({ error: 'Tài khoản hoặc mật khẩu không đúng' }, 401);
  }

  const ok = await bcrypt.compare(password, row.mat_khau);
  if (!ok) {
    return c.json({ error: 'Tài khoản hoặc mật khẩu không đúng' }, 401);
  }

  if (String(row.trang_thai).toUpperCase() === 'INACTIVE') {
    return c.json({ error: 'Tài khoản đã bị vô hiệu hóa' }, 403);
  }

  const employee = mapEmployeeFromDb(toDbNhanVien(row));
  const token = await signSessionToken({
    employee_id: employee.id,
    tai_khoan: employee.ten_dang_nhap ?? taiKhoan,
    cap_bac: employee.cap_bac ?? null,
  });
  setSessionCookie(c, token);

  return c.json({
    token,
    user: {
      id: `api-${employee.id}`,
      employee_id: employee.id,
      email: employee.email || `${employee.ten_dang_nhap}@local`,
      ten_dang_nhap: employee.ten_dang_nhap,
      full_name: employee.ho_ten,
      avatar_url: employee.anh_dai_dien,
      role: 'user',
      created_at: employee.tg_tao ?? new Date().toISOString(),
      id_phong_ban: employee.phong_ban_id ?? undefined,
      id_chuc_vu: employee.chuc_vu_id ? [employee.chuc_vu_id] : undefined,
      must_change_password: employee.must_change_password,
      tai_khoan_dang_hoat_dong: employee.tai_khoan_dang_hoat_dong,
      cap_bac: employee.cap_bac ?? null,
    },
    employee,
    mustChangePassword: employee.must_change_password,
  });
});

authRoutes.post('/logout', async (c) => {
  clearSessionCookie(c);
  return c.json({ ok: true });
});

authRoutes.get('/me', async (c) => {
  const session = await readSession(c);
  if (!session) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const row = await findEmployeeAuthById(Number(session.employee_id));

  if (!row) {
    clearSessionCookie(c);
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const employee = mapEmployeeFromDb(toDbNhanVien(row));
  return c.json({
    user: {
      id: `api-${employee.id}`,
      employee_id: employee.id,
      email: employee.email || `${employee.ten_dang_nhap}@local`,
      ten_dang_nhap: employee.ten_dang_nhap,
      full_name: employee.ho_ten,
      avatar_url: employee.anh_dai_dien,
      role: 'user',
      created_at: employee.tg_tao ?? new Date().toISOString(),
      id_phong_ban: employee.phong_ban_id ?? undefined,
      id_chuc_vu: employee.chuc_vu_id ? [employee.chuc_vu_id] : undefined,
      must_change_password: employee.must_change_password,
      tai_khoan_dang_hoat_dong: employee.tai_khoan_dang_hoat_dong,
      cap_bac: employee.cap_bac ?? null,
    },
    employee,
  });
});

authRoutes.post('/change-password', requireAuth, async (c) => {
  const session = c.get('session');
  const body = await c.req.json().catch(() => ({}));
  const currentPassword = String(body.current_password ?? '');
  const newPassword = String(body.new_password ?? '');

  if (!currentPassword) {
    return c.json({ error: 'Vui lòng nhập mật khẩu hiện tại' }, 400);
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return c.json({ error: `Mật khẩu mới phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự` }, 400);
  }
  if (currentPassword === newPassword) {
    return c.json({ error: 'Mật khẩu mới phải khác mật khẩu hiện tại' }, 400);
  }

  const employeeId = Number(session.employee_id);
  if (!Number.isFinite(employeeId)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const row = await findEmployeePasswordHash(employeeId);
  if (!row) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const ok = await bcrypt.compare(currentPassword, row.mat_khau);
  if (!ok) {
    return c.json({ error: 'Mật khẩu hiện tại không đúng' }, 401);
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await updateEmployeePassword(employeeId, hash);

  return c.json({ ok: true });
});

/**
 * Đặt mật khẩu KHÔNG cần mật khẩu cũ — chỉ dành riêng cho luồng buộc đổi lần đầu.
 *
 * Trước đây route này không kiểm điều kiện gì, nên một phiên bị chiếm là đặt được
 * mật khẩu mới và khoá chính chủ ra ngoài. Nay bắt buộc `must_change_password`
 * phải đang bật trong DB; mọi trường hợp khác dùng /change-password (có kiểm mật
 * khẩu hiện tại).
 */
authRoutes.post('/set-password', requireAuth, async (c) => {
  const session = c.get('session');
  const body = await c.req.json().catch(() => ({}));
  const newPassword = String(body.new_password ?? '');

  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return c.json({ error: `Mật khẩu mới phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự` }, 400);
  }

  const employeeId = Number(session.employee_id);
  if (!Number.isFinite(employeeId)) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const row = await findEmployeeAuthById(employeeId);
  if (!row) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  if (!row.must_change_password) {
    return c.json(
      { error: 'Tài khoản không ở trạng thái buộc đổi mật khẩu. Dùng chức năng đổi mật khẩu.' },
      403,
    );
  }

  const hash = await bcrypt.hash(newPassword, 10);
  await updateEmployeePassword(employeeId, hash);

  return c.json({ ok: true });
});

export { authRoutes };
