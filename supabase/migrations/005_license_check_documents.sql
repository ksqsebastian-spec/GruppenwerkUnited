-- ============================================================================
-- Führerscheinkontrolle - Dokumente pro Kontrolle
-- Version: 1.0
-- Datum: 2026-02-03
--
-- Ermöglicht das Hochladen von Dokumenten (z.B. Führerschein-Scan)
-- direkt bei einer Kontrolle.
-- ============================================================================

-- ============================================================================
-- NEUE SPALTE FÜR KONTROLLEN-DOKUMENTE
-- ============================================================================

-- Neue Spalte für Dokumente pro Kontrolle (nicht nur pro Mitarbeiter)
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS license_check_id UUID REFERENCES license_checks(id) ON DELETE CASCADE;

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_documents_license_check_id
  ON documents(license_check_id)
  WHERE license_check_id IS NOT NULL;

-- ============================================================================
-- CONSTRAINTS AKTUALISIEREN
-- ============================================================================

-- Bestehende Constraints entfernen und neu erstellen mit license_check
ALTER TABLE documents DROP CONSTRAINT IF EXISTS check_single_entity_reference;
ALTER TABLE documents ADD CONSTRAINT check_single_entity_reference CHECK (
  (CASE WHEN vehicle_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN damage_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN appointment_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN driver_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN license_check_employee_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN license_check_id IS NOT NULL THEN 1 ELSE 0 END) = 1
);

ALTER TABLE documents DROP CONSTRAINT IF EXISTS check_entity_type_matches;
ALTER TABLE documents ADD CONSTRAINT check_entity_type_matches CHECK (
  (entity_type = 'vehicle' AND vehicle_id IS NOT NULL) OR
  (entity_type = 'damage' AND damage_id IS NOT NULL) OR
  (entity_type = 'appointment' AND appointment_id IS NOT NULL) OR
  (entity_type = 'driver' AND driver_id IS NOT NULL) OR
  (entity_type = 'license_check_employee' AND license_check_employee_id IS NOT NULL) OR
  (entity_type = 'license_check' AND license_check_id IS NOT NULL)
);
