import { NextResponse, type NextRequest } from 'next/server';

/**
 * Leerer Platzhalter — diese App nutzt KEIN Supabase Auth.
 *
 * Die Zugriffskontrolle erfolgt über den Werkbank-Proxy (proxy.ts / middleware.ts)
 * mit eigenem Cookie-basierten HMAC-Session-System.
 *
 * HINWEIS: supabase.auth.getUser() würde hier immer null zurückgeben,
 * da kein Supabase-Auth-JWT vorhanden ist. Daher wird diese Funktion
 * nicht mehr für Auth-Checks genutzt.
 */
export function updateSession(request: NextRequest): NextResponse {
  return NextResponse.next({ request: { headers: request.headers } });
}
