import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireSession } from '@/lib/auth/api';

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    await requireSession();
    const { id } = await params;
    const supabase = createAdminClient();

    const { data, error } = await supabase.storage
      .from('consulting-logos')
      .list(`company/${id}`, { sortBy: { column: 'created_at', order: 'desc' } });

    if (error) throw new Error(error.message);

    const files = (data ?? [])
      .filter((f) => f.name !== '.emptyFolderPlaceholder')
      .map((f) => {
        const { data: { publicUrl } } = supabase.storage
          .from('consulting-logos')
          .getPublicUrl(`company/${id}/${f.name}`);
        return { name: f.name, url: publicUrl, created_at: f.created_at };
      });

    return NextResponse.json(files);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fehler' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    await requireSession();
    const { id } = await params;
    const supabase = createAdminClient();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Keine Datei angegeben' }, { status: 400 });
    }

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (!allowed.includes(file.type)) {
      return NextResponse.json({ error: 'Nur Bildformate erlaubt' }, { status: 400 });
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Datei zu groß (max. 5 MB)' }, { status: 400 });
    }

    const ext = file.name.split('.').pop() ?? 'png';
    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^.]+$/, '');
    const path = `company/${id}/${timestamp}_${safeName}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('consulting-logos')
      .upload(path, buffer, { contentType: file.type, upsert: false });

    if (uploadError) throw new Error('Upload fehlgeschlagen: ' + uploadError.message);

    const { data: { publicUrl } } = supabase.storage
      .from('consulting-logos')
      .getPublicUrl(path);

    return NextResponse.json({ url: publicUrl, name: path.split('/').pop() }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload fehlgeschlagen' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    await requireSession();
    const { id } = await params;
    const supabase = createAdminClient();

    const { name } = await req.json() as { name: string };
    const path = `company/${id}/${name}`;

    const { error } = await supabase.storage.from('consulting-logos').remove([path]);
    if (error) throw new Error(error.message);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Fehler' },
      { status: 500 }
    );
  }
}
