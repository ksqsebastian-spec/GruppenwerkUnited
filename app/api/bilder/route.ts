import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { fetchBilder, uploadBild, publicBildUrl } from '@/lib/database/bilder';
import { bildMetaSchema } from '@/lib/validations/bild';
import type { Bild } from '@/types';

const MAX_BYTES = 20 * 1024 * 1024; // 20 MB
const ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
]);

interface BildMitUrl extends Bild {
  public_url: string;
}

function withUrl(b: Bild): BildMitUrl {
  return { ...b, public_url: publicBildUrl(b.dateipfad) };
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const url = new URL(req.url);
  const firmenTagsParam = url.searchParams.get('firmen_tags');
  const search = url.searchParams.get('search') ?? undefined;
  const firmenTags = firmenTagsParam ? firmenTagsParam.split(',').filter(Boolean) : undefined;

  try {
    const rows = await fetchBilder({ firmenTags, search });
    return NextResponse.json(rows.map(withUrl));
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
    return NextResponse.json({ error: 'Die Datei ist zu groß. Maximal 20 MB erlaubt.' }, { status: 400 });
  }
  if (file.type && !ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Nur Bilder erlaubt (JPG, PNG, WebP, GIF, SVG).' }, { status: 400 });
  }
  if (file.name.includes('..') || file.name.includes('/')) {
    return NextResponse.json({ error: 'Ungültiger Dateiname.' }, { status: 400 });
  }

  const firmenTagsRaw = (form.get('firmen_tags') as string | null) ?? '';
  const parsed = bildMetaSchema.safeParse({
    titel: (form.get('titel') as string | null) ?? '',
    beschreibung: (form.get('beschreibung') as string | null) ?? '',
    firmen_tags: firmenTagsRaw.split(',').map((s) => s.trim()).filter(Boolean),
    uploaded_by: (form.get('uploaded_by') as string | null) ?? '',
  });
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? 'Ungültige Eingabe';
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const nz = (v: string | null | undefined): string | null => (v && v.length > 0 ? v : null);

  try {
    const row = await uploadBild(
      session.companyId,
      {
        titel: nz(parsed.data.titel),
        beschreibung: nz(parsed.data.beschreibung),
        firmen_tags: parsed.data.firmen_tags,
        uploaded_by: parsed.data.uploaded_by,
      },
      file,
    );
    return NextResponse.json(withUrl(row), { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Fehler' }, { status: 500 });
  }
}
