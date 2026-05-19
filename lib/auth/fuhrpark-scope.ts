/**
 * Fuhrpark-Tenant-Scoping.
 *
 * Übersetzt die Session (companyId/companyName) in die Fuhrpark-Tabellen-UUID
 * und stellt sicher, dass clients keinen fremden companyId-Parameter
 * unterjubeln können (Multi-Tenant-Isolation).
 *
 * Admins erhalten null → kein Filter, alle Daten sichtbar.
 */

import { NextResponse } from 'next/server';
import { requireSession } from './api';
import { getOrCreateFuhrparkCompany } from '@/lib/database/companies';
import type { SessionData } from './session';

export interface FuhrparkScope {
  session: SessionData;
  /** UUID der Firma in der `companies`-Tabelle, oder null für Admins (kein Filter) */
  companyId: string | null;
}

/**
 * Auth + Fuhrpark-Tenant-Scope in einem Schritt.
 * Gibt NextResponse (401) zurück wenn nicht eingeloggt.
 *
 * Admins: companyId = null → keine Filterung, alle Daten sichtbar.
 * Mandanten: companyId = ihre UUID → alle Queries müssen damit filtern.
 */
export async function requireFuhrparkScope(): Promise<FuhrparkScope | NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  if (session.isAdmin) {
    return { session, companyId: null };
  }

  const companyId = await getOrCreateFuhrparkCompany(session.companyName);
  return { session, companyId };
}
