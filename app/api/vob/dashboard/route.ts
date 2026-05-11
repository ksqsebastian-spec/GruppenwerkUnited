import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(): Promise<NextResponse> {
  try {
    const [companies, scans, allMatches, trends] = await Promise.all([
      sql`SELECT * FROM vob.companies WHERE active = true ORDER BY name`,
      sql`SELECT * FROM vob.vob_scans ORDER BY scan_date DESC LIMIT 1`,
      sql`SELECT * FROM vob.vob_dashboard WHERE company_slug IS NOT NULL ORDER BY deadline_date ASC`,
      sql`SELECT * FROM vob.company_trends ORDER BY year DESC, calendar_week DESC LIMIT 300`,
    ]);

    return NextResponse.json({
      companies,
      latestScan: scans[0] ?? null,
      allMatches,
      trends,
    });
  } catch (err) {
    console.error('Unerwarteter Fehler im VOB Dashboard:', err);
    return NextResponse.json({ error: 'Interner Serverfehler' }, { status: 500 });
  }
}
