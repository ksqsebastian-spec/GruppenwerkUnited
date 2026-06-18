-- MarkItDown-Vorlagen: gemeinsame Bibliothek von konvertiertem Markdown.
--
-- Dateien (PDF, DOCX, XLSX, HTML, CSV, JSON, XML, TXT) werden im Konverter
-- des Moduls in Markdown gewandelt und können hier mit Titel und freien
-- Text-Tags gespeichert werden. Geteilt für alle Firmen.
--
-- Original-Dateien werden NICHT persistiert — nur der Markdown-Inhalt und
-- ein paar Referenz-Felder zum Originaldokument.

CREATE TABLE IF NOT EXISTS markitdown_templates (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  titel               TEXT        NOT NULL,
  beschreibung        TEXT,
  -- freie Text-Tags, z.B. 'rechnung', 'angebot', 'website-text'
  tags                TEXT[]      NOT NULL DEFAULT '{}',

  -- der eigentliche Vorlagen-Inhalt
  markdown            TEXT        NOT NULL,

  -- Referenz auf Original (informativ, Datei selbst nicht gespeichert)
  source_dateiname    TEXT,
  source_dateityp     TEXT,

  saved_by            TEXT        NOT NULL,
  saved_by_company    TEXT        NOT NULL,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_markitdown_templates_created_at
  ON markitdown_templates (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_markitdown_templates_tags
  ON markitdown_templates USING GIN (tags);

ALTER TABLE markitdown_templates ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE markitdown_templates TO service_role;
