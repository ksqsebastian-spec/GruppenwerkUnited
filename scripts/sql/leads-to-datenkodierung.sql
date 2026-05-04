-- ============================================================
-- Leads → Datenkodierung Bulk-Export
-- Alle Leads einer Firma als Datenkodierung-Einträge speichern
-- mit dem Tag 'CRM-Lead' als Kennzeichnung.
--
-- Vor dem Ausführen: company-Wert in der WHERE-Klausel anpassen.
-- Kann mehrfach ausgeführt werden (ON CONFLICT DO NOTHING).
-- ============================================================

INSERT INTO datenkodierungen (code, name, adresse, notizen, tags, company)
SELECT
  -- GW-XXXX-XXXX Code deterministisch aus Lead-ID generiert
  'GW-'
    || upper(substring(md5(l.id::text || '-a'), 1, 4))
    || '-'
    || upper(substring(md5(l.id::text || '-b'), 1, 4))   AS code,

  -- Name: Vor + Nachname, Fallback auf Firma
  COALESCE(
    NULLIF(TRIM(COALESCE(l.vorname, '') || ' ' || COALESCE(l.nachname, '')), ''),
    l.firma,
    'Unbekannt'
  ) AS name,

  -- Adresse: Kontaktdaten zeilengetrennt
  NULLIF(TRIM(
    COALESCE(l.firma        || E'\n', '') ||
    COALESCE(l.position     || E'\n', '') ||
    COALESCE(l.email        || E'\n', '') ||
    COALESCE(l.telefon      || E'\n', '') ||
    COALESCE(
      NULLIF(
        TRIM(
          COALESCE(l.stadt, '') ||
          CASE WHEN l.land IS NOT NULL THEN ', ' || l.land ELSE '' END
        ),
        ''
      ),
      ''
    )
  ), '') AS adresse,

  -- Notizen unverändert übernehmen
  l.notizen,

  -- Bestehende Tags + 'CRM-Lead'
  (SELECT array_agg(DISTINCT tag ORDER BY tag)
   FROM unnest(l.tags || ARRAY['CRM-Lead']) AS tag) AS tags,

  l.company

FROM leads l
WHERE l.company = 'seehafer-elemente'   -- ← hier ggf. anpassen
ON CONFLICT (code) DO NOTHING;
