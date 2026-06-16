import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { fetchCustomer, updateCustomer, deleteCustomer } from '@/lib/database/customers';
import { customerUpdateSchema } from '@/lib/validations/customer';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  try {
    const row = await fetchCustomer(id, session.companyId);
    if (!row) return NextResponse.json({ error: 'Kunde nicht gefunden' }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültiges JSON' }, { status: 400 });
  }

  const parsed = customerUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Ungültige Eingabe';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  // Leere Strings für optionale Felder auf null normalisieren
  const nz = (v: string | null | undefined): string | null => (v && v.length > 0 ? v : null);
  const updates: Record<string, unknown> = {};
  if (parsed.data.firmenname !== undefined) updates.firmenname = parsed.data.firmenname;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;
  if (parsed.data.ansprechpartner !== undefined) updates.ansprechpartner = nz(parsed.data.ansprechpartner);
  if (parsed.data.email !== undefined) updates.email = nz(parsed.data.email);
  if (parsed.data.telefon !== undefined) updates.telefon = nz(parsed.data.telefon);
  if (parsed.data.webseite !== undefined) updates.webseite = nz(parsed.data.webseite);
  if (parsed.data.adresse !== undefined) updates.adresse = nz(parsed.data.adresse);
  if (parsed.data.strasse !== undefined) updates.strasse = nz(parsed.data.strasse);
  if (parsed.data.plz !== undefined) updates.plz = nz(parsed.data.plz);
  if (parsed.data.ort !== undefined) updates.ort = nz(parsed.data.ort);
  if (parsed.data.land !== undefined) updates.land = nz(parsed.data.land);
  if (parsed.data.kundennummer !== undefined) updates.kundennummer = nz(parsed.data.kundennummer);
  if (parsed.data.ust_id !== undefined) updates.ust_id = nz(parsed.data.ust_id);
  if (parsed.data.steuernummer !== undefined) updates.steuernummer = nz(parsed.data.steuernummer);
  if (parsed.data.zahlungsziel !== undefined) updates.zahlungsziel = nz(parsed.data.zahlungsziel);
  if (parsed.data.notizen !== undefined) updates.notizen = nz(parsed.data.notizen);

  try {
    const row = await updateCustomer(id, session.companyId, updates);
    return NextResponse.json(row);
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Fehler' }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { id } = await params;
  try {
    await deleteCustomer(id, session.companyId);
    return new NextResponse(null, { status: 204 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
