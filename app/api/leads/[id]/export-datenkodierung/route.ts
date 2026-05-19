import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateCode } from '@/lib/datenkodierung/code-generator';

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', id)
    .eq('company', session.companyId)
    .single();

  if (leadError || !lead) {
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
    const { data, error } = await supabase
      .from('datenkodierungen')
      .insert({ code, name, adresse, notizen: lead.notizen ?? null, tags, company: session.companyId })
      .select('id, code')
      .single();

    if (!error) return NextResponse.json({ code: data.code, id: data.id });
    if (error.code !== '23505') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Code-Generierung fehlgeschlagen' }, { status: 500 });
}
