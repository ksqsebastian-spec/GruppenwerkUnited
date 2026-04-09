-- Migration: company-Spalte für Multi-Tenant-Datentrennung
-- Ausführen in Supabase SQL-Editor

-- ============================================================
-- 1. AFFILIATE SCHEMA
-- ============================================================

ALTER TABLE affiliate.handwerker
  ADD COLUMN IF NOT EXISTS company TEXT NOT NULL DEFAULT '';

ALTER TABLE affiliate.empfehlungen
  ADD COLUMN IF NOT EXISTS company TEXT NOT NULL DEFAULT '';

-- Index für schnelle company-Filter
CREATE INDEX IF NOT EXISTS idx_affiliate_handwerker_company
  ON affiliate.handwerker (company);

CREATE INDEX IF NOT EXISTS idx_affiliate_empfehlungen_company
  ON affiliate.empfehlungen (company);

-- Trigger: empfehlungen.company automatisch aus handwerker ableiten
-- (falls company beim Insert leer ist und handwerker_id gesetzt)
CREATE OR REPLACE FUNCTION affiliate.set_empfehlung_company()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (NEW.company IS NULL OR NEW.company = '') AND NEW.handwerker_id IS NOT NULL THEN
    SELECT company INTO NEW.company
    FROM affiliate.handwerker
    WHERE id = NEW.handwerker_id;
    NEW.company := COALESCE(NEW.company, '');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_empfehlung_company ON affiliate.empfehlungen;
CREATE TRIGGER trg_empfehlung_company
  BEFORE INSERT ON affiliate.empfehlungen
  FOR EACH ROW EXECUTE FUNCTION affiliate.set_empfehlung_company();

-- ============================================================
-- 2. RECRUITING SCHEMA
-- ============================================================

ALTER TABLE recruiting.stellen
  ADD COLUMN IF NOT EXISTS company TEXT NOT NULL DEFAULT '';

ALTER TABLE recruiting.empfehlungen
  ADD COLUMN IF NOT EXISTS company TEXT NOT NULL DEFAULT '';

-- Index für schnelle company-Filter
CREATE INDEX IF NOT EXISTS idx_recruiting_stellen_company
  ON recruiting.stellen (company);

CREATE INDEX IF NOT EXISTS idx_recruiting_empfehlungen_company
  ON recruiting.empfehlungen (company);

-- Trigger: empfehlungen.company automatisch aus stellen ableiten
-- (falls company beim Insert leer ist und stelle_id gesetzt)
CREATE OR REPLACE FUNCTION recruiting.set_empfehlung_company()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (NEW.company IS NULL OR NEW.company = '') AND NEW.stelle_id IS NOT NULL THEN
    SELECT company INTO NEW.company
    FROM recruiting.stellen
    WHERE id = NEW.stelle_id;
    NEW.company := COALESCE(NEW.company, '');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_empfehlung_company ON recruiting.empfehlungen;
CREATE TRIGGER trg_empfehlung_company
  BEFORE INSERT ON recruiting.empfehlungen
  FOR EACH ROW EXECUTE FUNCTION recruiting.set_empfehlung_company();
