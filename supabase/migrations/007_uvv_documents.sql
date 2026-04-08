-- ============================================================================
-- UVV-Kontrolle - Dokumente-Erweiterung
-- Version: 1.0
-- Datum: 2026-02-05
--
-- Erweitert die documents-Tabelle um Unterstützung für UVV-Unterweisungen.
-- ============================================================================

-- ============================================================================
-- NEUE SPALTE FÜR UVV-DOKUMENTE
-- ============================================================================

-- Neue Spalte für Dokumente pro UVV-Unterweisung
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS uvv_check_id UUID REFERENCES uvv_checks(id) ON DELETE CASCADE;

-- Index für Performance
CREATE INDEX IF NOT EXISTS idx_documents_uvv_check_id
  ON documents(uvv_check_id)
  WHERE uvv_check_id IS NOT NULL;

-- ============================================================================
-- CONSTRAINTS AKTUALISIEREN
-- ============================================================================

-- Bestehende Constraints entfernen
ALTER TABLE documents DROP CONSTRAINT IF EXISTS check_single_entity_reference;
ALTER TABLE documents DROP CONSTRAINT IF EXISTS check_entity_type_matches;

-- Neuer Constraint: Genau eine Entity-Referenz muss gesetzt sein
ALTER TABLE documents ADD CONSTRAINT check_single_entity_reference CHECK (
  (CASE WHEN vehicle_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN damage_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN appointment_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN driver_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN license_check_employee_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN license_check_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN uvv_check_id IS NOT NULL THEN 1 ELSE 0 END) = 1
);

-- Neuer Constraint: entity_type muss zur gesetzten Referenz passen
ALTER TABLE documents ADD CONSTRAINT check_entity_type_matches CHECK (
  (entity_type = 'vehicle' AND vehicle_id IS NOT NULL) OR
  (entity_type = 'damage' AND damage_id IS NOT NULL) OR
  (entity_type = 'appointment' AND appointment_id IS NOT NULL) OR
  (entity_type = 'driver' AND driver_id IS NOT NULL) OR
  (entity_type = 'license_check_employee' AND license_check_employee_id IS NOT NULL) OR
  (entity_type = 'license_check' AND license_check_id IS NOT NULL) OR
  (entity_type = 'uvv_check' AND uvv_check_id IS NOT NULL)
);

-- ============================================================================
-- VERIFIZIERUNG
-- ============================================================================
-- Nach Ausführung prüfen mit:
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'documents' AND column_name = 'uvv_check_id';
-- SELECT conname FROM pg_constraint WHERE conrelid = 'documents'::regclass;
