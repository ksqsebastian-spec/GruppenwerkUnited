-- Security-Härtung Teil 2 (Ergänzung zu 031)

-- set_empfehlung_company ist SECURITY DEFINER und war über den Default-PUBLIC-Grant
-- weiterhin via /rest/v1/rpc aufrufbar. Öffentlichen Aufruf vollständig entziehen
-- (die Funktion läuft als Trigger weiter, dafür ist kein EXECUTE-Grant nötig).
REVOKE ALL ON FUNCTION public.set_empfehlung_company() FROM PUBLIC;

-- Verbliebene Funktion mit veränderlichem search_path fixieren.
ALTER FUNCTION vob.update_updated_at() SET search_path = vob, public;
