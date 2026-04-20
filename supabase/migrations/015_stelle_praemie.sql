-- Fügt praemie_betrag-Spalte zur stellen-Tabelle hinzu
ALTER TABLE stellen ADD COLUMN IF NOT EXISTS praemie_betrag DECIMAL(10,2);
