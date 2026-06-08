import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { fetchCustomers, createCustomer } from '@/lib/database/customers';
import { customerSchema } from '@/lib/validations/customer';

export async function GET(): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  try {
    const rows = await fetchCustomers(session.companyId);
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }

  const parsed = customerSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Ungültige Eingabe';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Leere Strings für optionale Felder auf null normalisieren
  const nz = (v: string | null | undefined): string | null => (v && v.length > 0 ? v : null);
  const input = {
    firmenname: parsed.data.firmenname,
    ansprechpartner: nz(parsed.data.ansprechpartner),
    email: nz(parsed.data.email),
    telefon: nz(parsed.data.telefon),
    webseite: nz(parsed.data.webseite),
    adresse: nz(parsed.data.adresse),
    strasse: nz(parsed.data.strasse),
    plz: nz(parsed.data.plz),
    ort: nz(parsed.data.ort),
    land: nz(parsed.data.land),
    kundennummer: nz(parsed.data.kundennummer),
    ust_id: nz(parsed.data.ust_id),
    steuernummer: nz(parsed.data.steuernummer),
    zahlungsziel: nz(parsed.data.zahlungsziel),
    status: parsed.data.status,
    notizen: nz(parsed.data.notizen),
  };

  try {
    const row = await createCustomer(session.companyId, input);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Fehler' }, { status: 400 });
  }
}
