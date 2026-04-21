-- Automatisierungen: KI-Workflow-Knoten für den visuellen Prompt-Canvas
-- Jeder Knoten repräsentiert einen Schritt im Automatisierungs-Baum einer Firma.
-- Struktur: Wurzel → Kategorien → (Sub-Kategorien) → Blatt-Knoten (mit Prompt)
-- position_x / position_y speichern die freie Canvas-Position nach Drag.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS automation_nodes (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Firmen-Zuordnung als TEXT (gleiche Konvention wie datenkodierungen.company)
  company     TEXT    NOT NULL DEFAULT '',
  -- Selbst-referenzierende Hierarchie: NULL = Wurzelknoten
  parent_id   UUID    REFERENCES automation_nodes(id) ON DELETE CASCADE,
  title       TEXT    NOT NULL,
  description TEXT,
  -- App-Typ steuert Farbe und Icon (gdrive|outlook|email|sheets|word|claude|pdf|generic)
  app_type    TEXT    NOT NULL DEFAULT 'generic',
  -- NULL = Kategorie-Knoten, befüllt = Blatt-Knoten mit kopierbarem Prompt
  prompt_template    TEXT,
  -- Optionaler GDrive-Pfad als Kontext-Hinweis im Prompt
  gdrive_path        TEXT,
  -- Freie Canvas-Position (wird nach Drag gespeichert)
  position_x  FLOAT   NOT NULL DEFAULT 0,
  position_y  FLOAT   NOT NULL DEFAULT 0,
  -- Reihenfolge für initiales Auto-Layout (Geschwister-Sortierung)
  position    INTEGER NOT NULL DEFAULT 0,
  -- Datenkodierungs-Anbindung: Badge wenn Prompt pseudonymisierte Daten referenziert
  use_datenkodierung BOOLEAN NOT NULL DEFAULT false,
  is_active          BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indices für häufige Queries
CREATE INDEX IF NOT EXISTS idx_automation_nodes_company
  ON automation_nodes (company);

CREATE INDEX IF NOT EXISTS idx_automation_nodes_parent
  ON automation_nodes (parent_id);

CREATE INDEX IF NOT EXISTS idx_automation_nodes_company_active
  ON automation_nodes (company, is_active);

-- Automatische updated_at Aktualisierung
DROP TRIGGER IF EXISTS update_automation_nodes_updated_at ON automation_nodes;
CREATE TRIGGER update_automation_nodes_updated_at
  BEFORE UPDATE ON automation_nodes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS: gleiche Konvention wie alle anderen Tabellen der App (anon-Zugriff via App-Auth)
ALTER TABLE automation_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "automation_nodes_all" ON automation_nodes;
CREATE POLICY "automation_nodes_all" ON automation_nodes
  FOR ALL TO anon USING (true) WITH CHECK (true);

GRANT ALL ON TABLE automation_nodes TO anon, authenticated, service_role;
