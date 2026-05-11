import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  try {
    const rows = await sql`
      SELECT d.*,
        json_build_object('id', dt.id, 'name', dt.name) AS document_type
      FROM documents d
      LEFT JOIN document_types dt ON dt.id = d.document_type_id
      WHERE d.id = ${id}
    `;
    if (!rows[0]) return NextResponse.json({ error: 'Dokument nicht gefunden' }, { status: 404 });
    return NextResponse.json(rows[0]);
  } catch {
    return NextResponse.json({ error: 'Dokument konnte nicht geladen werden' }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  const { id } = await params;
  try {
    await sql`DELETE FROM documents WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Dokument konnte nicht gelöscht werden' }, { status: 500 });
  }
}
