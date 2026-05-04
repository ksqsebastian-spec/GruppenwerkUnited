-- Leads / Grid View CRM
-- Firmengebundene Lead-Datenbank mit Kommentaren und Dateianhängen.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Leads ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS leads (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company         TEXT        NOT NULL DEFAULT '',

  -- Kontakt
  vorname         TEXT        NOT NULL DEFAULT '',
  nachname        TEXT        NOT NULL DEFAULT '',
  email           TEXT,
  telefon         TEXT,
  firma           TEXT,
  position        TEXT,
  linkedin_url    TEXT,
  stadt           TEXT,
  land            TEXT,
  branche         TEXT,

  -- CRM
  status          TEXT        NOT NULL DEFAULT 'neu',
  prioritaet      TEXT        NOT NULL DEFAULT 'mittel',
  tags            TEXT[]      NOT NULL DEFAULT '{}',
  notizen         TEXT,
  naechste_aktion TEXT,
  letzter_kontakt DATE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_company       ON leads (company);
CREATE INDEX IF NOT EXISTS idx_leads_status        ON leads (company, status);
CREATE INDEX IF NOT EXISTS idx_leads_prioritaet    ON leads (company, prioritaet);
CREATE INDEX IF NOT EXISTS idx_leads_created_at    ON leads (created_at DESC);

DROP TRIGGER IF EXISTS update_leads_updated_at ON leads;
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "leads_all" ON leads;
CREATE POLICY "leads_all" ON leads FOR ALL TO anon USING (true) WITH CHECK (true);
GRANT ALL ON TABLE leads TO anon, authenticated, service_role;

-- ── Kommentare ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lead_kommentare (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id    UUID        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  company    TEXT        NOT NULL DEFAULT '',
  text       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_kommentare_lead ON lead_kommentare (lead_id);

ALTER TABLE lead_kommentare ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lead_kommentare_all" ON lead_kommentare;
CREATE POLICY "lead_kommentare_all" ON lead_kommentare FOR ALL TO anon USING (true) WITH CHECK (true);
GRANT ALL ON TABLE lead_kommentare TO anon, authenticated, service_role;

-- ── Dateianhänge ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lead_dateien (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id      UUID        NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  company      TEXT        NOT NULL DEFAULT '',
  dateiname    TEXT        NOT NULL,
  dateipfad    TEXT        NOT NULL,
  dateityp     TEXT,
  dateigroesse INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lead_dateien_lead ON lead_dateien (lead_id);

ALTER TABLE lead_dateien ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lead_dateien_all" ON lead_dateien;
CREATE POLICY "lead_dateien_all" ON lead_dateien FOR ALL TO anon USING (true) WITH CHECK (true);
GRANT ALL ON TABLE lead_dateien TO anon, authenticated, service_role;
