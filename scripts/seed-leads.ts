/**
 * Seed-Skript: Importiert Seehafer Elemente Leads aus CSV in die Datenbank.
 * Aufruf: npx tsx scripts/seed-leads.ts <pfad-zur-csv>
 *
 * Erwartet .env.local mit NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY.
 */

import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const COMPANY = 'seehafer-elemente';

interface CsvRow {
  [key: string]: string;
}

function spalte(row: CsvRow, ...aliases: string[]): string | null {
  for (const alias of aliases) {
    const val = row[alias]?.trim();
    if (val) return val;
  }
  return null;
}

function hauptAusfuehren(): void {
  const csvPfad = process.argv[2];
  if (!csvPfad) {
    console.error('Verwendung: npx tsx scripts/seed-leads.ts <pfad-zur-csv>');
    process.exit(1);
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    console.error('Fehlende Umgebungsvariablen: NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const csvInhalt = fs.readFileSync(path.resolve(csvPfad), 'utf-8');

  const { data: rows, errors } = Papa.parse<CsvRow>(csvInhalt, {
    header: true,
    skipEmptyLines: true,
  });

  if (errors.length > 0) {
    console.warn('CSV-Warnungen:', errors.slice(0, 3));
  }

  console.log(`${rows.length} Zeilen in CSV gefunden.`);

  const leads = rows.map((row) => ({
    company: COMPANY,
    vorname: spalte(row, 'First Name', 'Vorname', 'first_name', 'vorname') ?? '',
    nachname: spalte(row, 'Last Name', 'Nachname', 'last_name', 'nachname') ?? '',
    email: spalte(row, 'Email', 'E-Mail', 'email'),
    telefon: spalte(row, 'Phone', 'Telefon', 'phone', 'telefon'),
    firma: spalte(row, 'Company', 'Firma', 'company_name', 'firma'),
    position: spalte(row, 'Title', 'Position', 'title', 'position'),
    linkedin_url: spalte(row, 'LinkedIn URL', 'LinkedIn', 'linkedin_url', 'linkedin'),
    stadt: spalte(row, 'City', 'Ort', 'Stadt', 'city', 'stadt'),
    land: spalte(row, 'Country', 'Land', 'country', 'land'),
    branche: spalte(row, 'Industry', 'Branche', 'industry', 'branche'),
    notizen: spalte(row, 'Notes', 'Notizen', 'notes', 'notizen'),
    status: 'neu',
    prioritaet: 'mittel',
    tags: [] as string[],
  }));

  void (async () => {
    const { data, error } = await supabase
      .from('leads')
      .upsert(leads, { onConflict: 'company,email', ignoreDuplicates: true })
      .select('id');

    if (error) {
      console.error('Fehler beim Import:', error.message);
      process.exit(1);
    }

    console.log(`✅ ${data?.length ?? 0} Leads erfolgreich importiert (${COMPANY}).`);
  })();
}

hauptAusfuehren();
