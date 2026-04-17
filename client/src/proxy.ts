import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Route grupları
const PUBLIC_PATHS = ['/', '/search', '/login', '/register'];
const COMPANY_PATHS = ['/company'];
const ADMIN_PATHS = ['/admin'];
const AUTH_PATHS = ['/dashboard', '/favorites', '/company', '/admin'];

function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname)) return true;
  // /companies/:id de public
  if (pathname.startsWith('/companies/')) return true;
  return false;
}

function requiresAuth(pathname: string): boolean {
  return AUTH_PATHS.some((p) => pathname.startsWith(p));
}

function requiresCompanyRole(pathname: string): boolean {
  return COMPANY_PATHS.some((p) => pathname.startsWith(p));
}

function requiresAdminRole(pathname: string): boolean {
  return ADMIN_PATHS.some((p) => pathname.startsWith(p));
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

  // Zaten giriş yapmışken login/register sayfasına gitme
  if (hasRefreshToken && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
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
