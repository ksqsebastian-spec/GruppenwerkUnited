-- Migration: Neue Fahrzeug-Felder für Leasing und Halter/Nutzer
-- Datum: 2026-02-03

-- ============================================================================
-- Leasing-Felder
-- ============================================================================

ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS leasing_company TEXT,
ADD COLUMN IF NOT EXISTS leasing_end_date DATE,
ADD COLUMN IF NOT EXISTS leasing_rate DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS leasing_contract_number TEXT;

-- ============================================================================
-- Halter & Nutzer Felder
-- ============================================================================

ALTER TABLE vehicles
ADD COLUMN IF NOT EXISTS holder TEXT,
ADD COLUMN IF NOT EXISTS user_name TEXT;

-- ============================================================================
-- Kommentare für Dokumentation
-- ============================================================================

COMMENT ON COLUMN vehicles.leasing_company IS 'Leasinggeber (z.B. ALD Automotive)';
COMMENT ON COLUMN vehicles.leasing_end_date IS 'Datum an dem der Leasingvertrag endet';
COMMENT ON COLUMN vehicles.leasing_rate IS 'Monatliche Leasingrate in Euro';
COMMENT ON COLUMN vehicles.leasing_contract_number IS 'Vertragsnummer des Leasingvertrags';
COMMENT ON COLUMN vehicles.holder IS 'Fahrzeughalter (eingetragener Besitzer)';
COMMENT ON COLUMN vehicles.user_name IS 'Hauptnutzer des Fahrzeugs';
