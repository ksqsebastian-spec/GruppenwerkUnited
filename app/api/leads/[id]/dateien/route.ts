import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchDateien, createDateiEintrag } from '@/lib/database/leads';

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;
  try {
    const data = await fetchDateien(id);
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id } = await params;

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return NextResponse.json({ error: 'Keine Datei' }, { status: 400 });
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Datei zu groß (max 10 MB)' }, { status: 400 });
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Ungültiges Dateiformat' }, { status: 400 });
    }

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const pfad = `${session.companyId}/${id}/${Date.now()}_${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const supabase = createAdminClient();
    const { error: uploadError } = await supabase.storage
      .from('lead-dateien')
      .upload(pfad, buffer, { contentType: file.type, upsert: false });

    if (uploadError) throw new Error('Upload fehlgeschlagen: ' + uploadError.message);

    const eintrag = await createDateiEintrag(id, session.companyId, {
      dateiname: file.name,
      dateipfad: pfad,
      dateityp: file.type,
      dateigroesse: file.size,
    });

    return NextResponse.json(eintrag, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
