import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { readFileSync } from 'fs';
import { join } from 'path';
import { upsertLeads } from '@/lib/database/leads';
import type { LeadInsert } from '@/types';

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export async function POST(): Promise<NextResponse> {
  const h = await headers();
  if (h.get('x-migrate-secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const csvPath = join(process.cwd(), 'Seehafer Elemente-Grid view.csv');
    const content = readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').filter((l) => l.trim());

    // Spalten: Company Name(0),Contact Name(1),Contact Email(2),Contact Phone(3),
    //          Mobile Phone(4),Job Title(5),Seniority(6),Persona(7),Status(8),
    //          Industry(9),City(10),Employees(11),Website(12),Company LinkedIn(13),
    //          Contact LinkedIn(14),Apollo Person ID(15),Email Status(16),
    //          Lead Source(17),Batch Date(18),Notes(19)
    const rows: Omit<LeadInsert, 'company'>[] = [];

    for (const line of lines.slice(1)) {
      const cols = parseCSVLine(line);
      if (cols.length < 10) continue;

      const email = cols[2]?.replace(/"/g, '').trim() || null;
      if (!email || !email.includes('@')) continue;

      const fullName = (cols[1] ?? '').replace(/"/g, '').trim();
      const spaceIdx = fullName.indexOf(' ');
      const vorname = spaceIdx > 0 ? fullName.slice(0, spaceIdx) : fullName;
      const nachname = spaceIdx > 0 ? fullName.slice(spaceIdx + 1) : '';

      const telefon =
        (cols[3]?.replace(/"/g, '').trim() || cols[4]?.replace(/"/g, '').trim()) || null;

      rows.push({
        vorname,
        nachname,
        email,
        telefon,
        firma: cols[0]?.replace(/"/g, '').trim() || null,
        position: cols[5]?.replace(/"/g, '').trim() || null,
        linkedin_url: cols[14]?.replace(/"/g, '').trim() || null,
        stadt: cols[10]?.replace(/"/g, '').trim() || null,
        land: 'Deutschland',
        branche: cols[9]?.replace(/"/g, '').trim() || null,
        status: 'neu',
        prioritaet: 'mittel',
        tags: [],
        notizen: null,
        naechste_aktion: null,
        letzter_kontakt: null,
      });
    }

    const imported = await upsertLeads('seehafer', rows);
    return NextResponse.json({ ok: true, imported, total: rows.length });
  } catch (error) {
    console.error('CSV seed error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
