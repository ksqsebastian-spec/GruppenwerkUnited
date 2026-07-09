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

    const { data, error } = await supabase
      .from('consulting_company_images')
      .select('*')
      .eq('company_id', id)
      .order('category', { nullsFirst: false })
      .order('sort_order')
      .order('created_at');

    if (error) throw new Error(error.message);
    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error('[/api/consulting/companies/[id]/bilder GET]', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    await requireSession();
    const { id } = await params;
    const supabase = createAdminClient();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const category = (formData.get('category') as string | null) || null;

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
    const storagePath = `company/${id}/${timestamp}_${safeName}.${ext}`;
    const displayName = file.name;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabase.storage
      .from('consulting-logos')
      .upload(storagePath, buffer, { contentType: file.type, upsert: false });

    if (uploadError) throw new Error('Upload fehlgeschlagen: ' + uploadError.message);

    const { data: { publicUrl } } = supabase.storage
      .from('consulting-logos')
      .getPublicUrl(storagePath);

    const { data: record, error: insertError } = await supabase
      .from('consulting_company_images')
      .insert({ company_id: id, url: publicUrl, storage_path: storagePath, name: displayName, category })
      .select()
      .single();

    if (insertError) throw new Error(insertError.message);

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    console.error('[/api/consulting/companies/[id]/bilder POST]', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    await requireSession();
    const { id } = await params;
    const supabase = createAdminClient();

    const body = await req.json() as { image_id?: string; old_category?: string; new_category?: string | null; category?: string | null };

    // Rename all images in a category
    if (body.old_category !== undefined) {
      const { error } = await supabase
        .from('consulting_company_images')
        .update({ category: body.new_category ?? null })
        .eq('company_id', id)
        .eq('category', body.old_category);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    // Update single image category
    if (body.image_id) {
      const { error } = await supabase
        .from('consulting_company_images')
        .update({ category: body.category ?? null })
        .eq('id', body.image_id)
        .eq('company_id', id);
      if (error) throw new Error(error.message);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  } catch (error) {
    console.error('[/api/consulting/companies/[id]/bilder PATCH]', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    await requireSession();
    const { id } = await params;
    const supabase = createAdminClient();

    const body = await req.json() as { image_id?: string; category?: string };

    // Delete all images in a category
    if (body.category) {
      const { data: images } = await supabase
        .from('consulting_company_images')
        .select('id, storage_path')
        .eq('company_id', id)
        .eq('category', body.category);

      if (images?.length) {
        await supabase.storage.from('consulting-logos').remove(images.map((i) => i.storage_path));
        await supabase.from('consulting_company_images').delete().in('id', images.map((i) => i.id));
      }
      return new NextResponse(null, { status: 204 });
    }

    // Delete single image
    if (body.image_id) {
      const { data: img } = await supabase
        .from('consulting_company_images')
        .select('storage_path')
        .eq('id', body.image_id)
        .eq('company_id', id)
        .single();

      if (img) {
        await supabase.storage.from('consulting-logos').remove([img.storage_path]);
        await supabase.from('consulting_company_images').delete().eq('id', body.image_id);
      }
      return new NextResponse(null, { status: 204 });
    }

    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  } catch (error) {
    console.error('[/api/consulting/companies/[id]/bilder DELETE]', error);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
