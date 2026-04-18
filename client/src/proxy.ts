import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protected route prefixes — everything else is public
const AUTH_PATHS = ['/dashboard', '/favorites', '/company', '/admin', '/application'];

function requiresAuth(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

// Next.js 16: export edilen fonksiyon "proxy" olarak adlandırılmalı
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth bilgisini cookie üzerinden kontrol edemeyiz (access token memory'de).
  // Proxy'de sadece refresh_token cookie'sinin varlığını görebiliriz —
  // yoksa kesinlikle oturum açık değildir.
  const hasRefreshToken = request.cookies.has('refresh_token');

  // Oturum gerektiren sayfaya refresh token olmadan giriş
  if (requiresAuth(pathname) && !hasRefreshToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Not: COMPANY_USER / ADMIN rol kontrolü client tarafında RouteGuard
  // bileşeni ile yapılır. Proxy yalnızca temel auth varlığını kontrol eder.

  return NextResponse.next();
}

export const config = {
  matcher: [
    // API route'ları, static dosyalar ve Next.js internal path'leri hariç tut
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
