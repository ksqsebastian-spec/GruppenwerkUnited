-- ============================================================================
-- GruppenwerkUnited — Vollständiges Datenbankschema (Einzel-Datei)
-- Deckt: Fuhrpark, Führerscheinkontrolle, UVV, Affiliate, Recruiting
-- Ausführen: Supabase SQL Editor → ganzen Inhalt einfügen → Run
-- ============================================================================

-- Erweiterungen
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUM-Typen
-- ============================================================================

CREATE TYPE fuel_type AS ENUM (
  'diesel', 'benzin', 'elektro', 'hybrid_benzin', 'hybrid_diesel', 'gas'
);

CREATE TYPE vehicle_status AS ENUM ('active', 'archived');
CREATE TYPE damage_status AS ENUM ('reported', 'approved', 'in_repair', 'completed');
CREATE TYPE appointment_status AS ENUM ('pending', 'completed', 'overdue');
CREATE TYPE mileage_source AS ENUM ('manual', 'cost_entry', 'damage_report');
CREATE TYPE license_employee_status AS ENUM ('active', 'archived');
CREATE TYPE license_inspector_status AS ENUM ('active', 'archived');

-- ============================================================================
-- TABELLEN — Reihenfolge: erst referenzierte, dann referenzierende
-- ============================================================================

-- Firmen (keine Abhängigkeiten)
CREATE TABLE companies (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Terminarten
CREATE TABLE appointment_types (
  id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                    TEXT        NOT NULL UNIQUE,
  default_interval_months INTEGER,
  color                   TEXT        NOT NULL DEFAULT '#3b82f6',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schadensarten
CREATE TABLE damage_types (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kostenarten
CREATE TABLE cost_types (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL UNIQUE,
  icon       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dokumenttypen
CREATE TABLE document_types (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fahrzeuge (refs companies)
CREATE TABLE vehicles (
  id                       UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_plate            TEXT           NOT NULL UNIQUE,
  brand                    TEXT           NOT NULL,
  model                    TEXT           NOT NULL,
  year                     INTEGER        NOT NULL CHECK (year >= 1990),
  vin                      TEXT           UNIQUE,
  fuel_type                fuel_type      NOT NULL DEFAULT 'diesel',
  purchase_date            DATE,
  purchase_price           DECIMAL(10,2),
  mileage                  INTEGER        NOT NULL DEFAULT 0 CHECK (mileage >= 0),
  is_leased                BOOLEAN        NOT NULL DEFAULT FALSE,
  leasing_company          TEXT,
  leasing_end_date         DATE,
  leasing_rate             DECIMAL(10,2),
  leasing_contract_number  TEXT,
  holder                   TEXT,
  user_name                TEXT,
  insurance_number         TEXT,
  insurance_company        TEXT,
  tuv_due_date             DATE,
  status                   vehicle_status NOT NULL DEFAULT 'active',
  company_id               UUID           NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  notes                    TEXT,
  created_at               TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN vehicles.leasing_company         IS 'Leasinggeber (z.B. ALD Automotive)';
COMMENT ON COLUMN vehicles.leasing_end_date        IS 'Datum an dem der Leasingvertrag endet';
COMMENT ON COLUMN vehicles.leasing_rate            IS 'Monatliche Leasingrate in Euro';
COMMENT ON COLUMN vehicles.leasing_contract_number IS 'Vertragsnummer des Leasingvertrags';
COMMENT ON COLUMN vehicles.holder                  IS 'Fahrzeughalter (eingetragener Besitzer)';
COMMENT ON COLUMN vehicles.user_name               IS 'Hauptnutzer des Fahrzeugs';

-- Fahrer (refs companies)
CREATE TABLE drivers (
  id             UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name     TEXT           NOT NULL,
  last_name      TEXT           NOT NULL,
  email          TEXT,
  phone          TEXT,
  license_class  TEXT,
  license_expiry DATE,
  company_id     UUID           NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  status         vehicle_status NOT NULL DEFAULT 'active',
  notes          TEXT,
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Fahrzeug-Fahrer-Zuordnung (refs vehicles, drivers)
CREATE TABLE vehicle_drivers (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id  UUID        NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id   UUID        NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  is_primary  BOOLEAN     NOT NULL DEFAULT FALSE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(vehicle_id, driver_id)
);

-- Termine (refs vehicles, appointment_types)
CREATE TABLE appointments (
  id                  UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id          UUID               NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  appointment_type_id UUID               NOT NULL REFERENCES appointment_types(id) ON DELETE RESTRICT,
  due_date            DATE               NOT NULL,
  completed_date      DATE,
  status              appointment_status NOT NULL DEFAULT 'pending',
  notes               TEXT,
  created_at          TIMESTAMPTZ        NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ        NOT NULL DEFAULT NOW()
);

-- Schäden (refs vehicles, damage_types)
CREATE TABLE damages (
  id                     UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id             UUID          NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  damage_type_id         UUID          NOT NULL REFERENCES damage_types(id) ON DELETE RESTRICT,
  date                   DATE          NOT NULL,
  description            TEXT          NOT NULL,
  location               TEXT,
  cost_estimate          DECIMAL(10,2),
  actual_cost            DECIMAL(10,2),
  insurance_claim        BOOLEAN       NOT NULL DEFAULT FALSE,
  insurance_claim_number TEXT,
  status                 damage_status NOT NULL DEFAULT 'reported',
  reported_by            TEXT          NOT NULL,
  notes                  TEXT,
  created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Schadensbilder (refs damages)
CREATE TABLE damage_images (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  damage_id   UUID        NOT NULL REFERENCES damages(id) ON DELETE CASCADE,
  file_path   TEXT        NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kosten (refs vehicles, cost_types)
CREATE TABLE costs (
  id              UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id      UUID        NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  cost_type_id    UUID        NOT NULL REFERENCES cost_types(id) ON DELETE RESTRICT,
  date            DATE        NOT NULL,
  amount          DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  description     TEXT,
  mileage_at_cost INTEGER     CHECK (mileage_at_cost >= 0),
  receipt_path    TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kilometerstand-Historie (refs vehicles)
CREATE TABLE mileage_logs (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id  UUID          NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  mileage     INTEGER       NOT NULL CHECK (mileage >= 0),
  recorded_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  source      mileage_source NOT NULL DEFAULT 'manual',
  notes       TEXT
);

-- Führerscheinkontrolle: Einstellungen (Singleton)
CREATE TABLE license_check_settings (
  id                    UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  check_interval_months INTEGER     NOT NULL DEFAULT 6
    CHECK (check_interval_months > 0 AND check_interval_months <= 24),
  warning_days_before   INTEGER     NOT NULL DEFAULT 14
    CHECK (warning_days_before >= 0 AND warning_days_before <= 90),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Führerscheinkontrolle: Prüfer
CREATE TABLE license_check_inspectors (
  id         UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT                    NOT NULL,
  email      TEXT,
  status     license_inspector_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

-- Führerscheinkontrolle: Mitarbeiter (refs companies)
CREATE TABLE license_check_employees (
  id                  UUID                   PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name          TEXT                   NOT NULL,
  last_name           TEXT                   NOT NULL,
  personnel_number    TEXT,
  company_id          UUID                   NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  email               TEXT,
  license_classes     TEXT                   NOT NULL,
  license_number      TEXT,
  license_expiry_date DATE,
  status              license_employee_status NOT NULL DEFAULT 'active',
  notes               TEXT,
  created_at          TIMESTAMPTZ            NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ            NOT NULL DEFAULT NOW()
);

-- Führerscheinkontrolle: Kontrollen (refs license_check_employees, license_check_inspectors)
CREATE TABLE license_checks (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id      UUID        NOT NULL REFERENCES license_check_employees(id) ON DELETE CASCADE,
  check_date       DATE        NOT NULL,
  checked_by_id    UUID        NOT NULL REFERENCES license_check_inspectors(id) ON DELETE RESTRICT,
  license_verified BOOLEAN     NOT NULL DEFAULT false,
  next_check_due   DATE        NOT NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- UVV: Einstellungen (Singleton)
CREATE TABLE uvv_settings (
  id                    UUID        PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000002'::uuid,
  check_interval_months INTEGER     NOT NULL DEFAULT 12
    CHECK (check_interval_months > 0 AND check_interval_months <= 24),
  warning_days_before   INTEGER     NOT NULL DEFAULT 30
    CHECK (warning_days_before >= 0 AND warning_days_before <= 90),
  default_topics        TEXT        DEFAULT 'Verkehrssicherheit, aktuelle Verkehrsregeln, Verhalten bei Unfällen, Fahrzeugcheck, Ladungssicherung',
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- UVV: Unterweisende
CREATE TABLE uvv_instructors (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL,
  email      TEXT,
  status     TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- UVV: Unterweisungen (refs drivers, uvv_instructors)
CREATE TABLE uvv_checks (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id        UUID        NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  check_date       DATE        NOT NULL,
  instructed_by_id UUID        NOT NULL REFERENCES uvv_instructors(id) ON DELETE RESTRICT,
  topics           TEXT,
  next_check_due   DATE        NOT NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Affiliate: Handwerker/Partner
CREATE TABLE handwerker (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  name             TEXT        NOT NULL,
  email            TEXT        NOT NULL UNIQUE,
  telefon          TEXT,
  provision_prozent DECIMAL(5,2) NOT NULL DEFAULT 0
    CHECK (provision_prozent >= 0 AND provision_prozent <= 50),
  active           BOOLEAN     NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Recruiting: Stellen
CREATE TABLE stellen (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT        NOT NULL,
  description TEXT,
  active      BOOLEAN     NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Empfehlungen (gemeinsam für Affiliate + Recruiting)
-- Affiliate-Empfehlungen: handwerker_id gesetzt, kunde_name, rechnungsbetrag, provision_betrag
-- Recruiting-Empfehlungen: stelle_id gesetzt, kandidat_name, position, praemie_betrag
CREATE TABLE empfehlungen (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  ref_code         TEXT          UNIQUE,
  empfehler_name   TEXT          NOT NULL,
  empfehler_email  TEXT          NOT NULL,
  status           TEXT          NOT NULL DEFAULT 'offen',
  ausgezahlt_am    TIMESTAMPTZ,
  iban             TEXT          CHECK (char_length(iban) <= 34),
  bic              TEXT          CHECK (char_length(bic) <= 11),
  kontoinhaber     TEXT          CHECK (char_length(kontoinhaber) <= 120),
  bank_name        TEXT          CHECK (char_length(bank_name) <= 120),
  -- Affiliate-Felder
  handwerker_id    UUID          REFERENCES handwerker(id) ON DELETE SET NULL,
  kunde_name       TEXT,
  kunde_kontakt    TEXT,
  rechnungsbetrag  DECIMAL(10,2),
  provision_betrag DECIMAL(10,2),
  -- Recruiting-Felder
  stelle_id        UUID          REFERENCES stellen(id) ON DELETE SET NULL,
  kandidat_name    TEXT,
  kandidat_kontakt TEXT,
  position         TEXT,
  praemie_betrag   DECIMAL(10,2),
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- App-Einstellungen (Key-Value, JSONB)
CREATE TABLE app_settings (
  key        TEXT        PRIMARY KEY,
  value      JSONB       NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit-Log (für Affiliate + Recruiting)
CREATE TABLE audit_log (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     TEXT        NOT NULL,
  action      TEXT        NOT NULL,
  target_type TEXT        NOT NULL,
  target_id   TEXT        NOT NULL,
  details     JSONB       NOT NULL DEFAULT '{}',
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dokumente (MUSS nach allen referenzierten Tabellen stehen)
-- Polymorphe Tabelle: genau eine der 7 Entity-FKs muss gesetzt sein
CREATE TABLE documents (
  id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type_id        UUID        NOT NULL REFERENCES document_types(id) ON DELETE RESTRICT,
  name                    TEXT        NOT NULL,
  file_path               TEXT        NOT NULL,
  file_size               INTEGER     NOT NULL CHECK (file_size > 0),
  mime_type               TEXT        NOT NULL,
  notes                   TEXT,
  entity_type             VARCHAR(40) NOT NULL,
  -- Entity-Referenzen (genau eine muss gesetzt sein)
  vehicle_id              UUID        REFERENCES vehicles(id) ON DELETE CASCADE,
  damage_id               UUID        REFERENCES damages(id) ON DELETE CASCADE,
  appointment_id          UUID        REFERENCES appointments(id) ON DELETE CASCADE,
  driver_id               UUID        REFERENCES drivers(id) ON DELETE CASCADE,
  license_check_employee_id UUID      REFERENCES license_check_employees(id) ON DELETE CASCADE,
  license_check_id        UUID        REFERENCES license_checks(id) ON DELETE CASCADE,
  uvv_check_id            UUID        REFERENCES uvv_checks(id) ON DELETE CASCADE,
  uploaded_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Constraint: genau eine Entity-Referenz
  CONSTRAINT check_single_entity_reference CHECK (
    (CASE WHEN vehicle_id              IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN damage_id               IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN appointment_id          IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN driver_id               IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN license_check_employee_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN license_check_id        IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN uvv_check_id            IS NOT NULL THEN 1 ELSE 0 END) = 1
  ),
  -- Constraint: entity_type muss zur gesetzten Referenz passen
  CONSTRAINT check_entity_type_matches CHECK (
    (entity_type = 'vehicle'                AND vehicle_id              IS NOT NULL) OR
    (entity_type = 'damage'                 AND damage_id               IS NOT NULL) OR
    (entity_type = 'appointment'            AND appointment_id          IS NOT NULL) OR
    (entity_type = 'driver'                 AND driver_id               IS NOT NULL) OR
    (entity_type = 'license_check_employee' AND license_check_employee_id IS NOT NULL) OR
    (entity_type = 'license_check'          AND license_check_id        IS NOT NULL) OR
    (entity_type = 'uvv_check'              AND uvv_check_id            IS NOT NULL)
  )
);

-- ============================================================================
-- INDIZES
-- ============================================================================

CREATE INDEX idx_vehicles_company       ON vehicles(company_id);
CREATE INDEX idx_vehicles_status        ON vehicles(status);
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);

CREATE INDEX idx_drivers_company        ON drivers(company_id);
CREATE INDEX idx_drivers_status         ON drivers(status);

CREATE INDEX idx_appointments_vehicle   ON appointments(vehicle_id);
CREATE INDEX idx_appointments_status    ON appointments(status);
CREATE INDEX idx_appointments_due_date  ON appointments(due_date);

CREATE INDEX idx_damages_vehicle        ON damages(vehicle_id);
CREATE INDEX idx_damages_status         ON damages(status);
CREATE INDEX idx_damages_date           ON damages(date);

CREATE INDEX idx_costs_vehicle          ON costs(vehicle_id);
CREATE INDEX idx_costs_date             ON costs(date);

CREATE INDEX idx_mileage_logs_vehicle   ON mileage_logs(vehicle_id);
CREATE INDEX idx_mileage_logs_recorded  ON mileage_logs(recorded_at);

CREATE INDEX idx_license_employees_company ON license_check_employees(company_id);
CREATE INDEX idx_license_employees_status  ON license_check_employees(status);
CREATE INDEX idx_license_employees_name    ON license_check_employees(last_name, first_name);

CREATE INDEX idx_license_checks_employee   ON license_checks(employee_id);
CREATE INDEX idx_license_checks_date       ON license_checks(check_date);
CREATE INDEX idx_license_checks_next_due   ON license_checks(next_check_due);

CREATE INDEX idx_license_inspectors_status ON license_check_inspectors(status);

CREATE INDEX idx_uvv_instructors_status    ON uvv_instructors(status);
CREATE INDEX idx_uvv_checks_driver         ON uvv_checks(driver_id);
CREATE INDEX idx_uvv_checks_date           ON uvv_checks(check_date);
CREATE INDEX idx_uvv_checks_next_due       ON uvv_checks(next_check_due);

CREATE INDEX idx_handwerker_email          ON handwerker(email);
CREATE INDEX idx_handwerker_active         ON handwerker(active);

CREATE INDEX idx_empfehlungen_ref_code     ON empfehlungen(ref_code);
CREATE INDEX idx_empfehlungen_handwerker   ON empfehlungen(handwerker_id);
CREATE INDEX idx_empfehlungen_stelle       ON empfehlungen(stelle_id);
CREATE INDEX idx_empfehlungen_status       ON empfehlungen(status);
CREATE INDEX idx_empfehlungen_created_at   ON empfehlungen(created_at DESC);

CREATE INDEX idx_audit_log_user            ON audit_log(user_id);
CREATE INDEX idx_audit_log_target          ON audit_log(target_type, target_id);
CREATE INDEX idx_audit_log_created_at      ON audit_log(created_at DESC);

CREATE INDEX idx_documents_entity_type              ON documents(entity_type);
CREATE INDEX idx_documents_vehicle_id               ON documents(vehicle_id)               WHERE vehicle_id               IS NOT NULL;
CREATE INDEX idx_documents_damage_id                ON documents(damage_id)                WHERE damage_id                IS NOT NULL;
CREATE INDEX idx_documents_appointment_id           ON documents(appointment_id)           WHERE appointment_id           IS NOT NULL;
CREATE INDEX idx_documents_driver_id                ON documents(driver_id)                WHERE driver_id                IS NOT NULL;
CREATE INDEX idx_documents_license_check_employee_id ON documents(license_check_employee_id) WHERE license_check_employee_id IS NOT NULL;
CREATE INDEX idx_documents_license_check_id         ON documents(license_check_id)         WHERE license_check_id         IS NOT NULL;
CREATE INDEX idx_documents_uvv_check_id             ON documents(uvv_check_id)             WHERE uvv_check_id             IS NOT NULL;

-- ============================================================================
-- FUNKTIONEN
-- ============================================================================

-- updated_at automatisch setzen
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Kilometerstand bei Kosteneintrag aktualisieren
CREATE OR REPLACE FUNCTION update_vehicle_mileage_from_cost()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.mileage_at_cost IS NOT NULL AND NEW.mileage_at_cost > 0 THEN
    UPDATE vehicles
    SET mileage = NEW.mileage_at_cost
    WHERE id = NEW.vehicle_id AND mileage < NEW.mileage_at_cost;

    INSERT INTO mileage_logs (vehicle_id, mileage, source, notes)
    VALUES (NEW.vehicle_id, NEW.mileage_at_cost, 'cost_entry', 'Aktualisiert durch Kosteneintrag');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eindeutigen Ref-Code generieren (#SEE-YYYY-XXXXXX)
CREATE OR REPLACE FUNCTION generate_ref_code()
RETURNS TEXT AS $$
DECLARE
  chars  TEXT    := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT;
  suffix TEXT;
  exists BOOLEAN;
  i      INTEGER;
BEGIN
  LOOP
    suffix := '';
    FOR i IN 1..6 LOOP
      suffix := suffix || substr(chars, floor(random() * 36 + 1)::int, 1);
    END LOOP;
    result := '#SEE-' || to_char(NOW(), 'YYYY') || '-' || suffix;
    SELECT EXISTS(SELECT 1 FROM empfehlungen WHERE ref_code = result) INTO exists;
    EXIT WHEN NOT exists;
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER
-- ============================================================================

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

CREATE TRIGGER update_mileage_on_cost_insert
  AFTER INSERT ON costs
  FOR EACH ROW EXECUTE FUNCTION update_vehicle_mileage_from_cost();

CREATE TRIGGER update_license_employees_updated_at
  BEFORE UPDATE ON license_check_employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_license_settings_updated_at
  BEFORE UPDATE ON license_check_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_uvv_settings_updated_at
  BEFORE UPDATE ON uvv_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_handwerker_updated_at
  BEFORE UPDATE ON handwerker
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stellen_updated_at
  BEFORE UPDATE ON stellen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_empfehlungen_updated_at
  BEFORE UPDATE ON empfehlungen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE companies                ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicles                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE drivers                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_drivers          ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments             ENABLE ROW LEVEL SECURITY;
ALTER TABLE damages                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_images            ENABLE ROW LEVEL SECURITY;
ALTER TABLE costs                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE mileage_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_types        ENABLE ROW LEVEL SECURITY;
ALTER TABLE damage_types             ENABLE ROW LEVEL SECURITY;
ALTER TABLE cost_types               ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_types           ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents                ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_check_settings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_check_inspectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_check_employees  ENABLE ROW LEVEL SECURITY;
ALTER TABLE license_checks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE uvv_settings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE uvv_instructors          ENABLE ROW LEVEL SECURITY;
ALTER TABLE uvv_checks               ENABLE ROW LEVEL SECURITY;
ALTER TABLE handwerker               ENABLE ROW LEVEL SECURITY;
ALTER TABLE stellen                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE empfehlungen             ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log                ENABLE ROW LEVEL SECURITY;

-- Fuhrpark: voller Zugriff für eingeloggte Nutzer
CREATE POLICY "companies_all"        ON companies        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "vehicles_select"      ON vehicles         FOR SELECT TO authenticated USING (true);
CREATE POLICY "vehicles_insert"      ON vehicles         FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "vehicles_update"      ON vehicles         FOR UPDATE TO authenticated USING (true);
CREATE POLICY "vehicles_delete"      ON vehicles         FOR DELETE TO authenticated USING (true);
CREATE POLICY "drivers_all"          ON drivers          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "vehicle_drivers_all"  ON vehicle_drivers  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "appointments_all"     ON appointments     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "damages_all"          ON damages          FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "damage_images_all"    ON damage_images    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "costs_all"            ON costs            FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "mileage_logs_all"     ON mileage_logs     FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "documents_all"        ON documents        FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Lookup-Tabellen: lesend + admin-Write
CREATE POLICY "appointment_types_all" ON appointment_types FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "damage_types_all"      ON damage_types      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "cost_types_all"        ON cost_types        FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "document_types_all"    ON document_types    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Führerscheinkontrolle
CREATE POLICY "license_settings_select" ON license_check_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "license_settings_update" ON license_check_settings FOR UPDATE TO authenticated USING (true);
CREATE POLICY "license_inspectors_all"  ON license_check_inspectors FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "license_employees_all"   ON license_check_employees  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "license_checks_all"      ON license_checks           FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- UVV
CREATE POLICY "uvv_settings_select" ON uvv_settings   FOR SELECT TO authenticated USING (true);
CREATE POLICY "uvv_settings_update" ON uvv_settings   FOR UPDATE TO authenticated USING (true);
CREATE POLICY "uvv_instructors_all" ON uvv_instructors FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "uvv_checks_all"      ON uvv_checks      FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Affiliate + Recruiting: nur service_role (alle API-Routen nutzen Admin-Client)
CREATE POLICY "handwerker_service_role"   ON handwerker   FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "stellen_service_role"      ON stellen      FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "empfehlungen_service_role" ON empfehlungen FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "app_settings_service_role" ON app_settings FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "audit_log_service_role"    ON audit_log    FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================================
-- SEED-DATEN
-- ============================================================================

-- Terminarten
INSERT INTO appointment_types (id, name, default_interval_months, color) VALUES
  ('11111111-1111-1111-1111-111111111001', 'TÜV',              24,   '#ef4444'),
  ('11111111-1111-1111-1111-111111111002', 'Service/Wartung',  12,   '#3b82f6'),
  ('11111111-1111-1111-1111-111111111003', 'Ölwechsel',        12,   '#f59e0b'),
  ('11111111-1111-1111-1111-111111111004', 'Reifenwechsel',    6,    '#10b981'),
  ('11111111-1111-1111-1111-111111111005', 'Inspektion',       12,   '#8b5cf6'),
  ('11111111-1111-1111-1111-111111111006', 'Bremsenprüfung',   12,   '#ec4899'),
  ('11111111-1111-1111-1111-111111111007', 'UVV-Prüfung',      12,   '#06b6d4'),
  ('11111111-1111-1111-1111-111111111008', 'Leasing-Rückgabe', NULL, '#6b7280')
ON CONFLICT (name) DO NOTHING;

-- Schadensarten
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

-- Kostenarten
INSERT INTO cost_types (id, name, icon) VALUES
  ('33333333-3333-3333-3333-333333333001', 'Tanken',         '⛽'),
  ('33333333-3333-3333-3333-333333333002', 'Service/Wartung','🔧'),
  ('33333333-3333-3333-3333-333333333003', 'Reparatur',      '🛠️'),
  ('33333333-3333-3333-3333-333333333004', 'Versicherung',   '🛡️'),
  ('33333333-3333-3333-3333-333333333005', 'KFZ-Steuer',     '📋'),
  ('33333333-3333-3333-3333-333333333006', 'Leasing',        '📄'),
  ('33333333-3333-3333-3333-333333333007', 'Parken',         '🅿️'),
  ('33333333-3333-3333-3333-333333333008', 'Maut',           '🛣️'),
  ('33333333-3333-3333-3333-333333333009', 'Fahrzeugwäsche', '🚿')
ON CONFLICT (name) DO NOTHING;

-- Dokumenttypen
INSERT INTO document_types (id, name, description) VALUES
  ('44444444-4444-4444-4444-444444444001', 'Fahrzeugschein',     'Zulassungsbescheinigung Teil I'),
  ('44444444-4444-4444-4444-444444444002', 'Fahrzeugbrief',      'Zulassungsbescheinigung Teil II'),
  ('44444444-4444-4444-4444-444444444003', 'Versicherungspolice','KFZ-Versicherungsdokumente'),
  ('44444444-4444-4444-4444-444444444004', 'TÜV-Bericht',        'Hauptuntersuchung'),
  ('44444444-4444-4444-4444-444444444005', 'Serviceheft',        'Wartungsnachweise'),
  ('44444444-4444-4444-4444-444444444006', 'Rechnung',           'Rechnungen und Belege'),
  ('44444444-4444-4444-4444-444444444007', 'Vertrag',            'Kauf- oder Leasingvertrag'),
  ('44444444-4444-4444-4444-444444444008', 'Übergabeprotokoll',  'Fahrzeugübergabe')
ON CONFLICT (name) DO NOTHING;

-- Führerscheinkontrolle: Standard-Einstellungen
INSERT INTO license_check_settings (id, check_interval_months, warning_days_before)
VALUES ('00000000-0000-0000-0000-000000000001', 6, 14)
ON CONFLICT (id) DO NOTHING;

-- UVV: Standard-Einstellungen
INSERT INTO uvv_settings (id, check_interval_months, warning_days_before)
VALUES ('00000000-0000-0000-0000-000000000002', 12, 30)
ON CONFLICT (id) DO NOTHING;

-- App-Einstellungen: Standard-Prämie für Recruiting-Empfehlungen
INSERT INTO app_settings (key, value)
VALUES ('praemie_betrag_default', '1000'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- ============================================================================
-- ROI-MODUL SCHEMA (dediziertes roi-Schema)
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS roi;

-- Aufträge (Google Ads Projekt)
CREATE TABLE roi.jobs (
  id             UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  jahr           INTEGER,
  monat          TEXT,
  kundenname     TEXT,
  objektadresse  TEXT,
  taetigkeit     TEXT,
  herkunft       TEXT,
  netto_umsatz   DECIMAL(12,2),
  rohertrag      DECIMAL(12,2),
  angebot        TEXT,
  datum          DATE,
  company_id     TEXT           NOT NULL DEFAULT 'admin',
  created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Konfiguration (ROI-Parameter)
CREATE TABLE roi.config (
  id                    UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  homepage_kosten       DECIMAL(10,2) NOT NULL DEFAULT 3500,
  ads_setup_kosten      DECIMAL(10,2) NOT NULL DEFAULT 1200,
  google_ads_budget     DECIMAL(10,2) NOT NULL DEFAULT 800,
  pflegekosten_monat    DECIMAL(10,2) NOT NULL DEFAULT 300,
  operative_marge_pct   DECIMAL(5,4)  NOT NULL DEFAULT 0.35,
  avg_auftraege_monat   DECIMAL(5,2)  NOT NULL DEFAULT 8,
  company_id            TEXT          NOT NULL DEFAULT 'admin',
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Upload-Protokoll (importierte Dateien)
CREATE TABLE roi.uploads (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  filename        TEXT        NOT NULL,
  rows_imported   INTEGER     NOT NULL DEFAULT 0,
  rows_skipped    INTEGER     NOT NULL DEFAULT 0,
  column_mapping  JSONB,
  company_id      TEXT        NOT NULL DEFAULT 'admin',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Marketing-Einkäufe (Flywheel)
CREATE TABLE roi.purchases (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id    TEXT        NOT NULL,
  channel_name  TEXT        NOT NULL,
  amount        DECIMAL(10,2) NOT NULL,
  pricing       TEXT        NOT NULL CHECK (pricing IN ('recurring', 'onetime')),
  note          TEXT        NOT NULL DEFAULT '',
  purchased_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  company_id    TEXT        NOT NULL DEFAULT 'admin',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indizes
CREATE INDEX idx_roi_jobs_datum      ON roi.jobs(datum);
CREATE INDEX idx_roi_jobs_company    ON roi.jobs(company_id);
CREATE INDEX idx_roi_jobs_created    ON roi.jobs(created_at DESC);

CREATE INDEX idx_roi_config_company  ON roi.config(company_id);

CREATE INDEX idx_roi_uploads_created ON roi.uploads(created_at DESC);
CREATE INDEX idx_roi_uploads_company ON roi.uploads(company_id);

CREATE INDEX idx_roi_purchases_channel  ON roi.purchases(channel_id);
CREATE INDEX idx_roi_purchases_company  ON roi.purchases(company_id);
CREATE INDEX idx_roi_purchases_bought   ON roi.purchases(purchased_at DESC);

-- Standard-Konfiguration
INSERT INTO roi.config (
  homepage_kosten, ads_setup_kosten, google_ads_budget,
  pflegekosten_monat, operative_marge_pct, avg_auftraege_monat
) VALUES (3500, 1200, 800, 300, 0.35, 8);

-- RLS
ALTER TABLE roi.jobs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi.config    ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi.uploads   ENABLE ROW LEVEL SECURITY;
ALTER TABLE roi.purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "roi_jobs_all"      ON roi.jobs      FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "roi_config_all"    ON roi.config    FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "roi_uploads_all"   ON roi.uploads   FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "roi_purchases_all" ON roi.purchases FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============================================================================
-- ENDE DES SCHEMAS
-- ============================================================================
