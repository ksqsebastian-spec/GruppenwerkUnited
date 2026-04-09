import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/api';
import { getAllowedModules } from '@/lib/auth/companies';
import { COMPANY_CONFIGS } from '@/lib/auth/companies';

/** Gibt den aktuellen Firmen-Kontext zurück (für Client-Komponenten) */
export async function GET(): Promise<NextResponse> {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: 'Nicht eingeloggt' }, { status: 401 });
  }

  const company = COMPANY_CONFIGS.find((c) => c.id === session.companyId);
  const modules = company ? getAllowedModules(company) : [];

  return NextResponse.json({
    companyId: session.companyId,
    companyName: session.companyName,
    isAdmin: session.isAdmin,
    modules,
  });
}
