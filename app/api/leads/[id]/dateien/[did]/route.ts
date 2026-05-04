import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth/api';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchDateien, deleteDateiEintrag } from '@/lib/database/leads';

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; did: string }> }
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id, did } = await params;
  try {
    const dateien = await fetchDateien(id);
    const datei = dateien.find((d) => d.id === did);
    if (!datei) return NextResponse.json({ error: 'Datei nicht gefunden' }, { status: 404 });

    const supabase = createAdminClient();
    await supabase.storage.from('lead-dateien').remove([datei.dateipfad]);
    await deleteDateiEintrag(did);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; did: string }> }
): Promise<NextResponse> {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;

  const { id, did } = await params;
  try {
    const dateien = await fetchDateien(id);
    const datei = dateien.find((d) => d.id === did);
    if (!datei) return NextResponse.json({ error: 'Datei nicht gefunden' }, { status: 404 });

    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from('lead-dateien')
      .createSignedUrl(datei.dateipfad, 3600);
    if (error || !data?.signedUrl) throw new Error('Download-Link fehlgeschlagen');

    return NextResponse.json({ url: data.signedUrl, dateiname: datei.dateiname });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
