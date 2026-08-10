import { auth } from '@/auth';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const publicPaths = [
  '/dang-nhap',
  '/dang-ky',
  '/login',
  '/register',
  '/api/auth',
  '/health',
  '/uploads',
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Mock mode: auth nằm client-side (zustand + ProtectedRoute), không có cookie
  // Auth.js — bỏ gate server để deep-link không bị đá về /dang-nhap.
  if (process.env.NEXT_PUBLIC_DATA_SOURCE === 'mock') {
    return NextResponse.next();
  }

  if (
    publicPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // API routes under embedded Hono — auth checked in requireAuth
  if (
    pathname.startsWith('/phong-ban') ||
    pathname.startsWith('/chuc-vu') ||
    pathname.startsWith('/nhan-vien') ||
    pathname.startsWith('/cong-ty') ||
    pathname.startsWith('/phan-quyen') ||
    pathname.startsWith('/tai-lieu') ||
    pathname.startsWith('/uploads') ||
    pathname.startsWith('/auth/')
  ) {
    return NextResponse.next();
  }

  const session = await auth();
  if (!session?.user && pathname !== '/') {
    // Allow home through client ProtectedRoute for hydrate UX; protect deep links
    if (
      pathname.startsWith('/he-thong') ||
      pathname.startsWith('/ho-so') ||
      pathname.startsWith('/thong-bao') ||
      pathname.startsWith('/thong-tin-ban-quyen') ||
      pathname.startsWith('/doi-mat-khau') ||
      pathname.startsWith('/ho-so-nhan-vien') ||
      pathname.startsWith('/in-hop-dong')
    ) {
      const url = request.nextUrl.clone();
      url.pathname = '/dang-nhap';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|.*\\..*).*)'],
};
