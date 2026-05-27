-- Ticket-System / Todos
-- Firmenübergreifende Aufgaben-Tickets mit Personen-Zuweisung und Dateianhängen.
-- Alle Firmen sehen alle Tickets; Personen werden je Firma gepflegt.

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ── Personen (Team-Mitglieder je Firma) ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS personen (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company    TEXT        NOT NULL DEFAULT '',
  name       TEXT        NOT NULL,
  email      TEXT,
  rolle      TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_personen_company ON personen (company);

ALTER TABLE personen ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "personen_all" ON personen;
CREATE POLICY "personen_all" ON personen FOR ALL TO anon USING (true) WITH CHECK (true);
GRANT ALL ON TABLE personen TO anon, authenticated, service_role;

-- ── Tickets ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tickets (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  title              TEXT        NOT NULL,
  description        TEXT,

  -- Zuweisung (firmenübergreifend möglich)
  assignee_person_id UUID        REFERENCES personen(id) ON DELETE SET NULL,

  -- Datenablage-Zuordnung (welche Firma die Aufgabe / Dateien betrifft)
  firma              TEXT,

  urgency            TEXT        NOT NULL DEFAULT 'mittel',
  status             TEXT        NOT NULL DEFAULT 'offen',
  due_date           DATE,

  created_by_company TEXT        NOT NULL DEFAULT '',

  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tickets_assignee   ON tickets (assignee_person_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status     ON tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_firma      ON tickets (firma);
CREATE INDEX IF NOT EXISTS idx_tickets_due_date   ON tickets (due_date);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets (created_at DESC);

DROP TRIGGER IF EXISTS update_tickets_updated_at ON tickets;
CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tickets_all" ON tickets;
CREATE POLICY "tickets_all" ON tickets FOR ALL TO anon USING (true) WITH CHECK (true);
GRANT ALL ON TABLE tickets TO anon, authenticated, service_role;

-- ── Dateianhänge ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ticket_dateien (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id    UUID        NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  company      TEXT        NOT NULL DEFAULT '',
  dateiname    TEXT        NOT NULL,
  dateipfad    TEXT        NOT NULL,
  dateityp     TEXT,
  dateigroesse INTEGER,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_dateien_ticket ON ticket_dateien (ticket_id);

ALTER TABLE ticket_dateien ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ticket_dateien_all" ON ticket_dateien;
CREATE POLICY "ticket_dateien_all" ON ticket_dateien FOR ALL TO anon USING (true) WITH CHECK (true);
GRANT ALL ON TABLE ticket_dateien TO anon, authenticated, service_role;

-- ── Storage-Bucket für Ticket-Dateien ─────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'ticket-dateien',
  'ticket-dateien',
  false,
  10485760,
  ARRAY[
    'application/pdf', 'image/jpeg', 'image/png', 'image/webp',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "ticket_dateien_storage_anon_select" ON storage.objects;
DROP POLICY IF EXISTS "ticket_dateien_storage_anon_insert" ON storage.objects;
DROP POLICY IF EXISTS "ticket_dateien_storage_anon_update" ON storage.objects;
DROP POLICY IF EXISTS "ticket_dateien_storage_anon_delete" ON storage.objects;

CREATE POLICY "ticket_dateien_storage_anon_select"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'ticket-dateien');

CREATE POLICY "ticket_dateien_storage_anon_insert"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'ticket-dateien');

CREATE POLICY "ticket_dateien_storage_anon_update"
  ON storage.objects FOR UPDATE TO anon
  USING (bucket_id = 'ticket-dateien');

CREATE POLICY "ticket_dateien_storage_anon_delete"
  ON storage.objects FOR DELETE TO anon
  USING (bucket_id = 'ticket-dateien');
