import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { fetchDateiVorlagen, uploadDateiVorlage } from '@/lib/database/customers';

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
  'text/markdown',
]);

export async function GET(): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  try {
    const rows = await fetchDateiVorlagen(session.companyId);
    return NextResponse.json(rows);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: 'Ungültiger Upload' }, { status: 400 });
  }

  const file = form.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Keine Datei übermittelt' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Die Datei ist zu groß. Maximal 10 MB erlaubt.' }, { status: 400 });
  }
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Dateiformat nicht erlaubt.' }, { status: 400 });
  }
  if (file.name.includes('..') || file.name.includes('/')) {
    return NextResponse.json({ error: 'Ungültiger Dateiname.' }, { status: 400 });
  }

  const rawName = (form.get('name') as string | null)?.trim();
  const kategorie = (form.get('kategorie') as string | null)?.trim() || null;
  const beschreibung = (form.get('beschreibung') as string | null)?.trim() || null;
  const name = rawName && rawName.length > 0 ? rawName : file.name.replace(/\.[^.]+$/, '');
  if (name.length > 120) {
    return NextResponse.json({ error: 'Name ist zu lang' }, { status: 400 });
  }

  try {
    const row = await uploadDateiVorlage(session.companyId, { name, kategorie, beschreibung }, file);
    return NextResponse.json(row, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Fehler' }, { status: 400 });
  }
}
