import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(): Promise<NextResponse> {
  const results: Record<string, unknown> = {};

  for (const table of ['datenkodierungen', 'leads', 'lead_kommentare', 'lead_dateien']) {
    try {
      const rows = await sql.unsafe(`SELECT COUNT(*) AS n FROM ${table}`);
      results[table] = { ok: true, count: (rows[0] as { n: string }).n };
    } catch (err) {
      results[table] = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  return NextResponse.json(results);
}
