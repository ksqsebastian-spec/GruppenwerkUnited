-- Datenkodierung: Pseudonymisierung von Kundendaten für sichere KI-Nutzung

-- Trigger-Funktion erstellen falls noch nicht vorhanden
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS datenkodierungen (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  adresse TEXT,
  notizen TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_datenkodierungen_updated_at ON datenkodierungen;
CREATE TRIGGER update_datenkodierungen_updated_at
  BEFORE UPDATE ON datenkodierungen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE datenkodierungen ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "datenkodierungen_all" ON datenkodierungen;
CREATE POLICY "datenkodierungen_all" ON datenkodierungen
  FOR ALL TO anon USING (true) WITH CHECK (true);

-- Berechtigungen für die Tabelle (PostgREST/Supabase API)
GRANT ALL ON TABLE datenkodierungen TO anon, authenticated, service_role;
