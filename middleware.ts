import { NextResponse, type NextRequest } from 'next/server';

const AUTH_COOKIE = 'werkbank-auth';

/**
 * Einfache Cookie-basierte Authentifizierung.
 * Kein Supabase erforderlich — nur SITE_PASSWORD Umgebungsvariable.
 */
export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;

  // Öffentliche Pfade überspringen
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/kunden') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js)$/)
  ) {
    return NextResponse.next();
  }

  const authCookie = request.cookies.get(AUTH_COOKIE)?.value;
  const sitePassword = process.env.SITE_PASSWORD;

  // Eingeloggt: weiterleiten
  if (authCookie && sitePassword && authCookie === sitePassword) {
    return NextResponse.next();
  }

  // Nicht eingeloggt: zur Login-Seite
  const loginUrl = new URL('/login', request.url);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
