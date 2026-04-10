-- ============================================================================
-- GruppenwerkUnited – Teil 3/5: ROI-Schema + VOB-Schema (Tabellen & Views)
-- Stand: 2026-04-10
-- Voraussetzung: Teil 1 und 2 müssen zuerst ausgeführt werden
-- ============================================================================

-- ============================================================================
-- ROI-SCHEMA (Return on Investment / Google Ads Tracking)
-- ============================================================================

-- Aufträge (Google Ads Projekte)
CREATE TABLE IF NOT EXISTS roi.jobs (
  id            UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  jahr          INTEGER,
  monat         TEXT,
  kundenname    TEXT,
  objektadresse TEXT,
  taetigkeit    TEXT,
  herkunft      TEXT,
  netto_umsatz  DECIMAL(12,2),
  rohertrag     DECIMAL(12,2),
  angebot       TEXT,
  datum         DATE,
  company_id    TEXT          NOT NULL DEFAULT 'admin',
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Konfiguration (ROI-Parameter)
CREATE TABLE IF NOT EXISTS roi.config (
  id                  UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  homepage_kosten     DECIMAL(10,2) NOT NULL DEFAULT 3500,
  ads_setup_kosten    DECIMAL(10,2) NOT NULL DEFAULT 1200,
  google_ads_budget   DECIMAL(10,2) NOT NULL DEFAULT 800,
  pflegekosten_monat  DECIMAL(10,2) NOT NULL DEFAULT 300,
  operative_marge_pct DECIMAL(5,4)  NOT NULL DEFAULT 0.35,
  avg_auftraege_monat DECIMAL(5,2)  NOT NULL DEFAULT 8,
  company_id          TEXT          NOT NULL DEFAULT 'admin',
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Upload-Protokoll (importierte Dateien)
CREATE TABLE IF NOT EXISTS roi.uploads (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  filename       TEXT        NOT NULL,
  rows_imported  INTEGER     NOT NULL DEFAULT 0,
  rows_skipped   INTEGER     NOT NULL DEFAULT 0,
  column_mapping JSONB,
  company_id     TEXT        NOT NULL DEFAULT 'admin',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Marketing-Einkäufe (Flywheel)
CREATE TABLE IF NOT EXISTS roi.purchases (
  id           UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id   TEXT          NOT NULL,
  channel_name TEXT          NOT NULL,
  amount       DECIMAL(10,2) NOT NULL,
  pricing      TEXT          NOT NULL CHECK (pricing IN ('recurring', 'onetime')),
  note         TEXT          NOT NULL DEFAULT '',
  purchased_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  company_id   TEXT          NOT NULL DEFAULT 'admin',
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- VOB-SCHEMA (Vergabe- und Vertragsordnung / Ausschreibungsmonitor)
-- ============================================================================

-- Unternehmen (Teilnehmer am VOB-Monitoring)
CREATE TABLE IF NOT EXISTS vob.companies (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT        NOT NULL,
  slug       TEXT        NOT NULL UNIQUE,
  trades     TEXT[]      NOT NULL DEFAULT '{}',
  keywords   TEXT[]      NOT NULL DEFAULT '{}',
  color      TEXT        NOT NULL DEFAULT '#6B7280',
  icon       TEXT,
  active     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Scan-Protokolle (wöchentliche VOB-Scans)
CREATE TABLE IF NOT EXISTS vob.vob_scans (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_date      DATE        NOT NULL,
  calendar_week  INTEGER     NOT NULL,
  year           INTEGER     NOT NULL,
  total_listings INTEGER,
  matched_count  INTEGER,
  new_listings   INTEGER     NOT NULL DEFAULT 0,
  report_url     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (calendar_week, year)
);

-- Ausschreibungen (VOB-Tendereinträge)
CREATE TABLE IF NOT EXISTS vob.vob_tenders (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT        NOT NULL,
  authority     TEXT,
  deadline      TEXT,
  deadline_date DATE,
  category      TEXT,
  url           TEXT        NOT NULL,
  status        TEXT        NOT NULL DEFAULT 'active'
                            CHECK (status IN ('active', 'expired', 'archived')),
  requested     BOOLEAN     NOT NULL DEFAULT FALSE,
  scan_id       UUID        REFERENCES vob.vob_scans(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Zuordnungen Ausschreibung ↔ Unternehmen
CREATE TABLE IF NOT EXISTS vob.vob_matches (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id    UUID        NOT NULL REFERENCES vob.vob_tenders(id) ON DELETE CASCADE,
  company_id   UUID        NOT NULL REFERENCES vob.companies(id) ON DELETE CASCADE,
  company_slug TEXT        NOT NULL,
  relevance    TEXT,
  reason       TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (tender_id, company_id)
);

-- ============================================================================
-- VOB-VIEWS
-- ============================================================================

-- Dashboard: Ausschreibungen mit Unternehmenszuordnung und Dringlichkeit
DROP VIEW IF EXISTS vob.company_trends CASCADE;
DROP VIEW IF EXISTS vob.company_weekly_stats CASCADE;
DROP VIEW IF EXISTS vob.vob_dashboard CASCADE;

CREATE OR REPLACE VIEW vob.vob_dashboard AS
SELECT
  t.id                                                      AS tender_id,
  t.title,
  t.authority,
  t.deadline,
  t.deadline_date,
  t.category,
  t.url,
  t.status,
  t.requested,
  t.created_at,
  s.calendar_week,
  s.year,
  s.scan_date,
  s.report_url,
  c.slug                                                    AS company_slug,
  c.name                                                    AS company_name,
  c.color                                                   AS company_color,
  m.relevance,
  m.reason,
  CASE
    WHEN t.deadline_date IS NULL                                  THEN 'unknown'
    WHEN t.deadline_date < CURRENT_DATE                           THEN 'expired'
    WHEN t.deadline_date <= CURRENT_DATE + INTERVAL '7 days'      THEN 'urgent'
    WHEN t.deadline_date <= CURRENT_DATE + INTERVAL '14 days'     THEN 'soon'
    ELSE 'normal'
  END                                                       AS urgency
FROM vob.vob_tenders t
LEFT JOIN vob.vob_scans   s ON s.id = t.scan_id
LEFT JOIN vob.vob_matches m ON m.tender_id = t.id
LEFT JOIN vob.companies   c ON c.id = m.company_id;

-- Wöchentliche Ausschreibungsanzahl pro Unternehmen
CREATE OR REPLACE VIEW vob.company_weekly_stats AS
SELECT
  c.name                               AS company_name,
  c.slug                               AS company_slug,
  c.color,
  s.calendar_week,
  s.year,
  s.scan_date,
  COUNT(DISTINCT m.tender_id)::INTEGER AS tender_count
FROM vob.companies    c
JOIN vob.vob_matches  m ON m.company_id = c.id
JOIN vob.vob_tenders  t ON t.id = m.tender_id
JOIN vob.vob_scans    s ON s.id = t.scan_id
GROUP BY c.name, c.slug, c.color, s.calendar_week, s.year, s.scan_date;

-- Wöchentliche Statistik + Vorwochenvergleich (LAG-Funktion)
CREATE OR REPLACE VIEW vob.company_trends AS
SELECT
  ws.company_name,
  ws.company_slug,
  ws.color,
  ws.calendar_week,
  ws.year,
  ws.scan_date,
  ws.tender_count,
  LAG(ws.tender_count) OVER (
    PARTITION BY ws.company_slug
    ORDER BY ws.year, ws.calendar_week
  )                                   AS prev_week_count,
  ws.tender_count - COALESCE(
    LAG(ws.tender_count) OVER (
      PARTITION BY ws.company_slug
      ORDER BY ws.year, ws.calendar_week
    ),
    ws.tender_count
  )                                   AS week_change
FROM vob.company_weekly_stats ws;

-- ============================================================================
-- ENDE TEIL 3 — Weiter mit Teil 4
-- ============================================================================
