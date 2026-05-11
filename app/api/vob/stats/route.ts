import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(): Promise<NextResponse> {
  try {
    const [totalRows, activeRows, matchRows, scanRows] = await Promise.all([
      sql`SELECT COUNT(*) AS count FROM vob.vob_tenders`,
      sql`SELECT COUNT(*) AS count FROM vob.vob_tenders WHERE status = 'active'`,
      sql`SELECT COUNT(*) AS count FROM vob.vob_matches`,
      sql`SELECT * FROM vob.vob_scans ORDER BY scan_date DESC LIMIT 1`,
    ]);

    return NextResponse.json({
      totalTenders: Number((totalRows[0] as { count: string }).count),
      activeTenders: Number((activeRows[0] as { count: string }).count),
      totalMatches: Number((matchRows[0] as { count: string }).count),
      latestScan: scanRows[0] ?? null,
    });
  } catch (err) {
    console.error('Unerwarteter Fehler beim Laden der VOB-Statistiken:', err);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
