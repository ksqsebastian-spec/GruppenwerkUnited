import { type NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE = 'werkbank-auth';

/**
 * Werkbank Proxy — Cookie-basiertes Passwort-Gate
 * Authentifizierung via SITE_PASSWORD Umgebungsvariable.
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Öffentliche Pfade überspringen
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/kunden')
  ) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get(AUTH_COOKIE)?.value;
  const sitePassword = process.env.SITE_PASSWORD;

  if (sitePassword && authCookie === sitePassword) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
