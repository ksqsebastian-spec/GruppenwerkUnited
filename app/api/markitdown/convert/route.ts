import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { convertToMarkdown, extOf, SUPPORTED_EXTENSIONS } from '@/lib/markitdown/convert';

const MAX_BYTES = 20 * 1024 * 1024;
const SUPPORTED_SET = new Set<string>(SUPPORTED_EXTENSIONS);

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
  if (file.name.includes('..') || file.name.includes('/')) {
    return NextResponse.json({ error: 'Ungültiger Dateiname.' }, { status: 400 });
  }
  const ext = extOf(file.name);
  if (ext.length > 0 && !SUPPORTED_SET.has(ext)) {
    return NextResponse.json(
      { error: `Dateityp ${ext} wird nicht unterstützt. Unterstützt: ${SUPPORTED_EXTENSIONS.join(', ')}` },
      { status: 400 },
    );
  }

  try {
    const result = await convertToMarkdown(file);
    return NextResponse.json({
      markdown: result.markdown,
      warnings: result.warnings,
      source_dateiname: file.name,
      source_dateityp: file.type || null,
    });
  } catch (err) {
    // In Coolify/Server-Logs landen — sonst sehen wir nie, was wirklich schief läuft
    console.error('[markitdown/convert] Konvertierung fehlgeschlagen', {
      filename: file.name,
      type: file.type,
      size: file.size,
      ext,
      error: err instanceof Error ? `${err.name}: ${err.message}\n${err.stack ?? ''}` : String(err),
    });
    const message =
      err instanceof Error
        ? `${err.name === 'Error' ? '' : err.name + ': '}${err.message}`
        : String(err);
    return NextResponse.json(
      { error: `Konvertierung fehlgeschlagen — ${message || 'unbekannter Fehler'}` },
      { status: 500 },
    );
  }
}
