-- 013_roi_rls_fix.sql
-- Kritischer Fix: ROI-Tabellen-Policies von "TO authenticated" auf "TO anon" umstellen.
-- Die App verwendet den Anon-Key für alle Browser-Abfragen (kein Supabase Auth).
-- auth.uid() ist immer NULL → "TO authenticated"-Policies blockieren alle Anon-Anfragen.

-- Alte Policies löschen
DROP POLICY IF EXISTS "roi_jobs_all"      ON roi.jobs;
DROP POLICY IF EXISTS "roi_config_all"    ON roi.config;
DROP POLICY IF EXISTS "roi_uploads_all"   ON roi.uploads;
DROP POLICY IF EXISTS "roi_purchases_all" ON roi.purchases;

-- Neue Policies für anon-Rolle
CREATE POLICY "roi_jobs_all"
  ON roi.jobs FOR ALL TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "roi_config_all"
  ON roi.config FOR ALL TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "roi_uploads_all"
  ON roi.uploads FOR ALL TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "roi_purchases_all"
  ON roi.purchases FOR ALL TO anon
  USING (true) WITH CHECK (true);

-- Schema-Zugriff für PostgREST (.schema('roi') Aufrufe vom Browser)
GRANT USAGE ON SCHEMA roi TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES    IN SCHEMA roi TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA roi TO anon, authenticated;
