-- ============================================================
-- Migration: Affiliate → Recruiting
-- - Replace handwerker with stellen (job positions)
-- - Rename kunde → kandidat, provision → praemie
-- - Remove rechnungsbetrag (no invoices in recruiting)
-- - Add 4-stage status: offen → eingestellt → probezeit_bestanden → ausgezahlt
-- - Add app_settings for global bonus configuration
-- ============================================================

-- 1. App Settings (key-value store for global config)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default bonus amount
INSERT INTO app_settings (key, value)
VALUES ('praemie_betrag_default', '1000'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- 2. Create stellen table (replaces handwerker)
CREATE TABLE stellen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 200),
  description TEXT CHECK (char_length(description) <= 2000),
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_stellen_updated_at
  BEFORE UPDATE ON stellen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Drop old constraints from empfehlungen
ALTER TABLE empfehlungen DROP CONSTRAINT IF EXISTS chk_financial_data;
ALTER TABLE empfehlungen DROP CONSTRAINT IF EXISTS chk_payout_data;
ALTER TABLE empfehlungen DROP CONSTRAINT IF EXISTS empfehlungen_handwerker_id_fkey;

-- 4. Rename fields
ALTER TABLE empfehlungen RENAME COLUMN kunde_name TO kandidat_name;
ALTER TABLE empfehlungen RENAME COLUMN kunde_kontakt TO kandidat_kontakt;
ALTER TABLE empfehlungen RENAME COLUMN handwerker_id TO stelle_id;
ALTER TABLE empfehlungen RENAME COLUMN provision_betrag TO praemie_betrag;

-- 5. Add new fields
ALTER TABLE empfehlungen ADD COLUMN IF NOT EXISTS position TEXT CHECK (char_length(position) <= 200);

-- 6. Drop invoice-related columns
ALTER TABLE empfehlungen DROP COLUMN IF EXISTS rechnungsbetrag;
ALTER TABLE empfehlungen DROP COLUMN IF EXISTS paypal_batch_id;
ALTER TABLE empfehlungen DROP COLUMN IF EXISTS paypal_transaction_id;

-- 7. Update status to support 4 stages
ALTER TABLE empfehlungen DROP CONSTRAINT IF EXISTS empfehlungen_status_check;
ALTER TABLE empfehlungen ADD CONSTRAINT empfehlungen_status_check
  CHECK (status IN ('offen', 'eingestellt', 'probezeit_bestanden', 'ausgezahlt'));

-- 8. Add foreign key to stellen
ALTER TABLE empfehlungen ADD CONSTRAINT empfehlungen_stelle_id_fkey
  FOREIGN KEY (stelle_id) REFERENCES stellen(id) ON DELETE RESTRICT;

-- 9. Update constraints for recruiting flow
ALTER TABLE empfehlungen ADD CONSTRAINT chk_payout_data CHECK (
  (status != 'ausgezahlt') OR
  (ausgezahlt_am IS NOT NULL)
);

-- 10. Update search index for new field names
DROP INDEX IF EXISTS idx_empfehlungen_search;
CREATE INDEX idx_empfehlungen_search ON empfehlungen
  USING GIN (to_tsvector('german', kandidat_name || ' ' || empfehler_name));

-- 11. Rename handwerker index
DROP INDEX IF EXISTS idx_empfehlungen_handwerker;
CREATE INDEX idx_empfehlungen_stelle ON empfehlungen(stelle_id);

-- 12. RLS for stellen (admin-only via service_role, no client policies needed)
ALTER TABLE stellen ENABLE ROW LEVEL SECURITY;
