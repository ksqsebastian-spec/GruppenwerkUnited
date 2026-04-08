import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/**
 * Werkbank Proxy (ehemals Middleware)
 *
 * Phase 1: Supabase-Session-basierter Schutz (geteilter Account).
 * Phase 2 (geplant): Cookie-Gate mit APP_PASSWORD env-Variable,
 *   damit auch Module ohne Supabase-Auth geschützt werden können.
 *
 * Nicht geschützte Pfade: /login, /api/*, statische Assets
 */
export async function proxy(request: NextRequest): Promise<NextResponse> {
  return updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Alle Routen abgleichen außer:
     * - _next/static  (statische Dateien)
     * - _next/image   (Bildoptimierung)
     * - favicon.ico, Bilddateien
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
