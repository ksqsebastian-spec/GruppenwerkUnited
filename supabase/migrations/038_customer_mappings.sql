-- Gespeicherte Code-Mappings je Kunde
--
-- Beim Generieren eines Dokuments mit Datenkodierungs-Encode entstehen
-- Code↔Klartext-Zuordnungen (z.B. GW-9VLK-B44H = Edeka). Damit der Nutzer
-- diese später beim Zurückübersetzen der KI-Antwort zur Hand hat, kann er
-- sie pro Kunde speichern.

CREATE TABLE IF NOT EXISTS customer_mappings (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  company     TEXT        NOT NULL,

  -- Bezeichnung des Anlasses, z.B. "Angebot — Angebot erstellen"
  anlass      TEXT        NOT NULL,

  -- Array von { code, field, label, value }
  eintraege   JSONB       NOT NULL DEFAULT '[]'::jsonb,

  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_mappings_customer ON customer_mappings (customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_mappings_company  ON customer_mappings (company);

ALTER TABLE customer_mappings ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE customer_mappings TO service_role;
