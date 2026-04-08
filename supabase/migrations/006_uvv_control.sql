-- ============================================================================
-- UVV-Kontrolle (Fahrerunterweisung) - Datenbank-Schema
-- Version: 1.0
-- Datum: 2026-02-05
--
-- Ermöglicht die Verwaltung von jährlichen Fahrerunterweisungen gemäß UVV
-- (Unfallverhütungsvorschrift).
-- ============================================================================

-- ============================================================================
-- EINSTELLUNGEN (Singleton-Tabelle)
-- ============================================================================

CREATE TABLE IF NOT EXISTS uvv_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000002'::uuid,
  check_interval_months INTEGER NOT NULL DEFAULT 12
    CHECK (check_interval_months > 0 AND check_interval_months <= 24),
  warning_days_before INTEGER NOT NULL DEFAULT 30
    CHECK (warning_days_before >= 0 AND warning_days_before <= 90),
  default_topics TEXT DEFAULT 'Verkehrssicherheit, aktuelle Verkehrsregeln, Verhalten bei Unfällen, Fahrzeugcheck, Ladungssicherung',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Standard-Einstellungen einfügen (12 Monate = jährlich)
INSERT INTO uvv_settings (id, check_interval_months, warning_days_before)
VALUES ('00000000-0000-0000-0000-000000000002', 12, 30)
ON CONFLICT (id) DO NOTHING;

-- Trigger für updated_at
CREATE OR REPLACE FUNCTION update_uvv_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_uvv_settings_updated_at ON uvv_settings;
CREATE TRIGGER trigger_uvv_settings_updated_at
  BEFORE UPDATE ON uvv_settings
  FOR EACH ROW EXECUTE FUNCTION update_uvv_settings_updated_at();

-- ============================================================================
-- UNTERWEISENDE (wer UVV-Unterweisungen durchführen darf)
-- ============================================================================

CREATE TABLE IF NOT EXISTS uvv_instructors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index für Status-Filterung
CREATE INDEX IF NOT EXISTS idx_uvv_instructors_status ON uvv_instructors(status);

-- ============================================================================
-- UVV-UNTERWEISUNGEN (Historie aller durchgeführten Unterweisungen)
-- Verknüpft mit bestehender drivers Tabelle
-- ============================================================================

CREATE TABLE IF NOT EXISTS uvv_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  check_date DATE NOT NULL,
  instructed_by_id UUID NOT NULL REFERENCES uvv_instructors(id) ON DELETE RESTRICT,
  topics TEXT,  -- Optionale zusätzliche Themen
  next_check_due DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_uvv_checks_driver ON uvv_checks(driver_id);
CREATE INDEX IF NOT EXISTS idx_uvv_checks_date ON uvv_checks(check_date);
CREATE INDEX IF NOT EXISTS idx_uvv_checks_next_due ON uvv_checks(next_check_due);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE uvv_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE uvv_instructors ENABLE ROW LEVEL SECURITY;
ALTER TABLE uvv_checks ENABLE ROW LEVEL SECURITY;

-- Policies für authentifizierte Benutzer
DROP POLICY IF EXISTS "uvv_settings_select" ON uvv_settings;
CREATE POLICY "uvv_settings_select" ON uvv_settings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "uvv_settings_update" ON uvv_settings;
CREATE POLICY "uvv_settings_update" ON uvv_settings
  FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "uvv_instructors_all" ON uvv_instructors;
CREATE POLICY "uvv_instructors_all" ON uvv_instructors
  FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS "uvv_checks_all" ON uvv_checks;
CREATE POLICY "uvv_checks_all" ON uvv_checks
  FOR ALL TO authenticated USING (true);

-- ============================================================================
-- VERIFIZIERUNG
-- ============================================================================
-- Nach Ausführung prüfen mit:
-- SELECT * FROM uvv_settings;
-- SELECT table_name FROM information_schema.tables WHERE table_name LIKE 'uvv%';
