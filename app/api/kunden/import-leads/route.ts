import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { importLeadsAsCustomers } from '@/lib/database/customers';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  let body: { lead_ids?: unknown };
  try {
    body = (await req.json()) as { lead_ids?: unknown };
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }
  if (!Array.isArray(body.lead_ids) || body.lead_ids.some((id) => typeof id !== 'string')) {
    return NextResponse.json({ error: 'lead_ids muss ein String-Array sein' }, { status: 400 });
  }
  if (body.lead_ids.length === 0) {
    return NextResponse.json({ error: 'Keine Leads ausgewählt' }, { status: 400 });
  }
  if (body.lead_ids.length > 500) {
    return NextResponse.json({ error: 'Maximal 500 Leads pro Import' }, { status: 400 });
  }

  try {
    const result = await importLeadsAsCustomers(session.companyId, body.lead_ids as string[]);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Fehler' }, { status: 500 });
  }
}
