-- ============================================================================
-- GruppenwerkUnited – Teil 4/5: Funktionen, Trigger, Indizes
-- Stand: 2026-04-10
-- Voraussetzung: Teile 1–3 müssen zuerst ausgeführt werden
-- ============================================================================

-- ============================================================================
-- FUNKTIONEN
-- ============================================================================

-- Universelle updated_at Funktion (für alle Tabellen mit updated_at Spalte)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Kilometerstand bei Kosteneintrag automatisch aktualisieren
CREATE OR REPLACE FUNCTION update_vehicle_mileage_from_cost()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.mileage_at_cost IS NOT NULL AND NEW.mileage_at_cost > 0 THEN
    -- Fahrzeug-Kilometerstand nur erhöhen, nie verringern
    UPDATE vehicles
    SET mileage = NEW.mileage_at_cost
    WHERE id = NEW.vehicle_id AND mileage < NEW.mileage_at_cost;

    -- Kilometerstand-Log erstellen
    INSERT INTO mileage_logs (vehicle_id, mileage, source, notes)
    VALUES (NEW.vehicle_id, NEW.mileage_at_cost, 'cost_entry', 'Aktualisiert durch Kosteneintrag');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- UVV-Einstellungen updated_at
CREATE OR REPLACE FUNCTION update_uvv_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Empfehlung: company automatisch ableiten
-- Affiliate: aus handwerker_id → handwerker.company
-- Recruiting: aus stelle_id → stellen.company
CREATE OR REPLACE FUNCTION set_empfehlung_company()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF (NEW.company IS NULL OR NEW.company = '') THEN
    IF NEW.handwerker_id IS NOT NULL THEN
      SELECT company INTO NEW.company FROM handwerker WHERE id = NEW.handwerker_id;
    ELSIF NEW.stelle_id IS NOT NULL THEN
      SELECT company INTO NEW.company FROM stellen WHERE id = NEW.stelle_id;
    END IF;
    NEW.company := COALESCE(NEW.company, '');
  END IF;
  RETURN NEW;
END;
$$;

-- VOB: updated_at für Ausschreibungen
CREATE OR REPLACE FUNCTION vob.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER
-- ============================================================================

-- Fuhrpark: updated_at
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at
  BEFORE UPDATE ON vehicles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_drivers_updated_at ON drivers;
CREATE TRIGGER update_drivers_updated_at
  BEFORE UPDATE ON drivers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_damages_updated_at ON damages;
CREATE TRIGGER update_damages_updated_at
  BEFORE UPDATE ON damages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Kosten: Kilometerstand automatisch aktualisieren
DROP TRIGGER IF EXISTS update_mileage_on_cost_insert ON costs;
CREATE TRIGGER update_mileage_on_cost_insert
  AFTER INSERT ON costs
  FOR EACH ROW EXECUTE FUNCTION update_vehicle_mileage_from_cost();

-- Führerscheinkontrolle: updated_at
DROP TRIGGER IF EXISTS update_license_employees_updated_at ON license_check_employees;
CREATE TRIGGER update_license_employees_updated_at
  BEFORE UPDATE ON license_check_employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_license_settings_updated_at ON license_check_settings;
CREATE TRIGGER update_license_settings_updated_at
  BEFORE UPDATE ON license_check_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- UVV: updated_at
DROP TRIGGER IF EXISTS trigger_uvv_settings_updated_at ON uvv_settings;
CREATE TRIGGER trigger_uvv_settings_updated_at
  BEFORE UPDATE ON uvv_settings
  FOR EACH ROW EXECUTE FUNCTION update_uvv_settings_updated_at();

-- Affiliate/Recruiting: updated_at
DROP TRIGGER IF EXISTS update_handwerker_updated_at ON handwerker;
CREATE TRIGGER update_handwerker_updated_at
  BEFORE UPDATE ON handwerker
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_stellen_updated_at ON stellen;
CREATE TRIGGER update_stellen_updated_at
  BEFORE UPDATE ON stellen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_empfehlungen_updated_at ON empfehlungen;
CREATE TRIGGER update_empfehlungen_updated_at
  BEFORE UPDATE ON empfehlungen
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Empfehlung: company automatisch ableiten
DROP TRIGGER IF EXISTS trg_empfehlung_company ON empfehlungen;
CREATE TRIGGER trg_empfehlung_company
  BEFORE INSERT ON empfehlungen
  FOR EACH ROW EXECUTE FUNCTION set_empfehlung_company();

-- VOB: updated_at für Ausschreibungen
DROP TRIGGER IF EXISTS trg_vob_tenders_updated_at ON vob.vob_tenders;
CREATE TRIGGER trg_vob_tenders_updated_at
  BEFORE UPDATE ON vob.vob_tenders
  FOR EACH ROW EXECUTE FUNCTION vob.update_updated_at();

-- ============================================================================
-- INDIZES
-- ============================================================================

-- Fahrzeuge
CREATE INDEX IF NOT EXISTS idx_vehicles_company       ON vehicles(company_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_status        ON vehicles(status);
CREATE INDEX IF NOT EXISTS idx_vehicles_license_plate ON vehicles(license_plate);

-- Fahrer
CREATE INDEX IF NOT EXISTS idx_drivers_company ON drivers(company_id);
CREATE INDEX IF NOT EXISTS idx_drivers_status  ON drivers(status);

-- Termine
CREATE INDEX IF NOT EXISTS idx_appointments_vehicle  ON appointments(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status   ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_due_date ON appointments(due_date);

-- Schäden
CREATE INDEX IF NOT EXISTS idx_damages_vehicle ON damages(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_damages_status  ON damages(status);
CREATE INDEX IF NOT EXISTS idx_damages_date    ON damages(date);

-- Kosten
CREATE INDEX IF NOT EXISTS idx_costs_vehicle ON costs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_costs_date    ON costs(date);

-- Kilometerstand
CREATE INDEX IF NOT EXISTS idx_mileage_logs_vehicle  ON mileage_logs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_mileage_logs_recorded ON mileage_logs(recorded_at);

-- Dokumente (partielle Indizes für polymorphe Referenzen)
CREATE INDEX IF NOT EXISTS idx_documents_vehicle                ON documents(vehicle_id) WHERE vehicle_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_damage_id              ON documents(damage_id) WHERE damage_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_appointment_id         ON documents(appointment_id) WHERE appointment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_driver_id              ON documents(driver_id) WHERE driver_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_license_check_employee ON documents(license_check_employee_id) WHERE license_check_employee_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_license_check          ON documents(license_check_id) WHERE license_check_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_uvv_check              ON documents(uvv_check_id) WHERE uvv_check_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_documents_entity_type            ON documents(entity_type);
CREATE INDEX IF NOT EXISTS idx_documents_document_type          ON documents(document_type_id);

-- Führerscheinkontrolle
CREATE INDEX IF NOT EXISTS idx_license_employees_company ON license_check_employees(company_id);
CREATE INDEX IF NOT EXISTS idx_license_employees_status  ON license_check_employees(status);
CREATE INDEX IF NOT EXISTS idx_license_employees_name    ON license_check_employees(last_name, first_name);
CREATE INDEX IF NOT EXISTS idx_license_checks_employee   ON license_checks(employee_id);
CREATE INDEX IF NOT EXISTS idx_license_checks_date       ON license_checks(check_date);
CREATE INDEX IF NOT EXISTS idx_license_checks_next_due   ON license_checks(next_check_due);
CREATE INDEX IF NOT EXISTS idx_license_inspectors_status ON license_check_inspectors(status);

-- UVV
CREATE INDEX IF NOT EXISTS idx_uvv_instructors_status ON uvv_instructors(status);
CREATE INDEX IF NOT EXISTS idx_uvv_checks_driver      ON uvv_checks(driver_id);
CREATE INDEX IF NOT EXISTS idx_uvv_checks_date        ON uvv_checks(check_date);
CREATE INDEX IF NOT EXISTS idx_uvv_checks_next_due    ON uvv_checks(next_check_due);

-- Affiliate/Recruiting
CREATE INDEX IF NOT EXISTS idx_handwerker_company   ON handwerker(company);
CREATE INDEX IF NOT EXISTS idx_stellen_company      ON stellen(company);
CREATE INDEX IF NOT EXISTS idx_empfehlungen_company ON empfehlungen(company);
CREATE INDEX IF NOT EXISTS idx_empfehlungen_status  ON empfehlungen(status);

-- ROI
CREATE INDEX IF NOT EXISTS idx_roi_jobs_datum         ON roi.jobs(datum);
CREATE INDEX IF NOT EXISTS idx_roi_jobs_company       ON roi.jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_roi_jobs_created       ON roi.jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_roi_config_company     ON roi.config(company_id);
CREATE INDEX IF NOT EXISTS idx_roi_uploads_created    ON roi.uploads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_roi_uploads_company    ON roi.uploads(company_id);
CREATE INDEX IF NOT EXISTS idx_roi_purchases_channel  ON roi.purchases(channel_id);
CREATE INDEX IF NOT EXISTS idx_roi_purchases_company  ON roi.purchases(company_id);
CREATE INDEX IF NOT EXISTS idx_roi_purchases_bought   ON roi.purchases(purchased_at DESC);

-- VOB
CREATE INDEX IF NOT EXISTS idx_vob_tenders_status   ON vob.vob_tenders(status);
CREATE INDEX IF NOT EXISTS idx_vob_tenders_deadline ON vob.vob_tenders(deadline_date);
CREATE INDEX IF NOT EXISTS idx_vob_tenders_scan_id  ON vob.vob_tenders(scan_id);
CREATE INDEX IF NOT EXISTS idx_vob_tenders_created  ON vob.vob_tenders(created_at);
CREATE INDEX IF NOT EXISTS idx_vob_matches_tender   ON vob.vob_matches(tender_id);
CREATE INDEX IF NOT EXISTS idx_vob_matches_company  ON vob.vob_matches(company_id);
CREATE INDEX IF NOT EXISTS idx_vob_matches_slug     ON vob.vob_matches(company_slug);
CREATE INDEX IF NOT EXISTS idx_vob_scans_date       ON vob.vob_scans(scan_date DESC);

-- ============================================================================
-- ENDE TEIL 4 — Weiter mit Teil 5
-- ============================================================================
