/**
 * Auth-Hilfsfunktionen für API-Routes (Node.js Runtime).
 * Liest die Session aus dem httpOnly Cookie und gibt den Firmen-Kontext zurück.
 */

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, decodeSession, type SessionData } from './session';

/** Gibt SessionData oder null zurück (kein Error) */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return decodeSession(token);
}

/** Session erforderlich — gibt 401 zurück wenn nicht eingeloggt */
export async function requireSession(): Promise<SessionData | NextResponse> {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 });
  }
  return session;
}

/** Admin-Session erforderlich — gibt 403 zurück wenn keine Admin-Rechte */
export async function requireAdminSession(): Promise<SessionData | NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  if (!session.isAdmin) {
    return NextResponse.json(
      { error: 'Admin-Berechtigung erforderlich' },
      { status: 403 }
    );
  }
  return session;
}
