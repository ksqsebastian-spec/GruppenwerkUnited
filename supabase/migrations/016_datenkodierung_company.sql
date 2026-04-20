-- Datenkodierung: company-Spalte für Multi-Tenant-Datentrennung

ALTER TABLE datenkodierungen
  ADD COLUMN IF NOT EXISTS company TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS idx_datenkodierungen_company
  ON datenkodierungen (company);
