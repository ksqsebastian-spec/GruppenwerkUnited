-- ============================================================================
-- Führerscheinkontrolle - Datenbank-Schema
-- Version: 1.0
-- Datum: 2026-02-03
--
-- Dieses Feature ermöglicht die rechtskonforme Führerscheinkontrolle
-- gemäß § 21 StVG (mindestens 2x jährlich).
-- ============================================================================

-- ============================================================================
-- ENUM-Typen
-- ============================================================================

CREATE TYPE license_employee_status AS ENUM ('active', 'archived');
CREATE TYPE license_inspector_status AS ENUM ('active', 'archived');

-- ============================================================================
-- TABELLEN
-- ============================================================================

-- Einstellungen für Führerscheinkontrolle (Singleton-Tabelle)
CREATE TABLE license_check_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  check_interval_months INTEGER NOT NULL DEFAULT 6 CHECK (check_interval_months > 0 AND check_interval_months <= 24),
  warning_days_before INTEGER NOT NULL DEFAULT 14 CHECK (warning_days_before >= 0 AND warning_days_before <= 90),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Standard-Einstellungen einfügen (nur eine Zeile)
INSERT INTO license_check_settings (id, check_interval_months, warning_days_before)
VALUES ('00000000-0000-0000-0000-000000000001', 6, 14);

-- Prüfer (wer Kontrollen durchführen darf)
CREATE TABLE license_check_inspectors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  status license_inspector_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Mitarbeiter für Führerscheinkontrolle (getrennt von Fahrern)
CREATE TABLE license_check_employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  personnel_number TEXT,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  email TEXT,
  license_classes TEXT NOT NULL,
  license_number TEXT,
  license_expiry_date DATE,
  status license_employee_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Führerscheinkontrollen (Historie aller durchgeführten Kontrollen)
CREATE TABLE license_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID NOT NULL REFERENCES license_check_employees(id) ON DELETE CASCADE,
  check_date DATE NOT NULL,
  checked_by_id UUID NOT NULL REFERENCES license_check_inspectors(id) ON DELETE RESTRICT,
  license_verified BOOLEAN NOT NULL DEFAULT false,
  next_check_due DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDIZES
-- ============================================================================

CREATE INDEX idx_license_employees_company ON license_check_employees(company_id);
CREATE INDEX idx_license_employees_status ON license_check_employees(status);
CREATE INDEX idx_license_employees_name ON license_check_employees(last_name, first_name);

CREATE INDEX idx_license_checks_employee ON license_checks(employee_id);
CREATE INDEX idx_license_checks_date ON license_checks(check_date);
CREATE INDEX idx_license_checks_next_due ON license_checks(next_check_due);

CREATE INDEX idx_license_inspectors_status ON license_check_inspectors(status);

-- ============================================================================
-- TRIGGER FÜR updated_at
-- ============================================================================

CREATE TRIGGER update_license_employees_updated_at
  BEFORE UPDATE ON license_check_employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_license_settings_updated_at
  BEFORE UPDATE ON license_check_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- DOKUMENTE ERWEITERN
-- ============================================================================

-- Neue Spalte für Dokumente pro Mitarbeiter
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS license_check_employee_id UUID REFERENCES license_check_employees(id) ON DELETE CASCADE;

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_documents_license_check_employee_id
  ON documents(license_check_employee_id)
  WHERE license_check_employee_id IS NOT NULL;

-- Bestehende Constraints aktualisieren
ALTER TABLE documents DROP CONSTRAINT IF EXISTS check_single_entity_reference;
ALTER TABLE documents ADD CONSTRAINT check_single_entity_reference CHECK (
  (CASE WHEN vehicle_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN damage_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN appointment_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN driver_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN license_check_employee_id IS NOT NULL THEN 1 ELSE 0 END) = 1
);

ALTER TABLE documents DROP CONSTRAINT IF EXISTS check_entity_type_matches;
ALTER TABLE documents ADD CONSTRAINT check_entity_type_matches CHECK (
  (entity_type = 'vehicle' AND vehicle_id IS NOT NULL) OR
  (entity_type = 'damage' AND damage_id IS NOT NULL) OR
  (entity_type = 'appointment' AND appointment_id IS NOT NULL) OR
  (entity_type = 'driver' AND driver_id IS NOT NULL) OR
  (entity_type = 'license_check_employee' AND license_check_employee_id IS NOT NULL)
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE license_check_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_check_inspectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_check_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_checks ENABLE ROW LEVEL SECURITY;

-- Policies für Einstellungen
CREATE POLICY "license_settings_select" ON license_check_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "license_settings_update" ON license_check_settings
  FOR UPDATE TO authenticated USING (true);

-- Policies für Prüfer
CREATE POLICY "license_inspectors_select" ON license_check_inspectors
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "license_inspectors_insert" ON license_check_inspectors
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "license_inspectors_update" ON license_check_inspectors
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "license_inspectors_delete" ON license_check_inspectors
  FOR DELETE TO authenticated USING (true);

-- Policies für Mitarbeiter
CREATE POLICY "license_employees_select" ON license_check_employees
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "license_employees_insert" ON license_check_employees
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "license_employees_update" ON license_check_employees
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "license_employees_delete" ON license_check_employees
  FOR DELETE TO authenticated USING (true);

-- Policies für Kontrollen
CREATE POLICY "license_checks_select" ON license_checks
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "license_checks_insert" ON license_checks
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "license_checks_update" ON license_checks
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "license_checks_delete" ON license_checks
  FOR DELETE TO authenticated USING (true);

-- ============================================================================
-- VERIFIZIERUNG (zum Testen nach Migration)
-- ============================================================================
--
-- SELECT table_name FROM information_schema.tables
-- WHERE table_name LIKE 'license%';
--
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'license_check_employees';
