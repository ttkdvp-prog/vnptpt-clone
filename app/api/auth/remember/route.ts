import { NextResponse, type NextRequest } from 'next/server';
import { isSessionTokenCookieName } from '@/lib/employee-auth/session-lifetime';

/**
 * Hạ cookie phiên của Auth.js xuống "session cookie" khi người dùng bỏ tick
 * "Ghi nhớ đăng nhập" — đóng trình duyệt là mất phiên.
 *
 * Auth.js luôn set cookie kèm `expires` theo `session.maxAge` tĩnh, không có chỗ
 * cấu hình theo từng lần đăng nhập. Route này ghi đè lại đúng cookie đó với cùng
 * giá trị token nhưng bỏ `expires`/`maxAge`.
 *
 * Chỉ RÚT NGẮN tuổi thọ cookie, không bao giờ kéo dài — nên gọi được từ luồng
 * đăng nhập công khai mà không mở thêm bề mặt tấn công. Client gọi ngay sau
 * `signIn()` thành công.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let remember = true;
  try {
    const body: unknown = await request.json();
    remember = (body as { remember?: unknown } | null)?.remember !== false;
  } catch {
    // Body rỗng/không phải JSON → giữ mặc định ghi nhớ, không đụng cookie.
  }

  const response = NextResponse.json({ ok: true, remember });
  if (remember) return response;

  const secureRequest = request.nextUrl.protocol === 'https:';
  for (const cookie of request.cookies.getAll()) {
    if (!isSessionTokenCookieName(cookie.name)) continue;
    response.cookies.set({
      name: cookie.name,
      value: cookie.value,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: secureRequest || cookie.name.startsWith('__Secure-'),
      // Cố tình không set expires/maxAge → cookie phiên.
    });
  }
  return response;
}
