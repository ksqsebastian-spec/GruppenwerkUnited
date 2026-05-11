import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    if (slug) {
      const rows = await sql`SELECT * FROM vob.companies WHERE slug = ${slug} LIMIT 1`;
      if (!rows[0]) {
        return NextResponse.json({ error: 'Unternehmen nicht gefunden' }, { status: 404 });
      }
      return NextResponse.json({ company: rows[0] });
    }

    const rows = await sql`SELECT * FROM vob.companies WHERE active = true ORDER BY name`;
    return NextResponse.json({ companies: rows });
  } catch (err) {
    console.error('Unerwarteter Fehler beim Laden der Unternehmen:', err);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
