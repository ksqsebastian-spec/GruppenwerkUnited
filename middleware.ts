import { type NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, decodeSession } from '@/lib/auth/session';
import { ROUTE_TO_MODULE, hasModuleAccess, COMPANY_CONFIGS } from '@/lib/auth/companies';

/**
 * Werkbank Middleware — serverseitige Multi-Tenant-Zugriffskontrolle für Seiten.
 *
 * Layer 1: Session-Cookie prüfen (HMAC-signiert)
 * Layer 2: Modul-Zugriff prüfen (Firma darf nur eigene Module sehen)
 *
 * Hinweis: /api-Routen sind im Matcher ausgenommen — sie authentifizieren sich
 * selbst pro Route (requireSession / Header-Secrets) und antworten mit 401 statt
 * mit einem Redirect. So bleiben Cron-, Import- und Export-Endpunkte funktionsfähig.
 */
export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Öffentliche Seiten — kein Login nötig
  if (pathname === '/login' || pathname.startsWith('/kunden')) {
    return NextResponse.next();
  }

  // Session aus Cookie lesen und verifizieren
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await decodeSession(token) : null;

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Unbekannte Firma → Session ungültig
  const company = COMPANY_CONFIGS.find((c) => c.id === session.companyId);
  if (!company) {
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  // Modul-Zugriff prüfen: Firma ohne Berechtigung zurück zur Übersicht
  for (const [routePrefix, moduleId] of Object.entries(ROUTE_TO_MODULE)) {
    if (pathname === routePrefix || pathname.startsWith(routePrefix + '/')) {
      if (!hasModuleAccess(company, moduleId)) {
        return NextResponse.redirect(new URL('/', request.url));
      }
      break;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Alles außer /api, Next-Interna und statischen Assets
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
