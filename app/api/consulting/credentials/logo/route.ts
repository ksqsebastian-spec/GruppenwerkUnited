import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth/api';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    await requireSession();
    const supabase = createAdminClient();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const credentialId = formData.get('credential_id') as string | null;

    if (!file || !credentialId) {
      return NextResponse.json({ error: 'Datei und credential_id erforderlich' }, { status: 400 });
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Nur Bildformate erlaubt (JPG, PNG, WEBP, GIF, SVG)' }, { status: 400 });
    }
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json({ error: 'Datei zu groß (max. 2 MB)' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() ?? 'png';
    const safeName = credentialId.replace(/[^a-zA-Z0-9-]/g, '');
    const path = `${safeName}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('consulting-logos')
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (uploadError) throw new Error('Upload fehlgeschlagen: ' + uploadError.message);

    const { data: { publicUrl } } = supabase.storage
      .from('consulting-logos')
      .getPublicUrl(path);

    const { error: updateError } = await supabase
      .from('consulting_credentials')
      .update({ logo_url: publicUrl, updated_at: new Date().toISOString() })
      .eq('id', credentialId);

    if (updateError) throw new Error('Aktualisierung fehlgeschlagen');

    return NextResponse.json({ logo_url: publicUrl });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload fehlgeschlagen' },
      { status: 500 }
    );
  }
}
