-- ============================================================================
-- ROI-Modul Schema
-- Erstellt das dedizierte 'roi'-Schema mit allen benötigten Tabellen
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS roi;

-- Aufträge (Google Ads Projekt)
CREATE TABLE roi.jobs (
  id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  jahr           INTEGER,
  monat          TEXT,
  kundenname     TEXT,
  objektadresse  TEXT,
  taetigkeit     TEXT,
  herkunft       TEXT,
  netto_umsatz   DECIMAL(12,2),
  rohertrag      DECIMAL(12,2),
  angebot        TEXT,
  datum          DATE,
  company_id     TEXT           NOT NULL DEFAULT 'admin',
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Konfiguration (ROI-Parameter)
CREATE TABLE roi.config (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  homepage_kosten       DECIMAL(10,2) NOT NULL DEFAULT 3500,
  ads_setup_kosten      DECIMAL(10,2) NOT NULL DEFAULT 1200,
  google_ads_budget     DECIMAL(10,2) NOT NULL DEFAULT 800,
  pflegekosten_monat    DECIMAL(10,2) NOT NULL DEFAULT 300,
  operative_marge_pct   DECIMAL(5,4)  NOT NULL DEFAULT 0.35,
  avg_auftraege_monat   DECIMAL(5,2)  NOT NULL DEFAULT 8,
  company_id            TEXT          NOT NULL DEFAULT 'admin',
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Upload-Protokoll (importierte Dateien)
CREATE TABLE roi.uploads (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  filename        TEXT        NOT NULL,
  rows_imported   INTEGER     NOT NULL DEFAULT 0,
  rows_skipped    INTEGER     NOT NULL DEFAULT 0,
  column_mapping  JSONB,
  company_id      TEXT        NOT NULL DEFAULT 'admin',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Marketing-Einkäufe (Flywheel)
CREATE TABLE roi.purchases (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id    TEXT        NOT NULL,
  channel_name  TEXT        NOT NULL,
  amount        DECIMAL(10,2) NOT NULL,
  pricing       TEXT        NOT NULL CHECK (pricing IN ('recurring', 'onetime')),
  note          TEXT        NOT NULL DEFAULT '',
  purchased_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  company_id    TEXT        NOT NULL DEFAULT 'admin',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indizes
CREATE INDEX idx_roi_jobs_datum      ON roi.jobs(datum);
CREATE INDEX idx_roi_jobs_company    ON roi.jobs(company_id);
CREATE INDEX idx_roi_jobs_created    ON roi.jobs(created_at DESC);

CREATE INDEX idx_roi_config_company  ON roi.config(company_id);

CREATE INDEX idx_roi_uploads_created ON roi.uploads(created_at DESC);
CREATE INDEX idx_roi_uploads_company ON roi.uploads(company_id);

CREATE INDEX idx_roi_purchases_channel  ON roi.purchases(channel_id);
CREATE INDEX idx_roi_purchases_company  ON roi.purchases(company_id);
CREATE INDEX idx_roi_purchases_bought   ON roi.purchases(purchased_at DESC);

-- Standard-Konfiguration einfügen
INSERT INTO roi.config (
  homepage_kosten,
  ads_setup_kosten,
  google_ads_budget,
  pflegekosten_monat,
  operative_marge_pct,
  avg_auftraege_monat
) VALUES (
  3500,
  1200,
  800,
  300,
  0.35,
  8
);

-- RLS aktivieren
ALTER TABLE roi.jobs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi.config    ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi.uploads   ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi.purchases ENABLE ROW LEVEL SECURITY;

-- Richtlinien: voller Zugriff für eingeloggte Nutzer
CREATE POLICY "roi_jobs_all"      ON roi.jobs      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "roi_config_all"    ON roi.config    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "roi_uploads_all"   ON roi.uploads   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "roi_purchases_all" ON roi.purchases FOR ALL TO authenticated USING (true) WITH CHECK (true);
