-- Security-Härtung: öffentlichen anon-Zugriff auf serverseitig bediente Tabellen entziehen
--
-- Hintergrund: Der anon-Key (NEXT_PUBLIC_*) liegt im Browser offen. Bisher durften
-- anon/authenticated per GRANT + permissiver RLS-Policy alle Tabellen lesen/schreiben.
-- Diese Module laufen ausschließlich serverseitig über den Service-Role-Client
-- (createAdminClient, umgeht RLS). Daher kann anon/authenticated hier gefahrlos
-- entzogen werden — die App funktioniert über service_role unverändert weiter.
--
-- NICHT enthalten: fuhrpark-/datenkodierung-/automationen-/companies-Tabellen,
-- die aktuell noch direkt über den anon-Client angesprochen werden. Diese werden
-- erst nach Umstellung auf den Service-Role-Client gesperrt (separater Schritt).

-- ── Consulting: RLS war komplett deaktiviert → aktivieren + anon entziehen ──────
ALTER TABLE public.consulting_companies        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_categories       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_checkpoints      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_checkpoint_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_audit_log        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_field_types      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_credentials      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_contacts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_company_images   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_company_socials  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consulting_company_software ENABLE ROW LEVEL SECURITY;

-- ── anon/authenticated von allen serverseitig bedienten Tabellen entziehen ──────
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'app_settings','audit_log',
    'consulting_companies','consulting_categories','consulting_checkpoints',
    'consulting_checkpoint_status','consulting_audit_log','consulting_field_types',
    'consulting_credentials','consulting_contacts','consulting_company_images',
    'consulting_company_socials','consulting_company_software',
    'leads','lead_kommentare','lead_dateien',
    'tickets','personen','ticket_dateien',
    'handwerker','stellen','empfehlungen'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon, authenticated;', t);
  END LOOP;
END $$;

-- ── VOB-Schema: Tabellen und SECURITY-DEFINER-Views vor anon schützen ──────────
REVOKE ALL ON TABLE vob.companies   FROM anon, authenticated;
REVOKE ALL ON TABLE vob.vob_matches FROM anon, authenticated;
REVOKE ALL ON TABLE vob.vob_scans   FROM anon, authenticated;
REVOKE ALL ON TABLE vob.vob_tenders FROM anon, authenticated;
REVOKE ALL ON vob.company_trends      FROM anon, authenticated;
REVOKE ALL ON vob.vob_dashboard       FROM anon, authenticated;
REVOKE ALL ON vob.company_weekly_stats FROM anon, authenticated;

-- ── SECURITY-DEFINER-Funktion nicht öffentlich aufrufbar machen ────────────────
REVOKE ALL ON FUNCTION public.set_empfehlung_company() FROM anon, authenticated;

-- ── Funktions-search_path fixieren (verhindert search_path-Hijacking) ──────────
ALTER FUNCTION public.update_updated_at_column()            SET search_path = public;
ALTER FUNCTION public.consulting_update_updated_at()        SET search_path = public;
ALTER FUNCTION public.update_uvv_settings_updated_at()      SET search_path = public;
ALTER FUNCTION public.update_vehicle_mileage_from_cost()    SET search_path = public;
ALTER FUNCTION public.set_empfehlung_company()              SET search_path = public;
