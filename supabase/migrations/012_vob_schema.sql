-- ============================================================================
-- VOB Monitor – Vollständiges Datenbankschema
-- Schema: vob (separates PostgreSQL-Schema für Vergabe- und Vertragsordnung)
-- ============================================================================

-- Separates Schema anlegen
CREATE SCHEMA IF NOT EXISTS vob;

-- ============================================================================
-- TABELLEN
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
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title        TEXT        NOT NULL,
  authority    TEXT,
  deadline     TEXT,
  deadline_date DATE,
  category     TEXT,
  url          TEXT        NOT NULL,
  status       TEXT        NOT NULL DEFAULT 'active'
                           CHECK (status IN ('active', 'expired', 'archived')),
  requested    BOOLEAN     NOT NULL DEFAULT FALSE,
  scan_id      UUID        REFERENCES vob.vob_scans(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
-- INDIZES für Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_vob_tenders_status     ON vob.vob_tenders(status);
CREATE INDEX IF NOT EXISTS idx_vob_tenders_deadline   ON vob.vob_tenders(deadline_date);
CREATE INDEX IF NOT EXISTS idx_vob_tenders_scan_id    ON vob.vob_tenders(scan_id);
CREATE INDEX IF NOT EXISTS idx_vob_tenders_created    ON vob.vob_tenders(created_at);
CREATE INDEX IF NOT EXISTS idx_vob_matches_tender     ON vob.vob_matches(tender_id);
CREATE INDEX IF NOT EXISTS idx_vob_matches_company    ON vob.vob_matches(company_id);
CREATE INDEX IF NOT EXISTS idx_vob_matches_slug       ON vob.vob_matches(company_slug);
CREATE INDEX IF NOT EXISTS idx_vob_scans_date         ON vob.vob_scans(scan_date DESC);

-- ============================================================================
-- AUTOMATISCHER TIMESTAMP-UPDATE
-- ============================================================================

CREATE OR REPLACE FUNCTION vob.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_vob_tenders_updated_at
  BEFORE UPDATE ON vob.vob_tenders
  FOR EACH ROW EXECUTE FUNCTION vob.update_updated_at();

-- ============================================================================
-- VIEW: vob_dashboard
-- Kombinierte Sicht: Ausschreibungen mit Unternehmenszuordnung und Scan-Info
-- ============================================================================

CREATE OR REPLACE VIEW vob.vob_dashboard AS
SELECT
  t.id                                          AS tender_id,
  t.title,
  t.authority,
  t.deadline,
  t.deadline_date,
  t.category,
  t.url,
  t.status,
  t.requested,
  t.created_at,
  -- Scan-Metadaten
  s.calendar_week,
  s.year,
  s.scan_date,
  s.report_url,
  -- Unternehmensdaten (können NULL sein wenn kein Match)
  c.slug                                        AS company_slug,
  c.name                                        AS company_name,
  c.color                                       AS company_color,
  -- Match-Daten
  m.relevance,
  m.reason,
  -- Dringlichkeit berechnet aus deadline_date
  CASE
    WHEN t.deadline_date IS NULL                          THEN 'unknown'
    WHEN t.deadline_date < CURRENT_DATE                   THEN 'expired'
    WHEN t.deadline_date <= CURRENT_DATE + INTERVAL '7 days'  THEN 'urgent'
    WHEN t.deadline_date <= CURRENT_DATE + INTERVAL '14 days' THEN 'soon'
    ELSE 'normal'
  END                                           AS urgency
FROM vob.vob_tenders t
LEFT JOIN vob.vob_scans     s ON s.id = t.scan_id
LEFT JOIN vob.vob_matches   m ON m.tender_id = t.id
LEFT JOIN vob.companies     c ON c.id = m.company_id;

-- ============================================================================
-- VIEW: company_weekly_stats
-- Wöchentliche Ausschreibungsanzahl pro Unternehmen
-- ============================================================================

CREATE OR REPLACE VIEW vob.company_weekly_stats AS
SELECT
  c.name                                        AS company_name,
  c.slug                                        AS company_slug,
  c.color,
  s.calendar_week,
  s.year,
  s.scan_date,
  COUNT(DISTINCT m.tender_id)::INTEGER          AS tender_count
FROM vob.companies  c
JOIN vob.vob_matches m ON m.company_id = c.id
JOIN vob.vob_tenders t ON t.id = m.tender_id
JOIN vob.vob_scans   s ON s.id = t.scan_id
GROUP BY c.name, c.slug, c.color, s.calendar_week, s.year, s.scan_date;

-- ============================================================================
-- VIEW: company_trends
-- Wöchentliche Statistik + Vorwochenvergleich
-- ============================================================================

CREATE OR REPLACE VIEW vob.company_trends AS
SELECT
  ws.company_name,
  ws.company_slug,
  ws.color,
  ws.calendar_week,
  ws.year,
  ws.scan_date,
  ws.tender_count,
  -- Vorwochenwert per LAG-Funktion
  LAG(ws.tender_count) OVER (
    PARTITION BY ws.company_slug
    ORDER BY ws.year, ws.calendar_week
  )                                             AS prev_week_count,
  -- Differenz zur Vorwoche
  ws.tender_count - COALESCE(
    LAG(ws.tender_count) OVER (
      PARTITION BY ws.company_slug
      ORDER BY ws.year, ws.calendar_week
    ),
    ws.tender_count
  )                                             AS week_change
FROM vob.company_weekly_stats ws;

-- ============================================================================
-- ROW LEVEL SECURITY
-- Anon-Schlüssel soll lesen dürfen (Supabase Data API)
-- ============================================================================

ALTER TABLE vob.companies    ENABLE ROW LEVEL SECURITY;
ALTER TABLE vob.vob_scans    ENABLE ROW LEVEL SECURITY;
ALTER TABLE vob.vob_tenders  ENABLE ROW LEVEL SECURITY;
ALTER TABLE vob.vob_matches  ENABLE ROW LEVEL SECURITY;

-- Lese-Richtlinien für anon und authenticated
CREATE POLICY "vob_companies_lesen"
  ON vob.companies FOR SELECT
  USING (true);

CREATE POLICY "vob_scans_lesen"
  ON vob.vob_scans FOR SELECT
  USING (true);

CREATE POLICY "vob_tenders_lesen"
  ON vob.vob_tenders FOR SELECT
  USING (true);

CREATE POLICY "vob_tenders_schreiben"
  ON vob.vob_tenders FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "vob_matches_lesen"
  ON vob.vob_matches FOR SELECT
  USING (true);

CREATE POLICY "vob_matches_schreiben"
  ON vob.vob_matches FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- SUPABASE DATA API: vob-Schema in search_path eintragen
-- (damit .schema('vob') im Supabase-Client funktioniert)
-- ============================================================================

-- Standardmäßig kennt die PostgREST-API nur das public-Schema.
-- Die folgende Zeile muss in der Supabase-Projektkonfiguration gesetzt werden:
-- Settings → API → Extra Search Path: vob
-- ODER via SQL (wenn Superuser-Rechte vorhanden):
-- ALTER ROLE authenticator SET search_path TO public, vob;

-- Hinweis: In Supabase Cloud muss das vob-Schema über das Dashboard unter
-- Settings → API → "Extra Schema Exposed" aktiviert werden.
-- Alternativ:
GRANT USAGE ON SCHEMA vob TO anon, authenticated, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA vob TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA vob TO service_role;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA vob TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA vob TO service_role;

-- ============================================================================
-- BEISPIELDATEN (optional – für lokale Entwicklung)
-- ============================================================================

-- Unternehmen eintragen
INSERT INTO vob.companies (name, slug, trades, keywords, color, active)
VALUES
  (
    'Gruppenwerk Dach',
    'dach',
    ARRAY['Dachdeckerarbeiten', 'Dachabdichtung', 'Klempnerarbeiten'],
    ARRAY['Dach', 'Dachdeckung', 'Abdichtung', 'Klempner', 'Ziegel', 'Bitumen'],
    '#1E40AF',
    TRUE
  ),
  (
    'Gruppenwerk Maler',
    'maler',
    ARRAY['Malerarbeiten', 'Tapezierarbeiten', 'Bodenbelagsarbeiten'],
    ARRAY['Maler', 'Anstrich', 'Putz', 'Tapete', 'Bodenbelag', 'Estrich'],
    '#15803D',
    TRUE
  ),
  (
    'Gruppenwerk Fliesen',
    'fliesen',
    ARRAY['Fliesenarbeiten', 'Natursteinarbeiten', 'Parkettarbeiten'],
    ARRAY['Fliesen', 'Keramik', 'Naturstein', 'Parkett', 'Boden', 'Wand'],
    '#7C3AED',
    TRUE
  )
ON CONFLICT (slug) DO NOTHING;
