-- Prompt-Vorlagen: optionaler Datei-Anhang („Vorlage")
--
-- Erweitert customer_prompts um eine optionale Datei je Vorlage. Idee:
-- der Benutzer lädt z.B. eine Rechnungs-DOCX/PDF hoch, die zusammen mit
-- dem generierten Text-Prompt verwendet wird (Drag&Drop in Claude/ChatGPT).
--
-- Eigener Storage-Bucket, weil diese Dateien pro Mandant (nicht pro Kunde)
-- liegen und nicht mit Kunden-Akten vermischt werden sollen.

ALTER TABLE customer_prompts
  ADD COLUMN IF NOT EXISTS vorlage_dateipfad    TEXT,
  ADD COLUMN IF NOT EXISTS vorlage_dateiname    TEXT,
  ADD COLUMN IF NOT EXISTS vorlage_dateityp     TEXT,
  ADD COLUMN IF NOT EXISTS vorlage_dateigroesse INTEGER;

INSERT INTO storage.buckets (id, name, public)
VALUES ('prompt-vorlagen', 'prompt-vorlagen', false)
ON CONFLICT (id) DO NOTHING;
