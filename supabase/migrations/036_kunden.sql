-- Kunden-Modul (Customer-Portal)
--
-- Lightweight Kundenverwaltung pro Mandant mit:
--   • Stammdaten (Firmenname, Ansprechpartner, Kontaktdaten, Adresse, Status, Notizen)
--   • Kommentaren je Kunde
--   • Dateianhängen je Kunde (Storage-Bucket "customer-dateien")
--   • Pro-Mandant-Bibliothek wiederverwendbarer Prompt-Vorlagen
--     für Rechnung/Mahnung/Angebot etc. mit Platzhaltern
--     ({{customer.feld}}, {{DATENKODIERUNGS_CODE}})
--
-- Zugriff: ausschließlich serverseitig über Service-Role (Admin-Client).
-- Daher keine GRANT/Policy-Vergabe an anon/authenticated.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Kunden ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customers (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company         TEXT        NOT NULL,

  firmenname      TEXT        NOT NULL,
  ansprechpartner TEXT,
  email           TEXT,
  telefon         TEXT,
  adresse         TEXT,

  -- aktiv | inaktiv | prospect | archiviert
  status          TEXT        NOT NULL DEFAULT 'aktiv',

  notizen         TEXT,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Pro Mandant darf ein Firmenname nur einmal vorkommen
  CONSTRAINT customers_company_firmenname_key UNIQUE (company, firmenname)
);

CREATE INDEX IF NOT EXISTS idx_customers_company    ON customers (company);
CREATE INDEX IF NOT EXISTS idx_customers_status     ON customers (status);
CREATE INDEX IF NOT EXISTS idx_customers_created_at ON customers (created_at DESC);

DROP TRIGGER IF EXISTS update_customers_updated_at ON customers;
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
-- Keine Policies: ohne Policy ist nichts erlaubt; Service-Role umgeht RLS ohnehin

-- ── Kommentare ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_kommentare (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  company     TEXT        NOT NULL,
  text        TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_kommentare_customer ON customer_kommentare (customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_kommentare_company  ON customer_kommentare (company);

ALTER TABLE customer_kommentare ENABLE ROW LEVEL SECURITY;

-- ── Dateianhänge ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_dateien (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id  UUID        NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  company      TEXT        NOT NULL,
  dateiname    TEXT        NOT NULL,
  dateipfad    TEXT        NOT NULL,
  dateityp     TEXT,
  dateigroesse INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customer_dateien_customer ON customer_dateien (customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_dateien_company  ON customer_dateien (company);

ALTER TABLE customer_dateien ENABLE ROW LEVEL SECURITY;

-- ── Prompt-Vorlagen-Bibliothek (pro Mandant) ─────────────────────────────────

CREATE TABLE IF NOT EXISTS customer_prompts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company      TEXT        NOT NULL,

  name         TEXT        NOT NULL,
  beschreibung TEXT,
  -- Frei wählbar — typische Werte: 'Rechnung','Mahnung','Angebot','Sonstiges'
  kategorie    TEXT,
  -- Template-Text mit Platzhaltern, z.B.:
  --   "Erstelle eine Rechnung für {{customer.firmenname}}, Adresse
  --    {{customer.adresse}}. MwSt: {{MWST}}, Präfix: {{RNR_PRAEFIX}}."
  template     TEXT        NOT NULL,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT customer_prompts_company_name_key UNIQUE (company, name)
);

CREATE INDEX IF NOT EXISTS idx_customer_prompts_company   ON customer_prompts (company);
CREATE INDEX IF NOT EXISTS idx_customer_prompts_kategorie ON customer_prompts (kategorie);

DROP TRIGGER IF EXISTS update_customer_prompts_updated_at ON customer_prompts;
CREATE TRIGGER update_customer_prompts_updated_at
  BEFORE UPDATE ON customer_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE customer_prompts ENABLE ROW LEVEL SECURITY;

-- ── Service-Role-Zugriff ─────────────────────────────────────────────────────
-- Neue Tabellen müssen explizit für service_role freigegeben werden, damit der
-- Admin-Client (mit Service-Role-Key) lesen/schreiben kann. anon/authenticated
-- bleiben absichtlich außen vor — der Zugriff läuft ausschließlich über die
-- /api/kunden-Routen.

GRANT ALL ON TABLE customers           TO service_role;
GRANT ALL ON TABLE customer_kommentare TO service_role;
GRANT ALL ON TABLE customer_dateien    TO service_role;
GRANT ALL ON TABLE customer_prompts    TO service_role;

-- ── Storage-Bucket für Datei-Uploads ─────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public)
VALUES ('customer-dateien', 'customer-dateien', false)
ON CONFLICT (id) DO NOTHING;
