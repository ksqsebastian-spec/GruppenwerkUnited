-- Personen: Firma-Zuordnung
--
-- Beim Anlegen einer Person im Ticket-System kann jetzt angegeben werden, zu
-- welcher Firma sie gehört (Groundpassion, Brink, Seehafer, Mehlig, Werner Bau,
-- Werner Gerüst, Hantke, Gruppenwerk). Optional, daher nullable.

ALTER TABLE personen
  ADD COLUMN IF NOT EXISTS firma TEXT;

CREATE INDEX IF NOT EXISTS idx_personen_firma ON personen (firma);
