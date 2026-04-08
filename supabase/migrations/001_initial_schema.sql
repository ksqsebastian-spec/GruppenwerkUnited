-- ============================================================================
-- Fuhrpark Management - Datenbank-Schema
-- Version: 1.0
-- ============================================================================

-- Erweiterungen aktivieren
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUM-Typen
-- ============================================================================

-- Kraftstoffarten
CREATE TYPE fuel_type AS ENUM (
  'diesel',
  'benzin',
  'elektro',
  'hybrid_benzin',
  'hybrid_diesel',
  'gas'
);

-- Fahrzeugstatus
CREATE TYPE vehicle_status AS ENUM ('active', 'archived');

-- Schadensstatus
CREATE TYPE damage_status AS ENUM ('reported', 'approved', 'in_repair', 'completed');

-- Terminstatus
CREATE TYPE appointment_status AS ENUM ('pending', 'completed', 'overdue');

-- Kilometerstand-Quelle
CREATE TYPE mileage_source AS ENUM ('manual', 'cost_entry', 'damage_report');

-- ============================================================================
-- TABELLEN
-- ============================================================================

-- Firmen
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fahrzeuge
CREATE TABLE vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_plate TEXT NOT NULL UNIQUE,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 1990),
  vin TEXT UNIQUE,
  fuel_type fuel_type NOT NULL DEFAULT 'diesel',
  purchase_date DATE,
  purchase_price DECIMAL(10, 2),
  mileage INTEGER NOT NULL DEFAULT 0 CHECK (mileage >= 0),
  is_leased BOOLEAN NOT NULL DEFAULT FALSE,
  insurance_number TEXT,
  insurance_company TEXT,
  tuv_due_date DATE,
  status vehicle_status NOT NULL DEFAULT 'active',
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fahrer
CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  license_class TEXT,
  license_expiry DATE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  status vehicle_status NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fahrzeug-Fahrer-Zuordnung (Many-to-Many)
CREATE TABLE vehicle_drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(vehicle_id, driver_id)
);

-- Terminarten
CREATE TABLE appointment_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  default_interval_months INTEGER,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Termine
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  appointment_type_id UUID NOT NULL REFERENCES appointment_types(id) ON DELETE RESTRICT,
  due_date DATE NOT NULL,
  completed_date DATE,
  status appointment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schadensarten
CREATE TABLE damage_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schäden
CREATE TABLE damages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  damage_type_id UUID NOT NULL REFERENCES damage_types(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  location TEXT,
  cost_estimate DECIMAL(10, 2),
  actual_cost DECIMAL(10, 2),
  insurance_claim BOOLEAN NOT NULL DEFAULT FALSE,
  insurance_claim_number TEXT,
  status damage_status NOT NULL DEFAULT 'reported',
  reported_by TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schadensbilder
CREATE TABLE damage_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  damage_id UUID NOT NULL REFERENCES damages(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kostenarten
CREATE TABLE cost_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kosten
CREATE TABLE costs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  cost_type_id UUID NOT NULL REFERENCES cost_types(id) ON DELETE RESTRICT,
  date DATE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  mileage_at_cost INTEGER CHECK (mileage_at_cost >= 0),
  receipt_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dokumenttypen
CREATE TABLE document_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dokumente
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  document_type_id UUID NOT NULL REFERENCES document_types(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  mime_type TEXT NOT NULL,
  notes TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kilometerstand-Historie
CREATE TABLE mileage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  mileage INTEGER NOT NULL CHECK (mileage >= 0),
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source mileage_source NOT NULL DEFAULT 'manual',
  notes TEXT
);

-- ============================================================================
-- INDIZES
-- ============================================================================

CREATE INDEX idx_vehicles_company ON vehicles(company_id);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);

CREATE INDEX idx_drivers_company ON drivers(company_id);
CREATE INDEX idx_drivers_status ON drivers(status);

CREATE INDEX idx_appointments_vehicle ON appointments(vehicle_id);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_due_date ON appointments(due_date);

CREATE INDEX idx_damages_vehicle ON damages(vehicle_id);
CREATE INDEX idx_damages_status ON damages(status);
CREATE INDEX idx_damages_date ON damages(date);

CREATE INDEX idx_costs_vehicle ON costs(vehicle_id);
CREATE INDEX idx_costs_date ON costs(date);

CREATE INDEX idx_documents_vehicle ON documents(vehicle_id);

CREATE INDEX idx_mileage_logs_vehicle ON mileage_logs(vehicle_id);
CREATE INDEX idx_mileage_logs_recorded ON mileage_logs(recorded_at);

-- ============================================================================
-- TRIGGER FÜR updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_damages_updated_at
  BEFORE UPDATE ON damages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TRIGGER FÜR KILOMETERSTAND-AKTUALISIERUNG
-- ============================================================================

-- Aktualisiert den Kilometerstand bei neuen Kosteneinträgen
CREATE OR REPLACE FUNCTION update_vehicle_mileage_from_cost()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.mileage_at_cost IS NOT NULL AND NEW.mileage_at_cost > 0 THEN
    UPDATE vehicles
    SET mileage = NEW.mileage_at_cost
    WHERE id = NEW.vehicle_id AND mileage < NEW.mileage_at_cost;

    -- Log-Eintrag erstellen
    INSERT INTO mileage_logs (vehicle_id, mileage, source, notes)
    VALUES (NEW.vehicle_id, NEW.mileage_at_cost, 'cost_entry', 'Aktualisiert durch Kosteneintrag');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_mileage_on_cost_insert
  AFTER INSERT ON costs
  FOR EACH ROW EXECUTE FUNCTION update_vehicle_mileage_from_cost();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- RLS aktivieren
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE damages ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE mileage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;

-- Policies für authentifizierte Benutzer (alle haben vollen Zugriff innerhalb der App)
-- In einer Produktionsumgebung würde man hier feinere Berechtigungen definieren

CREATE POLICY "Authentifizierte Benutzer können alles lesen"
  ON companies FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authentifizierte Benutzer können anlegen"
  ON companies FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authentifizierte Benutzer können aktualisieren"
  ON companies FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authentifizierte Benutzer können löschen"
  ON companies FOR DELETE TO authenticated USING (true);

CREATE POLICY "vehicles_select" ON vehicles FOR SELECT TO authenticated USING (true);
CREATE POLICY "vehicles_insert" ON vehicles FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "vehicles_update" ON vehicles FOR UPDATE TO authenticated USING (true);
CREATE POLICY "vehicles_delete" ON vehicles FOR DELETE TO authenticated USING (true);

CREATE POLICY "drivers_select" ON drivers FOR SELECT TO authenticated USING (true);
CREATE POLICY "drivers_insert" ON drivers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "drivers_update" ON drivers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "drivers_delete" ON drivers FOR DELETE TO authenticated USING (true);

CREATE POLICY "vehicle_drivers_select" ON vehicle_drivers FOR SELECT TO authenticated USING (true);
CREATE POLICY "vehicle_drivers_insert" ON vehicle_drivers FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "vehicle_drivers_update" ON vehicle_drivers FOR UPDATE TO authenticated USING (true);
CREATE POLICY "vehicle_drivers_delete" ON vehicle_drivers FOR DELETE TO authenticated USING (true);

CREATE POLICY "appointments_select" ON appointments FOR SELECT TO authenticated USING (true);
CREATE POLICY "appointments_insert" ON appointments FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "appointments_update" ON appointments FOR UPDATE TO authenticated USING (true);
CREATE POLICY "appointments_delete" ON appointments FOR DELETE TO authenticated USING (true);

CREATE POLICY "damages_select" ON damages FOR SELECT TO authenticated USING (true);
CREATE POLICY "damages_insert" ON damages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "damages_update" ON damages FOR UPDATE TO authenticated USING (true);
CREATE POLICY "damages_delete" ON damages FOR DELETE TO authenticated USING (true);

CREATE POLICY "damage_images_select" ON damage_images FOR SELECT TO authenticated USING (true);
CREATE POLICY "damage_images_insert" ON damage_images FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "damage_images_delete" ON damage_images FOR DELETE TO authenticated USING (true);

CREATE POLICY "costs_select" ON costs FOR SELECT TO authenticated USING (true);
CREATE POLICY "costs_insert" ON costs FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "costs_update" ON costs FOR UPDATE TO authenticated USING (true);
CREATE POLICY "costs_delete" ON costs FOR DELETE TO authenticated USING (true);

CREATE POLICY "documents_select" ON documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "documents_insert" ON documents FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "documents_update" ON documents FOR UPDATE TO authenticated USING (true);
CREATE POLICY "documents_delete" ON documents FOR DELETE TO authenticated USING (true);

CREATE POLICY "mileage_logs_select" ON mileage_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "mileage_logs_insert" ON mileage_logs FOR INSERT TO authenticated WITH CHECK (true);

-- Typen-Tabellen (nur lesend für normale Benutzer)
CREATE POLICY "appointment_types_select" ON appointment_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "appointment_types_all" ON appointment_types FOR ALL TO authenticated USING (true);

CREATE POLICY "damage_types_select" ON damage_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "damage_types_all" ON damage_types FOR ALL TO authenticated USING (true);

CREATE POLICY "cost_types_select" ON cost_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "cost_types_all" ON cost_types FOR ALL TO authenticated USING (true);

CREATE POLICY "document_types_select" ON document_types FOR SELECT TO authenticated USING (true);
CREATE POLICY "document_types_all" ON document_types FOR ALL TO authenticated USING (true);

-- ============================================================================
-- SEED-DATEN
-- ============================================================================

-- Standard-Terminarten
INSERT INTO appointment_types (id, name, default_interval_months, color) VALUES
  ('11111111-1111-1111-1111-111111111001', 'TÜV', 24, '#ef4444'),
  ('11111111-1111-1111-1111-111111111002', 'Service/Wartung', 12, '#3b82f6'),
  ('11111111-1111-1111-1111-111111111003', 'Ölwechsel', 12, '#f59e0b'),
  ('11111111-1111-1111-1111-111111111004', 'Reifenwechsel', 6, '#10b981'),
  ('11111111-1111-1111-1111-111111111005', 'Inspektion', 12, '#8b5cf6'),
  ('11111111-1111-1111-1111-111111111006', 'Bremsenprüfung', 12, '#ec4899'),
  ('11111111-1111-1111-1111-111111111007', 'UVV-Prüfung', 12, '#06b6d4'),
  ('11111111-1111-1111-1111-111111111008', 'Leasing-Rückgabe', NULL, '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- Standard-Schadensarten
INSERT INTO damage_types (id, name) VALUES
  ('22222222-2222-2222-2222-222222222001', 'Kollision/Unfall'),
  ('22222222-2222-2222-2222-222222222002', 'Parkschaden'),
  ('22222222-2222-2222-2222-222222222003', 'Vandalismus'),
  ('22222222-2222-2222-2222-222222222004', 'Wetterschaden'),
  ('22222222-2222-2222-2222-222222222005', 'Glasschaden'),
  ('22222222-2222-2222-2222-222222222006', 'Mechanischer Schaden'),
  ('22222222-2222-2222-2222-222222222007', 'Reifenschaden'),
  ('22222222-2222-2222-2222-222222222008', 'Innenraumschaden')
ON CONFLICT (name) DO NOTHING;

-- Standard-Kostenarten
INSERT INTO cost_types (id, name, icon) VALUES
  ('33333333-3333-3333-3333-333333333001', 'Tanken', '⛽'),
  ('33333333-3333-3333-3333-333333333002', 'Service/Wartung', '🔧'),
  ('33333333-3333-3333-3333-333333333003', 'Reparatur', '🛠️'),
  ('33333333-3333-3333-3333-333333333004', 'Versicherung', '🛡️'),
  ('33333333-3333-3333-3333-333333333005', 'KFZ-Steuer', '📋'),
  ('33333333-3333-3333-3333-333333333006', 'Leasing', '📄'),
  ('33333333-3333-3333-3333-333333333007', 'Parken', '🅿️'),
  ('33333333-3333-3333-3333-333333333008', 'Maut', '🛣️'),
  ('33333333-3333-3333-3333-333333333009', 'Fahrzeugwäsche', '🚿')
ON CONFLICT (name) DO NOTHING;

-- Standard-Dokumenttypen
INSERT INTO document_types (id, name, description) VALUES
  ('44444444-4444-4444-4444-444444444001', 'Fahrzeugschein', 'Zulassungsbescheinigung Teil I'),
  ('44444444-4444-4444-4444-444444444002', 'Fahrzeugbrief', 'Zulassungsbescheinigung Teil II'),
  ('44444444-4444-4444-4444-444444444003', 'Versicherungspolice', 'KFZ-Versicherungsdokumente'),
  ('44444444-4444-4444-4444-444444444004', 'TÜV-Bericht', 'Hauptuntersuchung'),
  ('44444444-4444-4444-4444-444444444005', 'Serviceheft', 'Wartungsnachweise'),
  ('44444444-4444-4444-4444-444444444006', 'Rechnung', 'Rechnungen und Belege'),
  ('44444444-4444-4444-4444-444444444007', 'Vertrag', 'Kauf- oder Leasingvertrag'),
  ('44444444-4444-4444-4444-444444444008', 'Übergabeprotokoll', 'Fahrzeugübergabe')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- STORAGE BUCKET FÜR DOKUMENTE
-- ============================================================================

-- Hinweis: Diese Befehle müssen im Supabase Dashboard oder via API ausgeführt werden,
-- da sie nicht Teil der PostgreSQL-Syntax sind.

-- Bucket erstellen (über Dashboard oder API):
-- supabase.storage.createBucket('documents', { public: false })
-- supabase.storage.createBucket('damage-images', { public: false })

-- ============================================================================
-- ENDE DES SCHEMAS
-- ============================================================================
