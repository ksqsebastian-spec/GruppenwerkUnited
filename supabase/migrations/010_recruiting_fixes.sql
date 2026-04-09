-- ============================================================================
-- Migration 010: Recruiting-Modul Fixes
-- Fügt company-Spalte zu stellen und empfehlungen hinzu (Multi-Tenant-Trennung)
-- Kopiert Logik aus add_company_column.sql (unnummeriert) — kanonische Variante
-- ============================================================================

-- company-Spalte für stellen
ALTER TABLE stellen
  ADD COLUMN IF NOT EXISTS company TEXT NOT NULL DEFAULT '';

-- company-Spalte für empfehlungen
ALTER TABLE empfehlungen
  ADD COLUMN IF NOT EXISTS company TEXT NOT NULL DEFAULT '';

-- Indizes für schnelle company-Filter
CREATE INDEX IF NOT EXISTS idx_stellen_company
  ON stellen (company);

CREATE INDEX IF NOT EXISTS idx_empfehlungen_company
  ON empfehlungen (company);

-- Trigger: empfehlungen.company automatisch aus Stelle ableiten (Recruiting)
-- bzw. aus Handwerker ableiten (Affiliate), falls nicht explizit gesetzt
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
