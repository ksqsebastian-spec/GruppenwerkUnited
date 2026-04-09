-- ============================================================================
-- Migration 008: RLS-Policies auf anon-Rolle umstellen
--
-- PROBLEM: Die App nutzt einen eigenen Cookie-basierten Auth-Mechanismus
-- (KEIN Supabase Auth). Der Browser-Client verwendet den Supabase-Anon-Key
-- und läuft damit als Rolle "anon" — nicht als "authenticated".
-- Die bisherigen Policies waren auf "authenticated" gestellt und blockierten
-- deshalb ALLE Datenbankoperationen (SELECT, INSERT, UPDATE, DELETE).
--
-- LÖSUNG: Policies auf "anon"-Rolle umstellen.
-- Zugriffskontrolle erfolgt weiterhin durch den Werkbank-Proxy (middleware.ts).
--
-- Ausführen in Supabase SQL-Editor
-- ============================================================================

-- Fuhrpark-Tabellen: alte Policies löschen und neu anlegen
DROP POLICY IF EXISTS "companies_all"       ON companies;
DROP POLICY IF EXISTS "vehicles_select"     ON vehicles;
DROP POLICY IF EXISTS "vehicles_insert"     ON vehicles;
DROP POLICY IF EXISTS "vehicles_update"     ON vehicles;
DROP POLICY IF EXISTS "vehicles_delete"     ON vehicles;
DROP POLICY IF EXISTS "drivers_all"         ON drivers;
DROP POLICY IF EXISTS "vehicle_drivers_all" ON vehicle_drivers;
DROP POLICY IF EXISTS "appointments_all"    ON appointments;
DROP POLICY IF EXISTS "damages_all"         ON damages;
DROP POLICY IF EXISTS "damage_images_all"   ON damage_images;
DROP POLICY IF EXISTS "costs_all"           ON costs;
DROP POLICY IF EXISTS "mileage_logs_all"    ON mileage_logs;
DROP POLICY IF EXISTS "documents_all"       ON documents;

-- Lookup-Tabellen
DROP POLICY IF EXISTS "appointment_types_all" ON appointment_types;
DROP POLICY IF EXISTS "damage_types_all"      ON damage_types;
DROP POLICY IF EXISTS "cost_types_all"        ON cost_types;
DROP POLICY IF EXISTS "document_types_all"    ON document_types;

-- Führerscheinkontrolle
DROP POLICY IF EXISTS "license_settings_select" ON license_check_settings;
DROP POLICY IF EXISTS "license_settings_update" ON license_check_settings;
DROP POLICY IF EXISTS "license_inspectors_all"  ON license_check_inspectors;
DROP POLICY IF EXISTS "license_employees_all"   ON license_check_employees;
DROP POLICY IF EXISTS "license_checks_all"      ON license_checks;

-- UVV
DROP POLICY IF EXISTS "uvv_settings_select" ON uvv_settings;
DROP POLICY IF EXISTS "uvv_settings_update" ON uvv_settings;
DROP POLICY IF EXISTS "uvv_instructors_all" ON uvv_instructors;
DROP POLICY IF EXISTS "uvv_checks_all"      ON uvv_checks;

-- ============================================================================
-- Neue Policies: anon-Rolle (passt zum Supabase-Anon-Key der App)
-- ============================================================================

-- Fuhrpark: voller Zugriff über Anon-Key
CREATE POLICY "companies_all"        ON companies        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "vehicles_select"      ON vehicles         FOR SELECT TO anon USING (true);
CREATE POLICY "vehicles_insert"      ON vehicles         FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "vehicles_update"      ON vehicles         FOR UPDATE TO anon USING (true);
CREATE POLICY "vehicles_delete"      ON vehicles         FOR DELETE TO anon USING (true);
CREATE POLICY "drivers_all"          ON drivers          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "vehicle_drivers_all"  ON vehicle_drivers  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "appointments_all"     ON appointments     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "damages_all"          ON damages          FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "damage_images_all"    ON damage_images    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "costs_all"            ON costs            FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "mileage_logs_all"     ON mileage_logs     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "documents_all"        ON documents        FOR ALL TO anon USING (true) WITH CHECK (true);

-- Lookup-Tabellen
CREATE POLICY "appointment_types_all" ON appointment_types FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "damage_types_all"      ON damage_types      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "cost_types_all"        ON cost_types        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "document_types_all"    ON document_types    FOR ALL TO anon USING (true) WITH CHECK (true);

-- Führerscheinkontrolle
CREATE POLICY "license_settings_select" ON license_check_settings FOR SELECT TO anon USING (true);
CREATE POLICY "license_settings_update" ON license_check_settings FOR UPDATE TO anon USING (true);
CREATE POLICY "license_inspectors_all"  ON license_check_inspectors FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "license_employees_all"   ON license_check_employees  FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "license_checks_all"      ON license_checks           FOR ALL TO anon USING (true) WITH CHECK (true);

-- UVV
CREATE POLICY "uvv_settings_select" ON uvv_settings    FOR SELECT TO anon USING (true);
CREATE POLICY "uvv_settings_update" ON uvv_settings    FOR UPDATE TO anon USING (true);
CREATE POLICY "uvv_instructors_all" ON uvv_instructors FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "uvv_checks_all"      ON uvv_checks      FOR ALL TO anon USING (true) WITH CHECK (true);
