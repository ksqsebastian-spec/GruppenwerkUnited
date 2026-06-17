-- Bilder-Bibliothek: gemeinsame Sammlung für Webseiten, Social Media & Co.
--
-- Sichtbar für alle Firmen (kein company-Scoping beim Lesen). Jedes Bild
-- erhält Firmen-Tags (z.B. ['seehafer','hantke']) zum Filtern, eine Angabe
-- "hochgeladen von" (freier Name) und die hochladende Firma (aus der
-- Session, nicht editierbar — Audit).
--
-- Eigener Storage-Bucket "bilder" als PUBLIC, damit die URLs direkt in
-- Webseiten / Social-Media-Posts einsetzbar sind, ohne Ablauf.

CREATE TABLE IF NOT EXISTS bilder (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  titel               TEXT,
  beschreibung        TEXT,

  -- Firmen, denen das Bild zugeordnet ist (Slug-IDs aus lib/tickets/firmen.ts)
  firmen_tags         TEXT[]      NOT NULL DEFAULT '{}',

  -- Freitext: wer hat hochgeladen?
  uploaded_by         TEXT        NOT NULL,
  -- Firma der hochladenden Sitzung (Audit, nicht zur Anzeige nötig)
  uploaded_by_company TEXT        NOT NULL,

  dateipfad           TEXT        NOT NULL,
  dateiname           TEXT        NOT NULL,
  dateityp            TEXT,
  dateigroesse        INTEGER,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bilder_created_at  ON bilder (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bilder_firmen_tags ON bilder USING GIN (firmen_tags);

ALTER TABLE bilder ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE bilder TO service_role;

-- Public bucket, damit der CDN-Link direkt in Webseiten/Social funktioniert
INSERT INTO storage.buckets (id, name, public)
VALUES ('bilder', 'bilder', true)
ON CONFLICT (id) DO UPDATE SET public = true;
