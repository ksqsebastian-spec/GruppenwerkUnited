-- Migration: Polymorphe Dokumente für Schäden, Termine und Fahrer
-- Datum: 2026-02-02
--
-- Diese Migration erweitert die documents-Tabelle um Unterstützung für
-- verschiedene Entity-Typen (Fahrzeuge, Schäden, Termine, Fahrer).
--
-- ANLEITUNG: Führe dieses SQL in der Supabase SQL Editor aus.

-- 1. Neue Spalten hinzufügen
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) DEFAULT 'vehicle',
ADD COLUMN IF NOT EXISTS damage_id UUID REFERENCES damages(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS driver_id UUID REFERENCES drivers(id) ON DELETE CASCADE;

-- 2. vehicle_id nullable machen (war vorher NOT NULL)
ALTER TABLE documents ALTER COLUMN vehicle_id DROP NOT NULL;

-- 3. Bestehende Dokumente aktualisieren
UPDATE documents SET entity_type = 'vehicle' WHERE vehicle_id IS NOT NULL AND entity_type IS NULL;

-- 4. entity_type NOT NULL machen (nachdem bestehende Daten aktualisiert wurden)
ALTER TABLE documents ALTER COLUMN entity_type SET NOT NULL;

-- 5. Constraint: Genau eine Entity-Referenz muss gesetzt sein
ALTER TABLE documents DROP CONSTRAINT IF EXISTS check_single_entity_reference;
ALTER TABLE documents ADD CONSTRAINT check_single_entity_reference CHECK (
  (CASE WHEN vehicle_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN damage_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN appointment_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN driver_id IS NOT NULL THEN 1 ELSE 0 END) = 1
);

-- 6. Constraint: entity_type muss zur gesetzten Referenz passen
ALTER TABLE documents DROP CONSTRAINT IF EXISTS check_entity_type_matches;
ALTER TABLE documents ADD CONSTRAINT check_entity_type_matches CHECK (
  (entity_type = 'vehicle' AND vehicle_id IS NOT NULL) OR
  (entity_type = 'damage' AND damage_id IS NOT NULL) OR
  (entity_type = 'appointment' AND appointment_id IS NOT NULL) OR
  (entity_type = 'driver' AND driver_id IS NOT NULL)
);

-- 7. Neue Indizes für Performance
CREATE INDEX IF NOT EXISTS idx_documents_damage_id ON documents(damage_id) WHERE damage_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_appointment_id ON documents(appointment_id) WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_driver_id ON documents(driver_id) WHERE driver_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_entity_type ON documents(entity_type);

-- 8. RLS Policies aktualisieren (falls vorhanden)
-- Die bestehenden Policies sollten weiterhin funktionieren, da sie auf user_id basieren

-- Verifizierung: Überprüfe die neue Tabellenstruktur
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'documents';
