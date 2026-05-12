import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import sql from '@/lib/db';

// One-time migration endpoint — protected by CRON_SECRET, remove after use.
export async function POST(): Promise<NextResponse> {
  const h = await headers();
  const secret = h.get('x-migrate-secret');
  if (!secret || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`;

    await sql`DO $$ BEGIN CREATE TYPE fuel_type AS ENUM ('diesel','benzin','elektro','hybrid_benzin','hybrid_diesel','gas'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`;
    await sql`DO $$ BEGIN CREATE TYPE vehicle_status AS ENUM ('active','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`;
    await sql`DO $$ BEGIN CREATE TYPE damage_status AS ENUM ('reported','approved','in_repair','completed'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`;
    await sql`DO $$ BEGIN CREATE TYPE appointment_status AS ENUM ('pending','completed','overdue'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`;
    await sql`DO $$ BEGIN CREATE TYPE mileage_source AS ENUM ('manual','cost_entry','damage_report'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`;
    await sql`DO $$ BEGIN CREATE TYPE license_employee_status AS ENUM ('active','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`;
    await sql`DO $$ BEGIN CREATE TYPE license_inspector_status AS ENUM ('active','archived'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`;

    await sql`CREATE TABLE IF NOT EXISTS companies (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS appointment_types (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL UNIQUE,
      default_interval_months INTEGER,
      color TEXT NOT NULL DEFAULT '#3b82f6',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS damage_types (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS cost_types (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL UNIQUE,
      icon TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS document_types (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS vehicles (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      license_plate TEXT NOT NULL UNIQUE,
      brand TEXT NOT NULL,
      model TEXT NOT NULL,
      year INTEGER NOT NULL CHECK (year >= 1990),
      vin TEXT UNIQUE,
      fuel_type fuel_type NOT NULL DEFAULT 'diesel',
      purchase_date DATE, purchase_price DECIMAL(10,2),
      mileage INTEGER NOT NULL DEFAULT 0 CHECK (mileage >= 0),
      is_leased BOOLEAN NOT NULL DEFAULT FALSE,
      leasing_company TEXT, leasing_end_date DATE, leasing_rate DECIMAL(10,2),
      leasing_contract_number TEXT, holder TEXT, user_name TEXT,
      insurance_number TEXT, insurance_company TEXT, tuv_due_date DATE,
      status vehicle_status NOT NULL DEFAULT 'active',
      company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS drivers (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      first_name TEXT NOT NULL, last_name TEXT NOT NULL,
      email TEXT, phone TEXT, license_class TEXT, license_expiry DATE,
      company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
      status vehicle_status NOT NULL DEFAULT 'active',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS vehicle_drivers (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
      driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
      is_primary BOOLEAN NOT NULL DEFAULT FALSE,
      assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(vehicle_id, driver_id)
    )`;

    await sql`CREATE TABLE IF NOT EXISTS appointments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
      appointment_type_id UUID NOT NULL REFERENCES appointment_types(id) ON DELETE RESTRICT,
      due_date DATE NOT NULL, completed_date DATE,
      status appointment_status NOT NULL DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS damages (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
      damage_type_id UUID NOT NULL REFERENCES damage_types(id) ON DELETE RESTRICT,
      date DATE NOT NULL, description TEXT NOT NULL, location TEXT,
      cost_estimate DECIMAL(10,2), actual_cost DECIMAL(10,2),
      insurance_claim BOOLEAN NOT NULL DEFAULT FALSE,
      insurance_claim_number TEXT,
      status damage_status NOT NULL DEFAULT 'reported',
      reported_by TEXT NOT NULL, notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS damage_images (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      damage_id UUID NOT NULL REFERENCES damages(id) ON DELETE CASCADE,
      file_path TEXT NOT NULL,
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS costs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
      cost_type_id UUID NOT NULL REFERENCES cost_types(id) ON DELETE RESTRICT,
      date DATE NOT NULL,
      amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
      description TEXT, mileage_at_cost INTEGER CHECK (mileage_at_cost >= 0),
      receipt_path TEXT, notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS mileage_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
      mileage INTEGER NOT NULL CHECK (mileage >= 0),
      recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      source mileage_source NOT NULL DEFAULT 'manual',
      notes TEXT
    )`;

    await sql`CREATE TABLE IF NOT EXISTS license_check_settings (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      check_interval_months INTEGER NOT NULL DEFAULT 6 CHECK (check_interval_months > 0 AND check_interval_months <= 24),
      warning_days_before INTEGER NOT NULL DEFAULT 14 CHECK (warning_days_before >= 0 AND warning_days_before <= 90),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS license_check_inspectors (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL, email TEXT,
      status license_inspector_status NOT NULL DEFAULT 'active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS license_check_employees (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      first_name TEXT NOT NULL, last_name TEXT NOT NULL,
      personnel_number TEXT,
      company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
      email TEXT, license_classes TEXT NOT NULL,
      license_number TEXT, license_expiry_date DATE,
      status license_employee_status NOT NULL DEFAULT 'active',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS license_checks (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      employee_id UUID NOT NULL REFERENCES license_check_employees(id) ON DELETE CASCADE,
      check_date DATE NOT NULL,
      checked_by_id UUID NOT NULL REFERENCES license_check_inspectors(id) ON DELETE RESTRICT,
      license_verified BOOLEAN NOT NULL DEFAULT false,
      next_check_due DATE NOT NULL, notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS uvv_settings (
      id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000002'::uuid,
      check_interval_months INTEGER NOT NULL DEFAULT 12 CHECK (check_interval_months > 0 AND check_interval_months <= 24),
      warning_days_before INTEGER NOT NULL DEFAULT 30 CHECK (warning_days_before >= 0 AND warning_days_before <= 90),
      default_topics TEXT DEFAULT 'Verkehrssicherheit, aktuelle Verkehrsregeln, Verhalten bei Unfällen, Fahrzeugcheck, Ladungssicherung',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS uvv_instructors (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name TEXT NOT NULL, email TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','archived')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS uvv_checks (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
      check_date DATE NOT NULL,
      instructed_by_id UUID NOT NULL REFERENCES uvv_instructors(id) ON DELETE RESTRICT,
      topics TEXT, next_check_due DATE NOT NULL, notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS handwerker (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      auth_user_id UUID, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE,
      telefon TEXT,
      provision_prozent DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (provision_prozent >= 0 AND provision_prozent <= 50),
      active BOOLEAN NOT NULL DEFAULT true, company TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS stellen (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      title TEXT NOT NULL, description TEXT,
      active BOOLEAN NOT NULL DEFAULT true, company TEXT NOT NULL DEFAULT '',
      praemie_betrag DECIMAL(10,2),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS empfehlungen (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      ref_code TEXT UNIQUE, empfehler_name TEXT NOT NULL, empfehler_email TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'offen', ausgezahlt_am TIMESTAMPTZ,
      iban TEXT CHECK (char_length(iban) <= 34),
      bic TEXT CHECK (char_length(bic) <= 11),
      kontoinhaber TEXT CHECK (char_length(kontoinhaber) <= 120),
      bank_name TEXT CHECK (char_length(bank_name) <= 120),
      handwerker_id UUID REFERENCES handwerker(id) ON DELETE SET NULL,
      kunde_name TEXT, kunde_kontakt TEXT, rechnungsbetrag DECIMAL(10,2),
      provision_betrag DECIMAL(10,2),
      stelle_id UUID REFERENCES stellen(id) ON DELETE SET NULL,
      kandidat_name TEXT, kandidat_kontakt TEXT, position TEXT,
      praemie_betrag DECIMAL(10,2),
      company TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY, value JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS audit_log (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id TEXT NOT NULL, action TEXT NOT NULL,
      target_type TEXT NOT NULL, target_id TEXT NOT NULL,
      details JSONB NOT NULL DEFAULT '{}', ip_address TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS documents (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      document_type_id UUID NOT NULL REFERENCES document_types(id) ON DELETE RESTRICT,
      name TEXT NOT NULL, file_path TEXT NOT NULL,
      file_size INTEGER NOT NULL CHECK (file_size > 0),
      mime_type TEXT NOT NULL, notes TEXT, entity_type VARCHAR(40) NOT NULL,
      vehicle_id UUID REFERENCES vehicles(id) ON DELETE CASCADE,
      damage_id UUID REFERENCES damages(id) ON DELETE CASCADE,
      appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
      driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE,
      license_check_employee_id UUID REFERENCES license_check_employees(id) ON DELETE CASCADE,
      license_check_id UUID REFERENCES license_checks(id) ON DELETE CASCADE,
      uvv_check_id UUID REFERENCES uvv_checks(id) ON DELETE CASCADE,
      uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;

    await sql`CREATE TABLE IF NOT EXISTS datenkodierungen (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      adresse TEXT,
      notizen TEXT,
      tags TEXT[] NOT NULL DEFAULT '{}',
      company TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_datenkodierungen_company ON datenkodierungen (company)`;

    await sql`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $$ LANGUAGE plpgsql
    `;

    await sql`
      CREATE OR REPLACE FUNCTION update_vehicle_mileage_from_cost()
      RETURNS TRIGGER AS $$
      BEGIN
        IF NEW.mileage_at_cost IS NOT NULL AND NEW.mileage_at_cost > 0 THEN
          UPDATE vehicles SET mileage = NEW.mileage_at_cost
          WHERE id = NEW.vehicle_id AND mileage < NEW.mileage_at_cost;
          INSERT INTO mileage_logs (vehicle_id, mileage, source, notes)
          VALUES (NEW.vehicle_id, NEW.mileage_at_cost, 'cost_entry', 'Aktualisiert durch Kosteneintrag');
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `;

    for (const [name, tbl] of [
      ['update_vehicles_updated_at','vehicles'],
      ['update_drivers_updated_at','drivers'],
      ['update_appointments_updated_at','appointments'],
      ['update_damages_updated_at','damages'],
      ['update_license_employees_updated_at','license_check_employees'],
      ['update_uvv_settings_updated_at','uvv_settings'],
      ['update_handwerker_updated_at','handwerker'],
      ['update_stellen_updated_at','stellen'],
      ['update_empfehlungen_updated_at','empfehlungen'],
    ] as [string,string][]) {
      await sql.unsafe(`DROP TRIGGER IF EXISTS ${name} ON ${tbl}; CREATE TRIGGER ${name} BEFORE UPDATE ON ${tbl} FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`);
    }

    await sql.unsafe(`DROP TRIGGER IF EXISTS update_mileage_on_cost_insert ON costs; CREATE TRIGGER update_mileage_on_cost_insert AFTER INSERT ON costs FOR EACH ROW EXECUTE FUNCTION update_vehicle_mileage_from_cost()`);

    await sql`CREATE SCHEMA IF NOT EXISTS roi`;
    await sql`CREATE TABLE IF NOT EXISTS roi.jobs (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), jahr INTEGER, monat TEXT, kundenname TEXT, objektadresse TEXT, taetigkeit TEXT, herkunft TEXT, netto_umsatz DECIMAL(12,2), rohertrag DECIMAL(12,2), angebot TEXT, datum DATE, company_id TEXT NOT NULL DEFAULT 'admin', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS roi.config (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), homepage_kosten DECIMAL(10,2) NOT NULL DEFAULT 3500, ads_setup_kosten DECIMAL(10,2) NOT NULL DEFAULT 1200, google_ads_budget DECIMAL(10,2) NOT NULL DEFAULT 800, pflegekosten_monat DECIMAL(10,2) NOT NULL DEFAULT 300, operative_marge_pct DECIMAL(5,4) NOT NULL DEFAULT 0.35, avg_auftraege_monat DECIMAL(5,2) NOT NULL DEFAULT 8, company_id TEXT NOT NULL DEFAULT 'admin', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS roi.uploads (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), filename TEXT NOT NULL, rows_imported INTEGER NOT NULL DEFAULT 0, rows_skipped INTEGER NOT NULL DEFAULT 0, column_mapping JSONB, company_id TEXT NOT NULL DEFAULT 'admin', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS roi.purchases (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), channel_id TEXT NOT NULL, channel_name TEXT NOT NULL, amount DECIMAL(10,2) NOT NULL, pricing TEXT NOT NULL CHECK (pricing IN ('recurring','onetime')), note TEXT NOT NULL DEFAULT '', purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), company_id TEXT NOT NULL DEFAULT 'admin', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`INSERT INTO roi.config (homepage_kosten,ads_setup_kosten,google_ads_budget,pflegekosten_monat,operative_marge_pct,avg_auftraege_monat) SELECT 3500,1200,800,300,0.35,8 WHERE NOT EXISTS (SELECT 1 FROM roi.config)`;

    await sql`CREATE SCHEMA IF NOT EXISTS vob`;
    await sql`CREATE TABLE IF NOT EXISTS vob.companies (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, trades TEXT[] NOT NULL DEFAULT '{}', keywords TEXT[] NOT NULL DEFAULT '{}', color TEXT NOT NULL DEFAULT '#6B7280', icon TEXT, active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS vob.vob_scans (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), scan_date DATE NOT NULL, calendar_week INTEGER NOT NULL, year INTEGER NOT NULL, total_listings INTEGER, matched_count INTEGER, new_listings INTEGER NOT NULL DEFAULT 0, report_url TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (calendar_week, year))`;
    await sql`CREATE TABLE IF NOT EXISTS vob.vob_tenders (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), title TEXT NOT NULL, authority TEXT, deadline TEXT, deadline_date DATE, category TEXT, url TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','expired','archived')), requested BOOLEAN NOT NULL DEFAULT FALSE, scan_id UUID REFERENCES vob.vob_scans(id) ON DELETE SET NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`;
    await sql`CREATE TABLE IF NOT EXISTS vob.vob_matches (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), tender_id UUID NOT NULL REFERENCES vob.vob_tenders(id) ON DELETE CASCADE, company_id UUID NOT NULL REFERENCES vob.companies(id) ON DELETE CASCADE, company_slug TEXT NOT NULL, relevance TEXT, reason TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE (tender_id, company_id))`;

    await sql`ALTER TABLE vob.vob_tenders ADD COLUMN IF NOT EXISTS unique_url TEXT`;

    await sql`CREATE OR REPLACE VIEW vob.vob_dashboard AS
      SELECT
        t.id AS tender_id,
        t.title,
        t.authority,
        t.deadline,
        t.deadline_date,
        t.category,
        t.url,
        t.status,
        t.requested,
        t.created_at,
        m.company_slug,
        c.name AS company_name,
        c.color AS company_color,
        m.relevance,
        m.reason,
        s.calendar_week,
        s.year,
        s.scan_date,
        s.report_url,
        CASE
          WHEN t.status != 'active' THEN 'expired'
          WHEN t.deadline_date IS NULL THEN 'unknown'
          WHEN t.deadline_date < CURRENT_DATE THEN 'expired'
          WHEN t.deadline_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'urgent'
          WHEN t.deadline_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'soon'
          ELSE 'normal'
        END AS urgency
      FROM vob.vob_tenders t
      LEFT JOIN vob.vob_matches m ON m.tender_id = t.id
      LEFT JOIN vob.companies c ON c.id = m.company_id
      LEFT JOIN vob.vob_scans s ON s.id = t.scan_id`;

    await sql`CREATE OR REPLACE VIEW vob.company_weekly_stats AS
      SELECT
        c.name AS company_name,
        c.slug AS company_slug,
        c.color,
        s.calendar_week,
        s.year,
        s.scan_date,
        COUNT(m.id)::int AS tender_count
      FROM vob.companies c
      JOIN vob.vob_matches m ON m.company_id = c.id
      JOIN vob.vob_tenders t ON t.id = m.tender_id
      JOIN vob.vob_scans s ON s.id = t.scan_id
      GROUP BY c.id, c.name, c.slug, c.color, s.id, s.calendar_week, s.year, s.scan_date`;

    await sql`CREATE OR REPLACE VIEW vob.company_trends AS
      SELECT
        ws.company_name,
        ws.company_slug,
        ws.color,
        ws.calendar_week,
        ws.year,
        ws.scan_date,
        ws.tender_count,
        prev.tender_count AS prev_week_count,
        ws.tender_count - COALESCE(prev.tender_count, 0) AS week_change
      FROM vob.company_weekly_stats ws
      LEFT JOIN vob.company_weekly_stats prev
        ON prev.company_slug = ws.company_slug
        AND (
          (ws.calendar_week > 1 AND prev.year = ws.year AND prev.calendar_week = ws.calendar_week - 1)
          OR (ws.calendar_week = 1 AND prev.year = ws.year - 1 AND prev.calendar_week = 52)
        )`;

    await sql`INSERT INTO appointment_types (id,name,default_interval_months,color) VALUES
      ('11111111-1111-1111-1111-111111111001','TÜV',24,'#ef4444'),
      ('11111111-1111-1111-1111-111111111002','Service/Wartung',12,'#3b82f6'),
      ('11111111-1111-1111-1111-111111111003','Ölwechsel',12,'#f59e0b'),
      ('11111111-1111-1111-1111-111111111004','Reifenwechsel',6,'#10b981'),
      ('11111111-1111-1111-1111-111111111005','Inspektion',12,'#8b5cf6'),
      ('11111111-1111-1111-1111-111111111006','Bremsenprüfung',12,'#ec4899'),
      ('11111111-1111-1111-1111-111111111007','UVV-Prüfung',12,'#06b6d4'),
      ('11111111-1111-1111-1111-111111111008','Leasing-Rückgabe',NULL,'#6b7280')
      ON CONFLICT (name) DO NOTHING`;
    await sql`INSERT INTO damage_types (id,name) VALUES
      ('22222222-2222-2222-2222-222222222001','Kollision/Unfall'),
      ('22222222-2222-2222-2222-222222222002','Parkschaden'),
      ('22222222-2222-2222-2222-222222222003','Vandalismus'),
      ('22222222-2222-2222-2222-222222222004','Wetterschaden'),
      ('22222222-2222-2222-2222-222222222005','Glasschaden'),
      ('22222222-2222-2222-2222-222222222006','Mechanischer Schaden'),
      ('22222222-2222-2222-2222-222222222007','Reifenschaden'),
      ('22222222-2222-2222-2222-222222222008','Innenraumschaden')
      ON CONFLICT (name) DO NOTHING`;
    await sql`INSERT INTO cost_types (id,name,icon) VALUES
      ('33333333-3333-3333-3333-333333333001','Tanken','⛽'),
      ('33333333-3333-3333-3333-333333333002','Service/Wartung','🔧'),
      ('33333333-3333-3333-3333-333333333003','Reparatur','🛠️'),
      ('33333333-3333-3333-3333-333333333004','Versicherung','🛡️'),
      ('33333333-3333-3333-3333-333333333005','KFZ-Steuer','📋'),
      ('33333333-3333-3333-3333-333333333006','Leasing','📄'),
      ('33333333-3333-3333-3333-333333333007','Parken','🅿️'),
      ('33333333-3333-3333-3333-333333333008','Maut','🛣️'),
      ('33333333-3333-3333-3333-333333333009','Fahrzeugwäsche','🚿')
      ON CONFLICT (name) DO NOTHING`;
    await sql`INSERT INTO document_types (id,name,description) VALUES
      ('44444444-4444-4444-4444-444444444001','Fahrzeugschein','Zulassungsbescheinigung Teil I'),
      ('44444444-4444-4444-4444-444444444002','Fahrzeugbrief','Zulassungsbescheinigung Teil II'),
      ('44444444-4444-4444-4444-444444444003','Versicherungspolice','KFZ-Versicherungsdokumente'),
      ('44444444-4444-4444-4444-444444444004','TÜV-Bericht','Hauptuntersuchung'),
      ('44444444-4444-4444-4444-444444444005','Serviceheft','Wartungsnachweise'),
      ('44444444-4444-4444-4444-444444444006','Rechnung','Rechnungen und Belege'),
      ('44444444-4444-4444-4444-444444444007','Vertrag','Kauf- oder Leasingvertrag'),
      ('44444444-4444-4444-4444-444444444008','Übergabeprotokoll','Fahrzeugübergabe')
      ON CONFLICT (name) DO NOTHING`;
    await sql`INSERT INTO license_check_settings (id,check_interval_months,warning_days_before) VALUES ('00000000-0000-0000-0000-000000000001',6,14) ON CONFLICT (id) DO NOTHING`;
    await sql`INSERT INTO uvv_settings (id,check_interval_months,warning_days_before) VALUES ('00000000-0000-0000-0000-000000000002',12,30) ON CONFLICT (id) DO NOTHING`;
    await sql`INSERT INTO app_settings (key,value) VALUES ('praemie_betrag_default','1000'::jsonb) ON CONFLICT (key) DO NOTHING`;

    await sql`CREATE TABLE IF NOT EXISTS automation_nodes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company TEXT NOT NULL DEFAULT '',
      parent_id UUID REFERENCES automation_nodes(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      app_type TEXT NOT NULL DEFAULT 'generic',
      prompt_template TEXT,
      gdrive_path TEXT,
      position_x FLOAT NOT NULL DEFAULT 0,
      position_y FLOAT NOT NULL DEFAULT 0,
      position INTEGER NOT NULL DEFAULT 0,
      use_datenkodierung BOOLEAN NOT NULL DEFAULT false,
      is_active BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_automation_nodes_company ON automation_nodes (company)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_automation_nodes_parent ON automation_nodes (parent_id)`;

    await sql`CREATE TABLE IF NOT EXISTS leads (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      company TEXT NOT NULL DEFAULT '',
      vorname TEXT NOT NULL DEFAULT '',
      nachname TEXT NOT NULL DEFAULT '',
      email TEXT,
      telefon TEXT,
      firma TEXT,
      position TEXT,
      linkedin_url TEXT,
      stadt TEXT,
      land TEXT,
      branche TEXT,
      status TEXT NOT NULL DEFAULT 'neu',
      prioritaet TEXT NOT NULL DEFAULT 'mittel',
      tags TEXT[] NOT NULL DEFAULT '{}',
      notizen TEXT,
      naechste_aktion TEXT,
      letzter_kontakt DATE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (company, email)
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_leads_company ON leads (company)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads (company, status)`;

    await sql`CREATE TABLE IF NOT EXISTS lead_kommentare (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      company TEXT NOT NULL DEFAULT '',
      text TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_lead_kommentare_lead ON lead_kommentare (lead_id)`;

    await sql`CREATE TABLE IF NOT EXISTS lead_dateien (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
      company TEXT NOT NULL DEFAULT '',
      dateiname TEXT NOT NULL,
      dateipfad TEXT NOT NULL,
      dateityp TEXT,
      dateigroesse INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`;
    await sql`CREATE INDEX IF NOT EXISTS idx_lead_dateien_lead ON lead_dateien (lead_id)`;

    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS company TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS vorname TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS nachname TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS email TEXT`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS telefon TEXT`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS firma TEXT`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS position TEXT`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS linkedin_url TEXT`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS stadt TEXT`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS land TEXT`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS branche TEXT`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'neu'`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS prioritaet TEXT NOT NULL DEFAULT 'mittel'`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS notizen TEXT`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS naechste_aktion TEXT`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS letzter_kontakt DATE`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
    await sql`DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='leads' AND column_name='tags'
        AND data_type != 'ARRAY'
      ) THEN
        ALTER TABLE leads DROP COLUMN tags;
      END IF;
    END $$`;
    await sql`ALTER TABLE leads ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}'`;

    await sql`ALTER TABLE datenkodierungen ADD COLUMN IF NOT EXISTS company TEXT NOT NULL DEFAULT ''`;
    await sql`ALTER TABLE datenkodierungen ADD COLUMN IF NOT EXISTS code TEXT`;
    await sql`ALTER TABLE datenkodierungen ADD COLUMN IF NOT EXISTS name TEXT`;
    await sql`ALTER TABLE datenkodierungen ADD COLUMN IF NOT EXISTS adresse TEXT`;
    await sql`ALTER TABLE datenkodierungen ADD COLUMN IF NOT EXISTS notizen TEXT`;
    await sql`ALTER TABLE datenkodierungen ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
    await sql`ALTER TABLE datenkodierungen ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`;
    await sql`DO $$ BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema='public' AND table_name='datenkodierungen' AND column_name='tags'
        AND data_type != 'ARRAY'
      ) THEN
        ALTER TABLE datenkodierungen DROP COLUMN tags;
      END IF;
    END $$`;
    await sql`ALTER TABLE datenkodierungen ADD COLUMN IF NOT EXISTS tags TEXT[] NOT NULL DEFAULT '{}'`;
    await sql`DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'datenkodierungen_code_key' AND conrelid = 'datenkodierungen'::regclass
      ) THEN
        ALTER TABLE datenkodierungen ADD CONSTRAINT datenkodierungen_code_key UNIQUE (code);
      END IF;
    END $$`;

    await sql.unsafe(`DROP TRIGGER IF EXISTS update_leads_updated_at ON leads; CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`);
    await sql.unsafe(`DROP TRIGGER IF EXISTS update_datenkodierungen_updated_at ON datenkodierungen; CREATE TRIGGER update_datenkodierungen_updated_at BEFORE UPDATE ON datenkodierungen FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()`);

    // ── Fuhrpark Demo-Firmen ──────────────────────────────────────────────────
    await sql`INSERT INTO companies (id,name) VALUES
      ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','Seehafer Elemente'),
      ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','Tischlerei Brink'),
      ('cccccccc-cccc-cccc-cccc-cccccccccccc','Malerei Hantke'),
      ('dddddddd-dddd-dddd-dddd-dddddddddddd','Gruppenwerk'),
      ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee','Tischlerei Mehlig')
      ON CONFLICT (name) DO NOTHING`;

    // ── Fuhrpark Demo-Fahrzeuge ───────────────────────────────────────────────
    await sql`INSERT INTO vehicles (id,license_plate,brand,model,year,fuel_type,mileage,status,company_id,tuv_due_date,notes) VALUES
      ('f1000000-0000-0000-0000-000000000001','HH-SE 1001','Mercedes-Benz','Sprinter 316 CDI',2021,'diesel',87450,'active','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','2025-11-15','Hauptfahrzeug Montagekolonne'),
      ('f1000000-0000-0000-0000-000000000002','HH-SE 1002','Volkswagen','Crafter 35 2.0 TDI',2022,'diesel',54200,'active','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','2026-03-20','Materialfahrzeug'),
      ('f1000000-0000-0000-0000-000000000003','HH-SE 1003','Ford','Transit Custom',2023,'diesel',28100,'active','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','2026-08-10','Kleinteile und Werkzeug'),
      ('f2000000-0000-0000-0000-000000000001','BI-TB 2001','Mercedes-Benz','Vito 116 CDI',2020,'diesel',112300,'active','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','2025-09-05','Montagewagen Tischler'),
      ('f2000000-0000-0000-0000-000000000002','BI-TB 2002','Volkswagen','Transporter T6',2021,'diesel',78600,'active','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','2026-01-22','Holztransport'),
      ('f3000000-0000-0000-0000-000000000001','OB-MH 3001','Opel','Movano B',2022,'diesel',43800,'active','cccccccc-cccc-cccc-cccc-cccccccccccc','2026-05-30','Farbmaterialen'),
      ('f3000000-0000-0000-0000-000000000002','OB-MH 3002','Renault','Trafic L2H1',2023,'diesel',19200,'active','cccccccc-cccc-cccc-cccc-cccccccccccc','2026-09-15','Gerüste und Leitern'),
      ('f4000000-0000-0000-0000-000000000001','HH-GW 4001','Volkswagen','Caddy 2.0 TDI',2022,'diesel',61500,'active','dddddddd-dddd-dddd-dddd-dddddddddddd','2026-02-28','Bürofahrzeug GF'),
      ('f5000000-0000-0000-0000-000000000001','HH-ME 5001','Mercedes-Benz','Sprinter 314 CDI',2021,'diesel',94100,'active','eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee','2025-12-08','Montagekolonne 1'),
      ('f5000000-0000-0000-0000-000000000002','HH-ME 5002','Ford','Transit 350 L3',2022,'diesel',67300,'active','eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee','2026-04-12','Materialfahrzeug 2')
      ON CONFLICT (license_plate) DO NOTHING`;

    // ── Fuhrpark Demo-Fahrer ──────────────────────────────────────────────────
    await sql`INSERT INTO drivers (id,first_name,last_name,email,phone,company_id,status) VALUES
      ('d1000000-0000-0000-0000-000000000001','Klaus','Müller','k.mueller@seehafer.de','+49 40 123456','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','active'),
      ('d1000000-0000-0000-0000-000000000002','Anna','Schmidt','a.schmidt@seehafer.de','+49 40 123457','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa','active'),
      ('d2000000-0000-0000-0000-000000000001','Thomas','Brinkmann','t.brinkmann@tischlerei-brink.de','+49 521 98765','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb','active'),
      ('d3000000-0000-0000-0000-000000000001','Maria','Hantke','m.hantke@malerei-hantke.de','+49 234 55443','cccccccc-cccc-cccc-cccc-cccccccccccc','active'),
      ('d5000000-0000-0000-0000-000000000001','Peter','Mehlig','p.mehlig@tischlerei-mehlig.de','+49 40 887766','eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee','active')
      ON CONFLICT DO NOTHING`;

    // ── Fuhrpark Demo-Termine ──────────────────────────────────────────────────
    await sql`INSERT INTO appointments (id,vehicle_id,appointment_type_id,due_date,status,notes) VALUES
      ('a1000000-0000-0000-0000-000000000001','f1000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111001','2025-11-15','pending','TÜV Hauptuntersuchung'),
      ('a1000000-0000-0000-0000-000000000002','f2000000-0000-0000-0000-000000000001','11111111-1111-1111-1111-111111111002','2025-10-01','pending','Jahresservice'),
      ('a1000000-0000-0000-0000-000000000003','f1000000-0000-0000-0000-000000000002','11111111-1111-1111-1111-111111111003','2025-09-20','pending','Ölwechsel überfällig')
      ON CONFLICT DO NOTHING`;

    return NextResponse.json({ ok: true, message: 'Schema applied successfully' });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
