-- ============================================================================
-- GruppenwerkUnited – Teil 1/5: Erweiterungen, Enums, Kerntabellen
-- Stand: 2026-04-10
-- Ausführen: Supabase SQL Editor → einfügen → Run
-- ============================================================================

-- Erweiterungen
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Separate Schemata für ROI und VOB
CREATE SCHEMA IF NOT EXISTS roi;
CREATE SCHEMA IF NOT EXISTS vob;

-- ============================================================================
-- ENUM-TYPEN
-- ============================================================================

DO $$ BEGIN CREATE TYPE fuel_type AS ENUM (
  'diesel', 'benzin', 'elektro', 'hybrid_benzin', 'hybrid_diesel', 'gas'
); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE vehicle_status AS ENUM ('active', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE damage_status AS ENUM ('reported', 'approved', 'in_repair', 'completed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE appointment_status AS ENUM ('pending', 'completed', 'overdue');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE mileage_source AS ENUM ('manual', 'cost_entry', 'damage_report');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE license_employee_status AS ENUM ('active', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE license_inspector_status AS ENUM ('active', 'archived');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================================
-- KERNTABELLEN (Abhängigkeitsreihenfolge)
-- ============================================================================

-- Firmen (keine Abhängigkeiten)
CREATE TABLE IF NOT EXISTS companies (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Terminarten (keine Abhängigkeiten)
CREATE TABLE IF NOT EXISTS appointment_types (
  id                      UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                    TEXT        NOT NULL UNIQUE,
  default_interval_months INTEGER,
  color                   TEXT        NOT NULL DEFAULT '#3b82f6',
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Schadensarten (keine Abhängigkeiten)
CREATE TABLE IF NOT EXISTS damage_types (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kostenarten (keine Abhängigkeiten)
CREATE TABLE IF NOT EXISTS cost_types (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL UNIQUE,
  icon       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Dokumenttypen (keine Abhängigkeiten)
CREATE TABLE IF NOT EXISTS document_types (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT        NOT NULL UNIQUE,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Fahrzeuge (Abhängigkeit: companies)
CREATE TABLE IF NOT EXISTS vehicles (
  id                      UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  license_plate           TEXT           NOT NULL UNIQUE,
  brand                   TEXT           NOT NULL,
  model                   TEXT           NOT NULL,
  year                    INTEGER        NOT NULL CHECK (year >= 1990),
  vin                     TEXT           UNIQUE,
  fuel_type               fuel_type      NOT NULL DEFAULT 'diesel',
  purchase_date           DATE,
  purchase_price          DECIMAL(10,2),
  mileage                 INTEGER        NOT NULL DEFAULT 0 CHECK (mileage >= 0),
  is_leased               BOOLEAN        NOT NULL DEFAULT FALSE,
  leasing_company         TEXT,
  leasing_end_date        DATE,
  leasing_rate            DECIMAL(10,2),
  leasing_contract_number TEXT,
  holder                  TEXT,
  user_name               TEXT,
  insurance_number        TEXT,
  insurance_company       TEXT,
  tuv_due_date            DATE,
  status                  vehicle_status NOT NULL DEFAULT 'active',
  company_id              UUID           NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  notes                   TEXT,
  created_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN vehicles.leasing_company         IS 'Leasinggeber (z.B. ALD Automotive)';
COMMENT ON COLUMN vehicles.leasing_end_date        IS 'Datum an dem der Leasingvertrag endet';
COMMENT ON COLUMN vehicles.leasing_rate            IS 'Monatliche Leasingrate in Euro';
COMMENT ON COLUMN vehicles.leasing_contract_number IS 'Vertragsnummer des Leasingvertrags';
COMMENT ON COLUMN vehicles.holder                  IS 'Fahrzeughalter (eingetragener Besitzer)';
COMMENT ON COLUMN vehicles.user_name               IS 'Hauptnutzer des Fahrzeugs';

-- Fahrer (Abhängigkeit: companies)
CREATE TABLE IF NOT EXISTS drivers (
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

-- Fahrzeug-Fahrer-Zuordnung (Abhängigkeiten: vehicles, drivers)
CREATE TABLE IF NOT EXISTS vehicle_drivers (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id  UUID        NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  driver_id   UUID        NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  is_primary  BOOLEAN     NOT NULL DEFAULT FALSE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(vehicle_id, driver_id)
);

-- Termine (Abhängigkeiten: vehicles, appointment_types)
CREATE TABLE IF NOT EXISTS appointments (
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

-- Schäden (Abhängigkeiten: vehicles, damage_types)
CREATE TABLE IF NOT EXISTS damages (
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

-- Schadensbilder (Abhängigkeit: damages)
CREATE TABLE IF NOT EXISTS damage_images (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  damage_id   UUID        NOT NULL REFERENCES damages(id) ON DELETE CASCADE,
  file_path   TEXT        NOT NULL,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Kosten (Abhängigkeiten: vehicles, cost_types)
CREATE TABLE IF NOT EXISTS costs (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id      UUID          NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  cost_type_id    UUID          NOT NULL REFERENCES cost_types(id) ON DELETE RESTRICT,
  date            DATE          NOT NULL,
  amount          DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  description     TEXT,
  mileage_at_cost INTEGER       CHECK (mileage_at_cost >= 0),
  receipt_path    TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Kilometerstand-Historie (Abhängigkeit: vehicles)
CREATE TABLE IF NOT EXISTS mileage_logs (
  id          UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
  vehicle_id  UUID           NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  mileage     INTEGER        NOT NULL CHECK (mileage >= 0),
  recorded_at TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  source      mileage_source NOT NULL DEFAULT 'manual',
  notes       TEXT
);

-- ============================================================================
-- ENDE TEIL 1 — Weiter mit Teil 2
-- ============================================================================
