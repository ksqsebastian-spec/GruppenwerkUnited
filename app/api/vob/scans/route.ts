import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(): Promise<NextResponse> {
  try {
    const rows = await sql`SELECT * FROM vob.vob_scans ORDER BY scan_date DESC`;
    return NextResponse.json({ scans: rows });
  } catch (err) {
    console.error('Unerwarteter Fehler beim Laden der Scans:', err);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
