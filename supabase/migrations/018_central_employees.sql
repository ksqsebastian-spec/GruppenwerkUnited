-- Migration 018: Führerscheinkontrolle auf zentrales Fahrer-System migrieren
-- employee_id optional machen (Rückwärtskompatibilität mit bestehenden Datensätzen)
ALTER TABLE license_checks ALTER COLUMN employee_id DROP NOT NULL;

-- driver_id als neue Referenz hinzufügen
ALTER TABLE license_checks
  ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE;

-- Prüfer- und Instrukteur-Flags für Fahrer
ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS is_license_inspector BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_uvv_instructor BOOLEAN NOT NULL DEFAULT false;

-- Performance-Indizes
CREATE INDEX IF NOT EXISTS idx_license_checks_driver_id
  ON license_checks(driver_id) WHERE driver_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_drivers_is_license_inspector
  ON drivers(is_license_inspector) WHERE is_license_inspector = true;

CREATE INDEX IF NOT EXISTS idx_drivers_is_uvv_instructor
  ON drivers(is_uvv_instructor) WHERE is_uvv_instructor = true;

-- RLS für driver_id in license_checks (anon darf lesen/schreiben)
CREATE POLICY IF NOT EXISTS "anon_select_license_checks" ON license_checks
  FOR SELECT TO anon USING (true);

CREATE POLICY IF NOT EXISTS "anon_insert_license_checks" ON license_checks
  FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "anon_update_license_checks" ON license_checks
  FOR UPDATE TO anon USING (true);

-- drivers Tabelle: anon darf is_license_inspector / is_uvv_instructor aktualisieren
-- (falls noch keine UPDATE-Policy vorhanden)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'drivers' AND policyname = 'anon_update_drivers'
  ) THEN
    CREATE POLICY "anon_update_drivers" ON drivers
      FOR UPDATE TO anon USING (true);
  END IF;
END
$$;
