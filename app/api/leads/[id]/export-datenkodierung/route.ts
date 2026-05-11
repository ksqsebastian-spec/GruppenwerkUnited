import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import sql from '@/lib/db';
import { generateCode } from '@/lib/datenkodierung/code-generator';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const leads = await sql`
    SELECT * FROM leads WHERE id = ${id} AND company = ${session.companyId} LIMIT 1
  `;
  const lead = leads[0];

  if (!lead) {
    return NextResponse.json({ error: 'Lead nicht gefunden' }, { status: 404 });
  }

  const name =
    [lead.vorname, lead.nachname].filter(Boolean).join(' ').trim() ||
    lead.firma ||
    'Unbekannt';

  const adresse =
    [
      lead.firma,
      lead.position,
      lead.email,
      lead.telefon,
      [lead.stadt, lead.land].filter(Boolean).join(', '),
    ]
      .filter(Boolean)
      .join('\n') || null;

  const tags: string[] = [...new Set([...(lead.tags ?? []), 'CRM-Lead'])];

  for (let attempt = 0; attempt < 3; attempt++) {
    const code = generateCode();
    try {
      const rows = await sql`
        INSERT INTO datenkodierungen ${sql({ code, name, adresse, notizen: lead.notizen ?? null, tags, company: session.companyId } as Record<string, unknown>)}
        RETURNING id, code
      `;
      if (rows[0]) return NextResponse.json({ code: rows[0].code, id: rows[0].id });
    } catch (err: unknown) {
      const pg = err as { code?: string };
      if (pg.code !== '23505') {
        return NextResponse.json({ error: 'Export fehlgeschlagen' }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ error: 'Code-Generierung fehlgeschlagen' }, { status: 500 });
}
