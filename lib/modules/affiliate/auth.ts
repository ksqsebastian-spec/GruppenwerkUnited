import { NextResponse } from 'next/server';
import { requireSession, requireAdminSession } from '@/lib/auth/api';
import type { SessionData } from '@/lib/auth/session';

export { validateOrigin, getAllowedOrigins } from '@/lib/api-guards';

/** Auth-Ergebnis für Affiliate API-Routes */
export interface AffiliateAuthResult {
  companyId: string;
  companyName: string;
  isAdmin: boolean;
  /** companyId als userId für Audit-Logs */
  user: { id: string };
}

function toResult(session: SessionData): AffiliateAuthResult {
  return {
    companyId: session.companyId,
    companyName: session.companyName,
    isAdmin: session.isAdmin,
    user: { id: session.companyId },
  };
}

export async function requireAuth(): Promise<AffiliateAuthResult | NextResponse> {
  const result = await requireSession();
  if (result instanceof NextResponse) return result;
  return toResult(result);
}

export async function requireAdmin(): Promise<AffiliateAuthResult | NextResponse> {
  const result = await requireAdminSession();
  if (result instanceof NextResponse) return result;
  return toResult(result);
}
