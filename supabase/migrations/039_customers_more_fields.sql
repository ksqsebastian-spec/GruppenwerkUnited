-- Kunden: zusätzliche Stammdaten für vollständigere Dokumente
--
-- Erweitert customers um strukturierte Adress- und Geschäftsfelder, damit
-- Rechnungen/Angebote/… mehr echte Daten enthalten können. Alle Felder sind
-- optional. Das alte Freitextfeld `adresse` bleibt erhalten.

ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS strasse       TEXT,
  ADD COLUMN IF NOT EXISTS plz           TEXT,
  ADD COLUMN IF NOT EXISTS ort           TEXT,
  ADD COLUMN IF NOT EXISTS land          TEXT,
  ADD COLUMN IF NOT EXISTS ust_id        TEXT,
  ADD COLUMN IF NOT EXISTS steuernummer  TEXT,
  ADD COLUMN IF NOT EXISTS kundennummer  TEXT,
  ADD COLUMN IF NOT EXISTS webseite      TEXT,
  ADD COLUMN IF NOT EXISTS zahlungsziel  TEXT;
