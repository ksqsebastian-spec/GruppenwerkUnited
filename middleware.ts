import { NextResponse, type NextRequest } from 'next/server';
import { SESSION_COOKIE, decodeSession } from '@/lib/auth/session';
import { COMPANY_CONFIGS, ROUTE_TO_MODULE } from '@/lib/auth/companies';

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  // Öffentliche Routen — kein Auth nötig
  if (pathname.startsWith('/login') || pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  // API-Routen prüfen nur ihre eigene Auth
  if (pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await decodeSession(token) : null;

  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Modul-Zugriffsschutz: prüfen ob die Firma das Modul nutzen darf
  const moduleId = Object.entries(ROUTE_TO_MODULE).find(([prefix]) =>
    pathname === prefix || pathname.startsWith(prefix + '/')
  )?.[1];

  if (moduleId) {
    const company = COMPANY_CONFIGS.find((c) => c.id === session.companyId);
    const allowed = company?.isAdmin || company?.modules.includes('*') || company?.modules.includes(moduleId);
    if (!allowed) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
};
