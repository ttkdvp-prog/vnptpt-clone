/**
 * Phân quyền theo TỪNG TRƯỜNG cho `PATCH /nhan-vien/:id`.
 *
 * Bối cảnh: `assertNhanVienPermission` cho phép `isSelf` bypass 403 ở action
 * `xem`/`sua` — đó là thứ duy nhất cho phép một nhân viên chỉ có quyền `xem`
 * sửa được hồ sơ của chính mình (đổi ảnh đại diện ở views/Profile.tsx). Nhưng
 * route lại nhận cả `cap_bac` từ body, nên bypass đó biến thành đường leo quyền:
 * ai đăng nhập được cũng `PATCH /nhan-vien/<id mình> {"cap_bac":1}` để thành
 * super admin (`cap_bac === 1` là cổng super ở assert-module.ts).
 *
 * KHÔNG sửa bằng cách xoá `isSelf` — làm vậy là vỡ chức năng tự đổi ảnh của mọi
 * nhân viên thường. Cũng KHÔNG sửa bằng luật "403 nếu body CÓ cap_bac", vì
 * `views/Profile.tsx:143` gửi `employeeToFormValues(emp)` tức TOÀN BỘ form, và
 * `nhan-vien-service.ts:643` luôn kèm `cap_bac: before.cap_bac ?? null` — payload
 * hợp lệ luôn chứa các trường đặc quyền ở đúng giá trị cũ.
 *
 * Vì vậy: phân quyền theo DIFF. Một trường chỉ tiêu tốn quyền khi giá trị đã
 * chuẩn hoá của nó KHÁC giá trị hiện có trong DB. Gửi lại giá trị cũ là no-op.
 *
 * So sánh thực hiện ở KHÔNG GIAN APP: payload client là app-shaped, và snapshot
 * truyền vào là `findEmployeeById()` cũng app-shaped, nên không cần bảng chuẩn
 * hoá DB. `employeeToFormValues` là pass-through thuần nên round-trip trung thực.
 */

export type EmployeeFieldTier = 'self' | 'sua' | 'admin';

/** Client gửi nhiều tên cho cùng một cột — quy về một tên trước khi tra tầng. */
const FIELD_ALIASES: Readonly<Record<string, string>> = {
  ho_va_ten: 'ho_ten',
  tai_khoan: 'ten_dang_nhap',
  hinh_anh: 'anh_dai_dien',
  mat_khau: 'mat_khau_tam',
};

/**
 * `cap_bac` CỐ Ý không có trong bảng này: nó được SUY RA từ `chuc_vu.cap_bac` ở
 * route và giá trị trong body bị bỏ qua hoàn toàn. Nhờ vậy client cũ gửi kèm
 * `cap_bac` vẫn chạy (không 403) mà đường leo quyền thì đóng vĩnh viễn.
 * Vector escalation dời sang `chuc_vu_id` — và trường đó ở tầng `admin`.
 *
 * `nguoi_tao` cũng không có: nó không nằm trong schema body lẫn
 * `NhanVienUpdateInput`, nên zod strip sẵn. Giữ nguyên như vậy.
 */
export const EMPLOYEE_FIELD_TIERS: Readonly<Record<string, EmployeeFieldTier>> = {
  // ─── ADMIN: danh tính đăng nhập, mật khẩu, và những gì quyết định quyền ───
  ten_dang_nhap: 'admin',
  mat_khau_tam: 'admin',
  must_change_password: 'admin',
  // Chức vụ quyết định cả ma trận quyền lẫn `cap_bac` suy ra ⇒ tự gán là leo quyền.
  chuc_vu_id: 'admin',

  // ─── SELF: đúng phần self-service hợp lệ ───
  anh_dai_dien: 'self',
  so_dien_thoai: 'self',
  email_ca_nhan: 'self',
  dia_chi_hien_tai: 'self',
  nguoi_lien_he_khan: 'self',
  sdt_khan: 'self',
  moi_quan_he: 'self',

  // ─── SUA: dữ liệu HR-of-record (lên hợp đồng / lương / BHXH) ───
  ho_ten: 'sua',
  email: 'sua',
  gioi_tinh: 'sua',
  ngay_sinh: 'sua',
  so_cccd: 'sua',
  ngay_cap_cccd: 'sua',
  noi_cap_cccd: 'sua',
  dia_chi_thuong_tru: 'sua',
  que_quan: 'sua',
  dan_toc: 'sua',
  ton_giao: 'sua',
  tinh_trang_hon_nhan: 'sua',
  quoc_tich: 'sua',
  ngay_vao_lam: 'sua',
  ngay_chinh_thuc: 'sua',
  ngay_nghi_viec: 'sua',
  ly_do_nghi: 'sua',
  so_tai_khoan: 'sua',
  ten_chu_tai_khoan: 'sua',
  ngan_hang: 'sua',
  chi_nhanh: 'sua',
  so_so_bhxh: 'sua',
  so_bhyt: 'sua',
  ma_so_thue_ca_nhan: 'sua',
  trinh_do: 'sua',
  chuyen_nganh: 'sua',
  truong: 'sua',
  // Không nâng quyền được, chỉ thu hồi — để `sua` cho HR làm việc hàng ngày.
  trang_thai: 'sua',
  phong_ban_id: 'sua',
};

/**
 * Bản ghi hiện tại ở dạng app (`findEmployeeById`). Chỉ các key trong bảng trên
 * được đọc. Nhận `object` thay vì `Record<string, unknown>` để interface không
 * có index signature (`Employee`, `AppEmployee`) gán được mà không cần cast ở
 * call site — đổi lại một cast nội bộ ở `readField`.
 */
export type EmployeeAuthzSnapshot = object;

function readField(source: object, field: string): unknown {
  return (source as Record<string, unknown>)[field];
}

export interface EmployeeUpdateClassification {
  /** Trường đã đổi, cần token `sua` trên module (hoặc own-row/admin). */
  requiresSua: string[];
  /** Trường đã đổi, cần super hoặc quản trị module. */
  requiresAdmin: string[];
  /** Body mang mật khẩu mới (không phải diff — có là tính). */
  carriesPassword: boolean;
}

/**
 * Chuẩn hoá để so sánh: `''`, `null`, `undefined` coi như nhau (repository dùng
 * nullish-trim nên chuỗi rỗng và null không phân biệt được ở tầng dữ liệu).
 * Trả `null` cho "không có giá trị".
 */
function normalizeForCompare(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === 'boolean') return value ? '1' : '0';
  const s = String(value).trim();
  return s === '' ? null : s;
}

/** Tên đăng nhập được repository ghi ở dạng trim + lowercase. */
function normalizeLoginForCompare(value: unknown): string | null {
  const s = normalizeForCompare(value);
  return s == null ? null : s.toLowerCase();
}

function isChanged(field: string, incoming: unknown, current: unknown): boolean {
  if (field === 'ten_dang_nhap') {
    return normalizeLoginForCompare(incoming) !== normalizeLoginForCompare(current);
  }
  return normalizeForCompare(incoming) !== normalizeForCompare(current);
}

/**
 * Phân loại một body PATCH thành các nhóm quyền cần có.
 *
 * Thuần, không I/O — theo tiền lệ `server/permissions/thong-bao-acl.ts`, để test
 * được toàn bộ ma trận trường mà không cần dựng context hay DB.
 */
export function classifyEmployeeUpdate(
  body: object,
  snapshot: EmployeeAuthzSnapshot,
): EmployeeUpdateClassification {
  const requiresSua = new Set<string>();
  const requiresAdmin = new Set<string>();
  let carriesPassword = false;

  for (const [rawKey, incoming] of Object.entries(body)) {
    if (incoming === undefined) continue;

    const field = FIELD_ALIASES[rawKey] ?? rawKey;

    // Mật khẩu không so diff (DB chỉ có hash) — có giá trị non-empty là tính.
    if (field === 'mat_khau_tam') {
      if (normalizeForCompare(incoming) != null) carriesPassword = true;
      continue;
    }

    const tier = EMPLOYEE_FIELD_TIERS[field];
    // Không nằm trong bảng ⇒ hoặc là `cap_bac` (bị bỏ qua có chủ ý), hoặc là key
    // lạ đã bị zod strip. Không yêu cầu quyền gì.
    if (!tier || tier === 'self') continue;

    if (!isChanged(field, incoming, readField(snapshot, field))) continue;

    if (tier === 'admin') requiresAdmin.add(field);
    else requiresSua.add(field);
  }

  return {
    requiresSua: [...requiresSua],
    requiresAdmin: [...requiresAdmin],
    carriesPassword,
  };
}
