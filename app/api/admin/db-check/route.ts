import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(): Promise<NextResponse> {
  const results: Record<string, unknown> = {};

  // Tabellenexistenz und Zeilenzahl
  for (const table of ['datenkodierungen', 'leads', 'lead_kommentare', 'lead_dateien']) {
    try {
      const rows = await sql.unsafe(`SELECT COUNT(*) AS n FROM ${table}`);
      results[table] = { ok: true, count: (rows[0] as unknown as { n: string }).n };
    } catch (err) {
      results[table] = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  // Spaltenstruktur für leads und datenkodierungen prüfen
  for (const table of ['leads', 'datenkodierungen']) {
    try {
      const cols = await sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = ${table}
        ORDER BY ordinal_position
      `;
      results[`${table}_columns`] = cols.map((c) => ({
        name: (c as { column_name: string }).column_name,
        type: (c as { data_type: string }).data_type,
      }));
    } catch (err) {
      results[`${table}_columns`] = { error: err instanceof Error ? err.message : String(err) };
    }
  }

  // Tatsächliche Abfrage testen (wie die App sie macht)
  for (const [label, query] of [
    ['leads_query_test', `SELECT * FROM leads WHERE company = 'test' AND (NULL IS NULL OR status = NULL) AND (NULL IS NULL OR prioritaet = NULL) AND (NULL IS NULL OR branche = NULL) AND (NULL IS NULL OR (vorname ILIKE '%x%')) ORDER BY created_at DESC LIMIT 1`],
    ['datenkodierung_query_test', `SELECT * FROM datenkodierungen WHERE company = 'test' AND (NULL IS NULL OR (code ILIKE '%x%' OR name ILIKE '%x%' OR adresse ILIKE '%x%')) ORDER BY created_at DESC LIMIT 1`],
  ] as [string, string][]) {
    try {
      await sql.unsafe(query);
      results[label] = { ok: true };
    } catch (err) {
      results[label] = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
  }

  return NextResponse.json(results);
}
