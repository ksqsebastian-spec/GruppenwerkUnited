-- ============================================================================
-- GruppenwerkUnited – Teil 2/5: Führerscheinkontrolle, UVV, Affiliate, Dokumente
-- Stand: 2026-04-10
-- Voraussetzung: Teil 1 muss zuerst ausgeführt werden
-- ============================================================================

-- ============================================================================
-- FÜHRERSCHEINKONTROLLE (§ 21 StVG)
-- ============================================================================

-- Einstellungen (Singleton-Tabelle)
CREATE TABLE IF NOT EXISTS license_check_settings (
  id                    UUID        PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000001'::uuid,
  check_interval_months INTEGER     NOT NULL DEFAULT 6
    CHECK (check_interval_months > 0 AND check_interval_months <= 24),
  warning_days_before   INTEGER     NOT NULL DEFAULT 14
    CHECK (warning_days_before >= 0 AND warning_days_before <= 90),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Prüfer (wer Kontrollen durchführen darf)
CREATE TABLE IF NOT EXISTS license_check_inspectors (
  id         UUID                     PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT                     NOT NULL,
  email      TEXT,
  status     license_inspector_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ              NOT NULL DEFAULT NOW()
);

-- Mitarbeiter für Führerscheinkontrolle (getrennt von Fahrern)
CREATE TABLE IF NOT EXISTS license_check_employees (
  id                  UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name          TEXT                    NOT NULL,
  last_name           TEXT                    NOT NULL,
  personnel_number    TEXT,
  company_id          UUID                    NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  email               TEXT,
  license_classes     TEXT                    NOT NULL,
  license_number      TEXT,
  license_expiry_date DATE,
  status              license_employee_status NOT NULL DEFAULT 'active',
  notes               TEXT,
  created_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

-- Kontrollen-Historie
CREATE TABLE IF NOT EXISTS license_checks (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id      UUID        NOT NULL REFERENCES license_check_employees(id) ON DELETE CASCADE,
  check_date       DATE        NOT NULL,
  checked_by_id    UUID        NOT NULL REFERENCES license_check_inspectors(id) ON DELETE RESTRICT,
  license_verified BOOLEAN     NOT NULL DEFAULT false,
  next_check_due   DATE        NOT NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- UVV-KONTROLLE (Fahrerunterweisung)
-- ============================================================================

-- Einstellungen (Singleton-Tabelle)
CREATE TABLE IF NOT EXISTS uvv_settings (
  id                    UUID        PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000002'::uuid,
  check_interval_months INTEGER     NOT NULL DEFAULT 12
    CHECK (check_interval_months > 0 AND check_interval_months <= 24),
  warning_days_before   INTEGER     NOT NULL DEFAULT 30
    CHECK (warning_days_before >= 0 AND warning_days_before <= 90),
  default_topics        TEXT        DEFAULT 'Verkehrssicherheit, aktuelle Verkehrsregeln, Verhalten bei Unfällen, Fahrzeugcheck, Ladungssicherung',
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unterweisende
CREATE TABLE IF NOT EXISTS uvv_instructors (
  id         UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT        NOT NULL,
  email      TEXT,
  status     TEXT        NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unterweisungen (Abhängigkeiten: drivers, uvv_instructors)
CREATE TABLE IF NOT EXISTS uvv_checks (
  id               UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id        UUID        NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  check_date       DATE        NOT NULL,
  instructed_by_id UUID        NOT NULL REFERENCES uvv_instructors(id) ON DELETE RESTRICT,
  topics           TEXT,
  next_check_due   DATE        NOT NULL,
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- AFFILIATE & RECRUITING
-- ============================================================================

-- Handwerker/Partner
-- Hinweis: auth_user_id ist eine einfache UUID ohne FK (App nutzt Custom-Auth, nicht Supabase Auth)
CREATE TABLE IF NOT EXISTS handwerker (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id      UUID,
  name              TEXT          NOT NULL,
  email             TEXT          NOT NULL UNIQUE,
  telefon           TEXT,
  provision_prozent DECIMAL(5,2)  NOT NULL DEFAULT 0
    CHECK (provision_prozent >= 0 AND provision_prozent <= 50),
  active            BOOLEAN       NOT NULL DEFAULT true,
  company           TEXT          NOT NULL DEFAULT '',
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

COMMENT ON COLUMN handwerker.auth_user_id IS 'Referenz auf internen Benutzer (Custom Auth, kein Supabase Auth)';

-- Stellenanzeigen
CREATE TABLE IF NOT EXISTS stellen (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       TEXT        NOT NULL,
  description TEXT,
  active      BOOLEAN     NOT NULL DEFAULT true,
  company     TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Empfehlungen (Affiliate + Recruiting kombiniert)
-- Affiliate-Empfehlungen: handwerker_id gesetzt, kunde_name, rechnungsbetrag, provision_betrag
-- Recruiting-Empfehlungen: stelle_id gesetzt, kandidat_name, position, praemie_betrag
CREATE TABLE IF NOT EXISTS empfehlungen (
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
  -- Multi-Tenant: Firma für Datentrennung
  company          TEXT          NOT NULL DEFAULT '',
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- App-Einstellungen (Key-Value-Store)
CREATE TABLE IF NOT EXISTS app_settings (
  key        TEXT        PRIMARY KEY,
  value      JSONB       NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit-Log
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     TEXT        NOT NULL,
  action      TEXT        NOT NULL,
  target_type TEXT        NOT NULL,
  target_id   TEXT        NOT NULL,
  details     JSONB       NOT NULL DEFAULT '{}',
  ip_address  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- DOKUMENTE (polymorphe Tabelle — muss nach allen Entity-Tabellen stehen)
-- ============================================================================

CREATE TABLE IF NOT EXISTS documents (
  id                        UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_type_id          UUID        NOT NULL REFERENCES document_types(id) ON DELETE RESTRICT,
  name                      TEXT        NOT NULL,
  file_path                 TEXT        NOT NULL,
  file_size                 INTEGER     NOT NULL CHECK (file_size > 0),
  mime_type                 TEXT        NOT NULL,
  notes                     TEXT,
  entity_type               VARCHAR(40) NOT NULL,
  -- Entity-Referenzen (genau eine muss gesetzt sein)
  vehicle_id                UUID        REFERENCES vehicles(id) ON DELETE CASCADE,
  damage_id                 UUID        REFERENCES damages(id) ON DELETE CASCADE,
  appointment_id            UUID        REFERENCES appointments(id) ON DELETE CASCADE,
  driver_id                 UUID        REFERENCES drivers(id) ON DELETE CASCADE,
  license_check_employee_id UUID        REFERENCES license_check_employees(id) ON DELETE CASCADE,
  license_check_id          UUID        REFERENCES license_checks(id) ON DELETE CASCADE,
  uvv_check_id              UUID        REFERENCES uvv_checks(id) ON DELETE CASCADE,
  uploaded_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Constraint: genau eine Entity-Referenz muss gesetzt sein
  CONSTRAINT check_single_entity_reference CHECK (
    (CASE WHEN vehicle_id                IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN damage_id                 IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN appointment_id            IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN driver_id                 IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN license_check_employee_id IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN license_check_id          IS NOT NULL THEN 1 ELSE 0 END +
     CASE WHEN uvv_check_id              IS NOT NULL THEN 1 ELSE 0 END) = 1
  ),
  -- Constraint: entity_type muss zur gesetzten Referenz passen
  CONSTRAINT check_entity_type_matches CHECK (
    (entity_type = 'vehicle'                AND vehicle_id                IS NOT NULL) OR
    (entity_type = 'damage'                 AND damage_id                 IS NOT NULL) OR
    (entity_type = 'appointment'            AND appointment_id            IS NOT NULL) OR
    (entity_type = 'driver'                 AND driver_id                 IS NOT NULL) OR
    (entity_type = 'license_check_employee' AND license_check_employee_id IS NOT NULL) OR
    (entity_type = 'license_check'          AND license_check_id          IS NOT NULL) OR
    (entity_type = 'uvv_check'              AND uvv_check_id              IS NOT NULL)
  )
);

-- ============================================================================
-- ENDE TEIL 2 — Weiter mit Teil 3
-- ============================================================================
