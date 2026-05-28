-- Security-Härtung Teil 4: companies + automation_nodes
--
-- Voraussetzung erfüllt: Die zugehörigen Datenzugriffs-Module
--   - lib/database/companies.ts
--   - lib/automationen/queries.ts
-- wurden vom öffentlichen anon-Client auf den Service-Role-Admin-Client
-- umgestellt und werden ausschließlich serverseitig in app/api/** aufgerufen
-- (companies via /api/fuhrpark/companies + lib/auth/fuhrpark-scope,
--  automation_nodes via /api/automationen). Der verwaiste clientseitige Hook
-- use-fuhrpark-company wurde entfernt. Damit kann der öffentliche
-- anon/authenticated-Zugriff jetzt gefahrlos entzogen werden.
--
-- WICHTIG: Diese Migration erst anwenden, NACHDEM der neue Code in Production
-- live ist (Vercel-Deploy READY). Vorher würde die App brechen.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'companies',
    'automation_nodes'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated;', t);
  END LOOP;
END $$;
