-- ============================================================================
-- GruppenwerkUnited – Teil 5/5: RLS, Policies, Grants, Seed-Daten
-- Stand: 2026-04-10
-- Voraussetzung: Teile 1–4 müssen zuerst ausgeführt werden
-- ============================================================================

-- ============================================================================
-- ROW LEVEL SECURITY AKTIVIEREN
-- ============================================================================

-- Public Schema: Fuhrpark
ALTER TABLE companies               ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles                ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_drivers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_types       ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_types            ENABLE ROW LEVEL SECURITY;
ALTER TABLE damages                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_images           ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_types              ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_types          ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents               ENABLE ROW LEVEL SECURITY;
ALTER TABLE mileage_logs            ENABLE ROW LEVEL SECURITY;

-- Public Schema: Führerscheinkontrolle
ALTER TABLE license_check_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_check_inspectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_check_employees  ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_checks           ENABLE ROW LEVEL SECURITY;

-- Public Schema: UVV
ALTER TABLE uvv_settings    ENABLE ROW LEVEL SECURITY;
ALTER TABLE uvv_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE uvv_checks      ENABLE ROW LEVEL SECURITY;

-- Public Schema: Affiliate/Recruiting (nur service_role Zugriff)
ALTER TABLE handwerker   ENABLE ROW LEVEL SECURITY;
ALTER TABLE stellen      ENABLE ROW LEVEL SECURITY;
ALTER TABLE empfehlungen ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log    ENABLE ROW LEVEL SECURITY;

-- ROI Schema
ALTER TABLE roi.jobs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi.config    ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi.uploads   ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi.purchases ENABLE ROW LEVEL SECURITY;

-- VOB Schema
ALTER TABLE vob.companies   ENABLE ROW LEVEL SECURITY;
ALTER TABLE vob.vob_scans   ENABLE ROW LEVEL SECURITY;
ALTER TABLE vob.vob_tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE vob.vob_matches ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES
-- App nutzt Custom-Auth mit Cookie-Proxy → Browser verwendet Anon-Key
-- Daher: anon-Rolle für Fuhrpark/License/UVV/ROI
--         service_role für Affiliate/Recruiting (Zugriff nur über API-Routen)
--         anon+authenticated lesen / service_role schreiben für VOB
-- ============================================================================

-- --- Fuhrpark: Firmen ---
DROP POLICY IF EXISTS "companies_all" ON companies;
CREATE POLICY "companies_all" ON companies FOR ALL TO anon USING (true) WITH CHECK (true);

-- --- Fuhrpark: Fahrzeuge ---
DROP POLICY IF EXISTS "vehicles_select" ON vehicles;
DROP POLICY IF EXISTS "vehicles_insert" ON vehicles;
DROP POLICY IF EXISTS "vehicles_update" ON vehicles;
DROP POLICY IF EXISTS "vehicles_delete" ON vehicles;
CREATE POLICY "vehicles_select" ON vehicles FOR SELECT TO anon USING (true);
CREATE POLICY "vehicles_insert" ON vehicles FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "vehicles_update" ON vehicles FOR UPDATE TO anon USING (true);
CREATE POLICY "vehicles_delete" ON vehicles FOR DELETE TO anon USING (true);

-- --- Fuhrpark: Fahrer ---
DROP POLICY IF EXISTS "drivers_all" ON drivers;
CREATE POLICY "drivers_all" ON drivers FOR ALL TO anon USING (true) WITH CHECK (true);

-- --- Fuhrpark: Fahrzeug-Fahrer ---
DROP POLICY IF EXISTS "vehicle_drivers_all" ON vehicle_drivers;
CREATE POLICY "vehicle_drivers_all" ON vehicle_drivers FOR ALL TO anon USING (true) WITH CHECK (true);

-- --- Fuhrpark: Terminarten ---
DROP POLICY IF EXISTS "appointment_types_all" ON appointment_types;
CREATE POLICY "appointment_types_all" ON appointment_types FOR ALL TO anon USING (true) WITH CHECK (true);

-- --- Fuhrpark: Termine ---
DROP POLICY IF EXISTS "appointments_all" ON appointments;
CREATE POLICY "appointments_all" ON appointments FOR ALL TO anon USING (true) WITH CHECK (true);

-- --- Fuhrpark: Schadensarten ---
DROP POLICY IF EXISTS "damage_types_all" ON damage_types;
CREATE POLICY "damage_types_all" ON damage_types FOR ALL TO anon USING (true) WITH CHECK (true);

-- --- Fuhrpark: Schäden ---
DROP POLICY IF EXISTS "damages_all" ON damages;
CREATE POLICY "damages_all" ON damages FOR ALL TO anon USING (true) WITH CHECK (true);

-- --- Fuhrpark: Schadensbilder ---
DROP POLICY IF EXISTS "damage_images_all" ON damage_images;
CREATE POLICY "damage_images_all" ON damage_images FOR ALL TO anon USING (true) WITH CHECK (true);

-- --- Fuhrpark: Kostenarten ---
DROP POLICY IF EXISTS "cost_types_all" ON cost_types;
CREATE POLICY "cost_types_all" ON cost_types FOR ALL TO anon USING (true) WITH CHECK (true);

-- --- Fuhrpark: Kosten ---
DROP POLICY IF EXISTS "costs_all" ON costs;
CREATE POLICY "costs_all" ON costs FOR ALL TO anon USING (true) WITH CHECK (true);

-- --- Fuhrpark: Dokumenttypen ---
DROP POLICY IF EXISTS "document_types_all" ON document_types;
CREATE POLICY "document_types_all" ON document_types FOR ALL TO anon USING (true) WITH CHECK (true);

-- --- Fuhrpark: Dokumente ---
DROP POLICY IF EXISTS "documents_all" ON documents;
CREATE POLICY "documents_all" ON documents FOR ALL TO anon USING (true) WITH CHECK (true);

-- --- Fuhrpark: Kilometerstand ---
DROP POLICY IF EXISTS "mileage_logs_all" ON mileage_logs;
CREATE POLICY "mileage_logs_all" ON mileage_logs FOR ALL TO anon USING (true) WITH CHECK (true);

-- --- Führerscheinkontrolle ---
DROP POLICY IF EXISTS "license_settings_select" ON license_check_settings;
DROP POLICY IF EXISTS "license_settings_update" ON license_check_settings;
CREATE POLICY "license_settings_select" ON license_check_settings FOR SELECT TO anon USING (true);
CREATE POLICY "license_settings_update" ON license_check_settings FOR UPDATE TO anon USING (true);

DROP POLICY IF EXISTS "license_inspectors_all" ON license_check_inspectors;
CREATE POLICY "license_inspectors_all" ON license_check_inspectors FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "license_employees_all" ON license_check_employees;
CREATE POLICY "license_employees_all" ON license_check_employees FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "license_checks_all" ON license_checks;
CREATE POLICY "license_checks_all" ON license_checks FOR ALL TO anon USING (true) WITH CHECK (true);

-- --- UVV ---
DROP POLICY IF EXISTS "uvv_settings_select" ON uvv_settings;
DROP POLICY IF EXISTS "uvv_settings_update" ON uvv_settings;
CREATE POLICY "uvv_settings_select" ON uvv_settings FOR SELECT TO anon USING (true);
CREATE POLICY "uvv_settings_update" ON uvv_settings FOR UPDATE TO anon USING (true);

DROP POLICY IF EXISTS "uvv_instructors_all" ON uvv_instructors;
CREATE POLICY "uvv_instructors_all" ON uvv_instructors FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "uvv_checks_all" ON uvv_checks;
CREATE POLICY "uvv_checks_all" ON uvv_checks FOR ALL TO anon USING (true) WITH CHECK (true);

-- --- Affiliate/Recruiting (nur service_role — Zugriff über Server-API-Routen) ---
DROP POLICY IF EXISTS "handwerker_service_role" ON handwerker;
CREATE POLICY "handwerker_service_role" ON handwerker FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "stellen_service_role" ON stellen;
CREATE POLICY "stellen_service_role" ON stellen FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "empfehlungen_service_role" ON empfehlungen;
CREATE POLICY "empfehlungen_service_role" ON empfehlungen FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "app_settings_service_role" ON app_settings;
CREATE POLICY "app_settings_service_role" ON app_settings FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "audit_log_service_role" ON audit_log;
CREATE POLICY "audit_log_service_role" ON audit_log FOR ALL TO service_role USING (true) WITH CHECK (true);

-- --- ROI (anon-Rolle — App nutzt Anon-Key) ---
DROP POLICY IF EXISTS "roi_jobs_all" ON roi.jobs;
CREATE POLICY "roi_jobs_all" ON roi.jobs FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "roi_config_all" ON roi.config;
CREATE POLICY "roi_config_all" ON roi.config FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "roi_uploads_all" ON roi.uploads;
CREATE POLICY "roi_uploads_all" ON roi.uploads FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "roi_purchases_all" ON roi.purchases;
CREATE POLICY "roi_purchases_all" ON roi.purchases FOR ALL TO anon USING (true) WITH CHECK (true);

-- --- VOB (Lesen für anon+authenticated, Schreiben für service_role) ---
DROP POLICY IF EXISTS "vob_companies_lesen" ON vob.companies;
CREATE POLICY "vob_companies_lesen" ON vob.companies FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "vob_companies_schreiben" ON vob.companies;
CREATE POLICY "vob_companies_schreiben" ON vob.companies FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "vob_scans_lesen" ON vob.vob_scans;
CREATE POLICY "vob_scans_lesen" ON vob.vob_scans FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "vob_scans_schreiben" ON vob.vob_scans;
CREATE POLICY "vob_scans_schreiben" ON vob.vob_scans FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "vob_tenders_lesen" ON vob.vob_tenders;
CREATE POLICY "vob_tenders_lesen" ON vob.vob_tenders FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "vob_tenders_schreiben" ON vob.vob_tenders;
CREATE POLICY "vob_tenders_schreiben" ON vob.vob_tenders FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "vob_matches_lesen" ON vob.vob_matches;
CREATE POLICY "vob_matches_lesen" ON vob.vob_matches FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "vob_matches_schreiben" ON vob.vob_matches;
CREATE POLICY "vob_matches_schreiben" ON vob.vob_matches FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- BERECHTIGUNGEN (GRANTS) — PostgREST / Supabase API
-- ============================================================================

-- Public Schema
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES    IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- ROI Schema
GRANT USAGE ON SCHEMA roi TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES    IN SCHEMA roi TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA roi TO anon, authenticated;
GRANT ALL ON ALL TABLES    IN SCHEMA roi TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA roi TO service_role;

-- VOB Schema
GRANT USAGE ON SCHEMA vob TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES     IN SCHEMA vob TO anon, authenticated;
GRANT ALL ON ALL TABLES        IN SCHEMA vob TO service_role;
GRANT ALL ON ALL SEQUENCES     IN SCHEMA vob TO anon, authenticated, service_role;

-- ============================================================================
-- SEED-DATEN
-- ============================================================================

-- Standard-Terminarten (feste UUIDs für Referenzierung im App-Code)
INSERT INTO appointment_types (id, name, default_interval_months, color) VALUES
  ('11111111-1111-1111-1111-111111111001', 'TÜV',              24,   '#ef4444'),
  ('11111111-1111-1111-1111-111111111002', 'Service/Wartung',  12,   '#3b82f6'),
  ('11111111-1111-1111-1111-111111111003', 'Ölwechsel',        12,   '#f59e0b'),
  ('11111111-1111-1111-1111-111111111004', 'Reifenwechsel',    6,    '#10b981'),
  ('11111111-1111-1111-1111-111111111005', 'Inspektion',       12,   '#8b5cf6'),
  ('11111111-1111-1111-1111-111111111006', 'Bremsenprüfung',   12,   '#ec4899'),
  ('11111111-1111-1111-1111-111111111007', 'UVV-Prüfung',      12,   '#06b6d4'),
  ('11111111-1111-1111-1111-111111111008', 'Leasing-Rückgabe', NULL, '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- Standard-Schadensarten (feste UUIDs)
INSERT INTO damage_types (id, name) VALUES
  ('22222222-2222-2222-2222-222222222001', 'Kollision/Unfall'),
  ('22222222-2222-2222-2222-222222222002', 'Parkschaden'),
  ('22222222-2222-2222-2222-222222222003', 'Vandalismus'),
  ('22222222-2222-2222-2222-222222222004', 'Wetterschaden'),
  ('22222222-2222-2222-2222-222222222005', 'Glasschaden'),
  ('22222222-2222-2222-2222-222222222006', 'Mechanischer Schaden'),
  ('22222222-2222-2222-2222-222222222007', 'Reifenschaden'),
  ('22222222-2222-2222-2222-222222222008', 'Innenraumschaden')
ON CONFLICT (name) DO NOTHING;

-- Standard-Kostenarten (feste UUIDs)
INSERT INTO cost_types (id, name, icon) VALUES
  ('33333333-3333-3333-3333-333333333001', 'Tanken',          '⛽'),
  ('33333333-3333-3333-3333-333333333002', 'Service/Wartung', '🔧'),
  ('33333333-3333-3333-3333-333333333003', 'Reparatur',       '🛠️'),
  ('33333333-3333-3333-3333-333333333004', 'Versicherung',    '🛡️'),
  ('33333333-3333-3333-3333-333333333005', 'KFZ-Steuer',      '📋'),
  ('33333333-3333-3333-3333-333333333006', 'Leasing',         '📄'),
  ('33333333-3333-3333-3333-333333333007', 'Parken',          '🅿️'),
  ('33333333-3333-3333-3333-333333333008', 'Maut',            '🛣️'),
  ('33333333-3333-3333-3333-333333333009', 'Fahrzeugwäsche',  '🚿')
ON CONFLICT (name) DO NOTHING;

-- Standard-Dokumenttypen (feste UUIDs)
INSERT INTO document_types (id, name, description) VALUES
  ('44444444-4444-4444-4444-444444444001', 'Fahrzeugschein',      'Zulassungsbescheinigung Teil I'),
  ('44444444-4444-4444-4444-444444444002', 'Fahrzeugbrief',       'Zulassungsbescheinigung Teil II'),
  ('44444444-4444-4444-4444-444444444003', 'Versicherungspolice', 'KFZ-Versicherungsdokumente'),
  ('44444444-4444-4444-4444-444444444004', 'TÜV-Bericht',        'Hauptuntersuchung'),
  ('44444444-4444-4444-4444-444444444005', 'Serviceheft',         'Wartungsnachweise'),
  ('44444444-4444-4444-4444-444444444006', 'Rechnung',            'Rechnungen und Belege'),
  ('44444444-4444-4444-4444-444444444007', 'Vertrag',             'Kauf- oder Leasingvertrag'),
  ('44444444-4444-4444-4444-444444444008', 'Übergabeprotokoll',   'Fahrzeugübergabe')
ON CONFLICT (name) DO NOTHING;

-- Führerscheinkontrolle: Standard-Einstellungen (Singleton)
INSERT INTO license_check_settings (id, check_interval_months, warning_days_before)
VALUES ('00000000-0000-0000-0000-000000000001', 6, 14)
ON CONFLICT (id) DO NOTHING;

-- UVV: Standard-Einstellungen (Singleton)
INSERT INTO uvv_settings (id, check_interval_months, warning_days_before)
VALUES ('00000000-0000-0000-0000-000000000002', 12, 30)
ON CONFLICT (id) DO NOTHING;

-- ROI: Standard-Konfiguration
INSERT INTO roi.config (
  homepage_kosten, ads_setup_kosten, google_ads_budget,
  pflegekosten_monat, operative_marge_pct, avg_auftraege_monat
) VALUES (3500, 1200, 800, 300, 0.35, 8);

-- VOB: Partnerunternehmen
INSERT INTO vob.companies (name, slug, trades, keywords, color, active) VALUES
  (
    'Tischlerei Brink', 'brink',
    ARRAY['Tischlerarbeiten', 'Schreinerarbeiten', 'Holzbau'],
    ARRAY['Tischler', 'Schreiner', 'Holz', 'Fenster', 'Türen', 'Treppen', 'Möbel'],
    '#1E40AF', TRUE
  ),
  (
    'Malerei Hantke', 'hantke',
    ARRAY['Malerarbeiten', 'Tapezierarbeiten', 'Lackierarbeiten'],
    ARRAY['Maler', 'Anstrich', 'Lackierung', 'Tapete', 'Putz', 'Fassade'],
    '#15803D', TRUE
  ),
  (
    'Seehafer Elemente', 'seehafer',
    ARRAY['Fenster und Türen', 'Sonnenschutz', 'Rollläden'],
    ARRAY['Fenster', 'Türen', 'Rollläden', 'Sonnenschutz', 'Verglasung', 'Elemente'],
    '#B45309', TRUE
  ),
  (
    'Werner Bau', 'werner-bau',
    ARRAY['Rohbauarbeiten', 'Maurerarbeiten', 'Betonarbeiten'],
    ARRAY['Rohbau', 'Maurer', 'Beton', 'Fundament', 'Mauerwerk', 'Hochbau'],
    '#7C3AED', TRUE
  ),
  (
    'Werner Gerüstbau', 'werner-geruestbau',
    ARRAY['Gerüstbauarbeiten', 'Gerüstvermietung'],
    ARRAY['Gerüst', 'Gerüstbau', 'Fassadengerüst', 'Arbeitsgerüst'],
    '#DC2626', TRUE
  ),
  (
    'Tischlerei Mehlig', 'mehlig',
    ARRAY['Tischlerarbeiten', 'Innenausbau', 'Küchenmontage'],
    ARRAY['Tischler', 'Innenausbau', 'Küche', 'Einbauschränke', 'Holzböden'],
    '#0891B2', TRUE
  )
ON CONFLICT (slug) DO NOTHING;

-- ============================================================================
-- SPEICHER-BUCKETS (manuell über Supabase Dashboard anlegen)
-- Storage > New Bucket > "documents" (privat)
-- Storage > New Bucket > "damage-images" (privat)
-- ============================================================================

-- ============================================================================
-- ENDE – Alle 5 Teile ausgeführt = vollständige Datenbank
-- Stand: 2026-04-10 — GruppenwerkUnited
-- ============================================================================
