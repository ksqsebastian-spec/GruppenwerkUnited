import { type NextRequest, NextResponse } from 'next/server';
import { SESSION_COOKIE, decodeSession } from '@/lib/auth/session';
import { ROUTE_TO_MODULE, hasModuleAccess, COMPANY_CONFIGS } from '@/lib/auth/companies';

/**
 * Werkbank Proxy — Multi-Tenant Zugriffskontrolle
 *
 * Layer 1: Session-Cookie prüfen (HMAC-signiert)
 * Layer 2: Modul-Zugriff prüfen (Firma darf nur eigene Module sehen)
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Öffentliche Pfade — kein Auth nötig
  if (
    pathname === '/login' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/kunden')
  ) {
    return NextResponse.next();
  }

  // Session aus Cookie lesen und verifizieren
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await decodeSession(token) : null;

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Modul-Zugriff prüfen
  const company = COMPANY_CONFIGS.find((c) => c.id === session.companyId);
  if (!company) {
    // Unbekannte Firma — Session ungültig
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.cookies.delete(SESSION_COOKIE);
    return res;
  }

  // Prüfe ob die Route einem geschützten Modul gehört
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
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
