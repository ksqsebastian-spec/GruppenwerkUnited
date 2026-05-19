import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  try {
    const db = createAdminClient();
    const { data, error } = await db
      .from('documents')
      .select('*, document_type:document_types(id, name)')
      .eq('id', id)
      .single();
    if (error || !data) {
      return NextResponse.json({ error: 'Dokument nicht gefunden' }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: 'Dokument konnte nicht geladen werden' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  try {
    const db = createAdminClient();
    const { error } = await db.from('documents').delete().eq('id', id);
    if (error) {
      return NextResponse.json({ error: 'Dokument konnte nicht gelöscht werden' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Dokument konnte nicht gelöscht werden' }, { status: 500 });
  }
}
