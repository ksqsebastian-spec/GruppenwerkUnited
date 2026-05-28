-- Security-Härtung Teil 3: Fuhrpark-/Führerschein-/UVV-/Datenkodierung-Tabellen
--
-- Voraussetzung erfüllt: Die zugehörigen Datenzugriffs-Module (lib/database/*)
-- wurden vom öffentlichen anon-Client auf den Service-Role-Admin-Client umgestellt
-- und werden ausschließlich serverseitig in app/api/** aufgerufen. Daher kann der
-- öffentliche anon/authenticated-Zugriff jetzt gefahrlos entzogen werden.
--
-- Bewusst NICHT enthalten: public.companies und public.automation_nodes —
-- diese werden noch direkt clientseitig über den anon-Client angesprochen.

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'vehicles','drivers','vehicle_drivers',
    'appointments','appointment_types',
    'costs','cost_types',
    'damages','damage_images','damage_types',
    'mileage_logs',
    'documents','document_types',
    'datenkodierungen',
    'license_check_settings','license_check_inspectors','license_check_employees','license_checks',
    'uvv_settings','uvv_instructors','uvv_checks'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated;', t);
  END LOOP;
END $$;
