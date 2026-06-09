-- Datei-Vorlagen: eigene Bibliothek für wiederverwendbare Briefpapier-PDFs etc.
--
-- Trennt das Konzept „Prompt-Text" (was die KI tun soll) von „Datei" (welches
-- Briefpapier/Layout sie verwendet). Eine Datei kann an mehreren Prompts hängen.
--
-- Existierende, an Prompts direkt hochgeladene Dateien werden in die Bibliothek
-- übernommen, und der Prompt wird über datei_vorlage_id verknüpft.

CREATE TABLE IF NOT EXISTS datei_vorlagen (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company      TEXT        NOT NULL,

  name         TEXT        NOT NULL,
  kategorie    TEXT,
  beschreibung TEXT,

  dateipfad    TEXT        NOT NULL,
  dateiname    TEXT        NOT NULL,
  dateityp     TEXT,
  dateigroesse INTEGER,

  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT datei_vorlagen_company_name_key UNIQUE (company, name)
);

CREATE INDEX IF NOT EXISTS idx_datei_vorlagen_company   ON datei_vorlagen (company);
CREATE INDEX IF NOT EXISTS idx_datei_vorlagen_kategorie ON datei_vorlagen (kategorie);

DROP TRIGGER IF EXISTS update_datei_vorlagen_updated_at ON datei_vorlagen;
CREATE TRIGGER update_datei_vorlagen_updated_at
  BEFORE UPDATE ON datei_vorlagen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE datei_vorlagen ENABLE ROW LEVEL SECURITY;
GRANT ALL ON TABLE datei_vorlagen TO service_role;

-- Verknüpfung am Prompt
ALTER TABLE customer_prompts
  ADD COLUMN IF NOT EXISTS datei_vorlage_id UUID REFERENCES datei_vorlagen(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_customer_prompts_datei_vorlage
  ON customer_prompts (datei_vorlage_id);

-- Migration bestehender per-Prompt-Dateien in die Bibliothek + Verknüpfung.
-- Namenskollisionen werden durch ON CONFLICT vermieden; danach Verlinkung
-- über den (eindeutigen) Storage-Pfad.
INSERT INTO datei_vorlagen (company, name, dateipfad, dateiname, dateityp, dateigroesse)
SELECT cp.company,
       'Vorlage zu „' || cp.name || '"',
       cp.vorlage_dateipfad,
       cp.vorlage_dateiname,
       cp.vorlage_dateityp,
       cp.vorlage_dateigroesse
FROM customer_prompts cp
WHERE cp.vorlage_dateipfad IS NOT NULL
ON CONFLICT (company, name) DO NOTHING;

UPDATE customer_prompts cp
SET datei_vorlage_id = dv.id
FROM datei_vorlagen dv
WHERE cp.vorlage_dateipfad IS NOT NULL
  AND cp.datei_vorlage_id IS NULL
  AND cp.company = dv.company
  AND cp.vorlage_dateipfad = dv.dateipfad;
