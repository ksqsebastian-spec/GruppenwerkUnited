-- ============================================================================
-- Migration 011: Affiliate-Modul — company-Spalte und Trigger nachliefern
--
-- Problem: complete_schema.sql fehlte die company-Spalte auf handwerker,
-- stellen und empfehlungen. Diese Migration gleicht bestehende Instanzen an.
--
-- Sicher wiederholbar (IF NOT EXISTS / OR REPLACE).
-- ============================================================================

-- company-Spalte für Multi-Tenant-Datentrennung
ALTER TABLE handwerker
  ADD COLUMN IF NOT EXISTS company TEXT NOT NULL DEFAULT '';

ALTER TABLE stellen
  ADD COLUMN IF NOT EXISTS company TEXT NOT NULL DEFAULT '';

ALTER TABLE empfehlungen
  ADD COLUMN IF NOT EXISTS company TEXT NOT NULL DEFAULT '';

-- Indizes für schnelle company-Filter
CREATE INDEX IF NOT EXISTS idx_handwerker_company
  ON handwerker (company);

CREATE INDEX IF NOT EXISTS idx_stellen_company
  ON stellen (company);

CREATE INDEX IF NOT EXISTS idx_empfehlungen_company
  ON empfehlungen (company);

-- Trigger: empfehlungen.company automatisch ableiten
-- Affiliate: aus handwerker_id → handwerker.company
-- Recruiting: aus stelle_id → stellen.company
CREATE OR REPLACE FUNCTION set_empfehlung_company()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (NEW.company IS NULL OR NEW.company = '') THEN
    IF NEW.handwerker_id IS NOT NULL THEN
      SELECT company INTO NEW.company FROM handwerker WHERE id = NEW.handwerker_id;
    ELSIF NEW.stelle_id IS NOT NULL THEN
      SELECT company INTO NEW.company FROM stellen WHERE id = NEW.stelle_id;
    END IF;
    NEW.company := COALESCE(NEW.company, '');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_empfehlung_company ON empfehlungen;
CREATE TRIGGER trg_empfehlung_company
  BEFORE INSERT ON empfehlungen
  FOR EACH ROW EXECUTE FUNCTION set_empfehlung_company();
