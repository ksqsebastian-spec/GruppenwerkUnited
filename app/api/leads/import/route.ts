import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { upsertLeads } from '@/lib/database/leads';
import Papa from 'papaparse';
import type { LeadInsert } from '@/types';

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'Keine Datei' }, { status: 400 });

    const text = await file.text();
    const { data: rows, errors } = Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
    });

    if (errors.length > 0 && rows.length === 0) {
      return NextResponse.json({ error: 'CSV konnte nicht gelesen werden' }, { status: 400 });
    }

    const leads: Omit<LeadInsert, 'company'>[] = rows.map((row) => ({
      vorname: row['First Name'] ?? row['Vorname'] ?? row['first_name'] ?? '',
      nachname: row['Last Name'] ?? row['Nachname'] ?? row['last_name'] ?? '',
      email: row['Email'] ?? row['email'] ?? null,
      telefon: row['Phone'] ?? row['Telefon'] ?? row['phone'] ?? null,
      firma: row['Company'] ?? row['Firma'] ?? row['company'] ?? null,
      position: row['Title'] ?? row['Position'] ?? row['title'] ?? null,
      linkedin_url: row['LinkedIn URL'] ?? row['LinkedIn'] ?? row['linkedin_url'] ?? null,
      stadt: row['City'] ?? row['Stadt'] ?? row['city'] ?? null,
      land: row['Country'] ?? row['Land'] ?? row['country'] ?? null,
      branche: row['Industry'] ?? row['Branche'] ?? row['industry'] ?? null,
      notizen: row['Notes'] ?? row['Notizen'] ?? row['notes'] ?? null,
      status: 'neu' as const,
      prioritaet: 'mittel' as const,
      tags: [] as string[],
      naechste_aktion: null,
      letzter_kontakt: null,
    }));

    const imported = await upsertLeads(session.companyId, leads);
    return NextResponse.json({ imported, total: leads.length });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
