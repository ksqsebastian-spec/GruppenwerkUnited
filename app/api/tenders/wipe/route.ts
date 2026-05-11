import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(): Promise<NextResponse> {
  try {
    await sql`DELETE FROM vob.vob_matches WHERE true`;
    await sql`DELETE FROM vob.vob_tenders WHERE true`;
    await sql`DELETE FROM vob.vob_scans WHERE true`;
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Fehler beim Wipe:', err);
    return NextResponse.json({ error: 'Daten konnten nicht gelöscht werden' }, { status: 500 });
  }
}
