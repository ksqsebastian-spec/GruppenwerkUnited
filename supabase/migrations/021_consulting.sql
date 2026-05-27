-- ═══════════════════════════════════════════════════════════════════════════
-- 021_consulting.sql – Consulting Dashboard Schema + Seed
-- CEO-Level Unternehmensübersicht für alle Gruppenwerk-Töchter
-- ═══════════════════════════════════════════════════════════════════════════

-- ── Tabellenstruktur ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS consulting_companies (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  color       TEXT,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consulting_categories (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT        NOT NULL,
  slug        TEXT        NOT NULL UNIQUE,
  icon        TEXT,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consulting_checkpoints (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID        NOT NULL REFERENCES consulting_categories(id) ON DELETE CASCADE,
  label       TEXT        NOT NULL,
  description TEXT,
  is_default  BOOLEAN     NOT NULL DEFAULT true,
  sort_order  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consulting_checkpoint_status (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID        NOT NULL REFERENCES consulting_companies(id) ON DELETE CASCADE,
  checkpoint_id  UUID        NOT NULL REFERENCES consulting_checkpoints(id) ON DELETE CASCADE,
  status         TEXT        NOT NULL DEFAULT 'red' CHECK (status IN ('green', 'orange', 'red')),
  notes          TEXT,
  responsible    TEXT,
  cost_monthly   DECIMAL(10,2),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by     TEXT,
  UNIQUE(company_id, checkpoint_id)
);

CREATE TABLE IF NOT EXISTS consulting_audit_log (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id     UUID        REFERENCES consulting_companies(id) ON DELETE SET NULL,
  checkpoint_id  UUID        REFERENCES consulting_checkpoints(id) ON DELETE SET NULL,
  old_status     TEXT,
  new_status     TEXT,
  changed_by     TEXT,
  changed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  note           TEXT
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_consulting_checkpoints_category
  ON consulting_checkpoints (category_id);
CREATE INDEX IF NOT EXISTS idx_consulting_status_company
  ON consulting_checkpoint_status (company_id);
CREATE INDEX IF NOT EXISTS idx_consulting_status_checkpoint
  ON consulting_checkpoint_status (checkpoint_id);
CREATE INDEX IF NOT EXISTS idx_consulting_audit_company
  ON consulting_audit_log (company_id, changed_at DESC);

-- Auto-Update Trigger für updated_at
CREATE OR REPLACE FUNCTION consulting_update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_consulting_companies_updated_at ON consulting_companies;
CREATE TRIGGER trg_consulting_companies_updated_at
  BEFORE UPDATE ON consulting_companies
  FOR EACH ROW EXECUTE FUNCTION consulting_update_updated_at();

DROP TRIGGER IF EXISTS trg_consulting_checkpoint_status_updated_at ON consulting_checkpoint_status;
CREATE TRIGGER trg_consulting_checkpoint_status_updated_at
  BEFORE UPDATE ON consulting_checkpoint_status
  FOR EACH ROW EXECUTE FUNCTION consulting_update_updated_at();

-- ── Seed: Unternehmen ─────────────────────────────────────────────────────────

INSERT INTO consulting_companies (name, slug, color, sort_order) VALUES
  ('Maler Hantke',      'maler-hantke',      '#E63946', 1),
  ('Tischlerei Brink',  'tischlerei-brink',  '#F4A261', 2),
  ('Seehafer Elemente', 'seehafer-elemente', '#2A9D8F', 3),
  ('Werner Gerüstbau',  'werner-geruestbau', '#264653', 4),
  ('Werner Bau',        'werner-bau',        '#3B82F6', 5),
  ('Tischlerei Mehlig', 'tischlerei-mehlig', '#8B5CF6', 6),
  ('GroundPassion',     'groundpassion',     '#10B981', 7),
  ('Gruppenwerk BSI',   'gruppenwerk-bsi',   '#6B7280', 8)
ON CONFLICT (slug) DO NOTHING;

-- ── Seed: Kategorien & Checkpoints ───────────────────────────────────────────

DO $$
DECLARE
  cat_id UUID;
BEGIN

  -- 1. Digital Presence
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Digital Presence', 'digital-presence', '🌐', 1)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'digital-presence'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Website live & aktuell', 1),
    (cat_id, 'Google Business Profil eingerichtet', 2),
    (cat_id, 'Instagram Profil aktiv', 3),
    (cat_id, 'Facebook/Meta Profil aktiv', 4),
    (cat_id, 'TikTok Profil aktiv', 5),
    (cat_id, 'LinkedIn Profil aktiv', 6),
    (cat_id, 'Bewertungsportale eingetragen (ProvenExpert etc.)', 7),
    (cat_id, 'Branchenverzeichnisse eingetragen', 8)
  ON CONFLICT DO NOTHING;

  -- 2. Advertising
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Advertising', 'advertising', '📣', 2)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'advertising'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Google Ads aktiv', 1),
    (cat_id, 'Instagram Ads aktiv', 2),
    (cat_id, 'Meta Ads aktiv', 3),
    (cat_id, 'TikTok Ads aktiv', 4),
    (cat_id, 'Monatsbudget definiert', 5),
    (cat_id, 'Conversion Tracking aktiv', 6),
    (cat_id, 'Negative Keywords gepflegt', 7)
  ON CONFLICT DO NOTHING;

  -- 3. Website Health
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Website Health', 'website-health', '🔒', 3)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'website-health'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'SSL aktiv & gültig', 1),
    (cat_id, 'Impressum korrekt', 2),
    (cat_id, 'Datenschutzerklärung aktuell', 3),
    (cat_id, 'Cookie Banner DSGVO-konform', 4),
    (cat_id, 'Mobile-optimiert', 5),
    (cat_id, 'Ladezeit unter 3 Sekunden', 6),
    (cat_id, 'Google Search Console verknüpft', 7),
    (cat_id, 'Google Analytics verknüpft', 8)
  ON CONFLICT DO NOTHING;

  -- 4. Software & Lizenzen
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Software & Lizenzen', 'software-lizenzen', '💿', 4)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'software-lizenzen'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Alle Lizenzen dokumentiert', 1),
    (cat_id, 'Keine ungenutzten Lizenzen', 2),
    (cat_id, 'Kosten pro Monat erfasst', 3),
    (cat_id, 'Vertragslaufzeiten dokumentiert', 4),
    (cat_id, 'Kündigungsfristen erfasst', 5),
    (cat_id, 'Keine Doppellizenzen', 6)
  ON CONFLICT DO NOTHING;

  -- 5. Kommunikation & Erreichbarkeit
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Kommunikation & Erreichbarkeit', 'kommunikation', '📞', 5)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'kommunikation'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Firmen-Email auf eigener Domain', 1),
    (cat_id, 'Telefonnummer überall korrekt eingetragen', 2),
    (cat_id, 'WhatsApp Business eingerichtet', 3),
    (cat_id, 'Öffnungszeiten überall konsistent', 4),
    (cat_id, 'Kontaktformular funktioniert', 5)
  ON CONFLICT DO NOTHING;

  -- 6. Finanzen & Verträge
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Finanzen & Verträge', 'finanzen-vertraege', '💶', 6)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'finanzen-vertraege'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Monatliche IT-Kosten erfasst', 1),
    (cat_id, 'Hosting/Domain bezahlt & dokumentiert', 2),
    (cat_id, 'Alle Dienstleisterverträge abgelegt', 3),
    (cat_id, 'AV-Verträge mit allen Dienstleistern', 4)
  ON CONFLICT DO NOTHING;

  -- 7. Sicherheit & Zugänge
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Sicherheit & Zugänge', 'sicherheit-zugaenge', '🔐', 7)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'sicherheit-zugaenge'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Passwortmanager im Einsatz', 1),
    (cat_id, 'Alle Zugänge dokumentiert', 2),
    (cat_id, 'Verantwortlicher pro Tool definiert', 3),
    (cat_id, '2FA aktiviert wo möglich', 4),
    (cat_id, 'Backup-Strategie vorhanden', 5)
  ON CONFLICT DO NOTHING;

  -- 8. HR & Recruiting
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('HR & Recruiting', 'hr-recruiting', '👥', 8)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'hr-recruiting'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Karriereseite vorhanden', 1),
    (cat_id, 'Jobportale aktiv (Indeed, Stepstone)', 2),
    (cat_id, 'Recruiting Ads aktiv', 3),
    (cat_id, 'Arbeitgeberbewertung (Kununu) gepflegt', 4)
  ON CONFLICT DO NOTHING;

  -- 9. B2B & Vertrieb
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('B2B & Vertrieb', 'b2b-vertrieb', '🤝', 9)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'b2b-vertrieb'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Lead-Pipeline definiert', 1),
    (cat_id, 'CRM im Einsatz', 2),
    (cat_id, 'B2B Verantwortlicher benannt', 3),
    (cat_id, 'Outreach-Kanal definiert', 4)
  ON CONFLICT DO NOTHING;

  -- 10. Compliance & Recht
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Compliance & Recht', 'compliance-recht', '⚖️', 10)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'compliance-recht'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'DSGVO vollständig umgesetzt', 1),
    (cat_id, 'KI-Nutzungsrichtlinie vorhanden', 2),
    (cat_id, 'Mitarbeiter geschult', 3),
    (cat_id, 'Löschkonzept vorhanden', 4)
  ON CONFLICT DO NOTHING;

  -- 11. AI & Automation
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('AI & Automation', 'ai-automation', '🤖', 11)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'ai-automation'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'KI-Nutzungsrichtlinie vorhanden', 1),
    (cat_id, 'Mitarbeiter KI-geschult', 2),
    (cat_id, 'KI-Tools dokumentiert (welche, wofür)', 3),
    (cat_id, 'Prompt-Templates vorhanden', 4),
    (cat_id, 'Automatisierungen dokumentiert (n8n, Zapier)', 5),
    (cat_id, 'AI-Kosten pro Monat erfasst', 6)
  ON CONFLICT DO NOTHING;

  -- 12. Hardware & Geräte
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Hardware & Geräte', 'hardware-geraete', '💻', 12)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'hardware-geraete'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Alle Geräte inventarisiert', 1),
    (cat_id, 'Gerätezuordnung pro Mitarbeiter', 2),
    (cat_id, 'Alter der Geräte dokumentiert', 3),
    (cat_id, 'Ersatzbeschaffungsplan vorhanden', 4),
    (cat_id, 'Mobilgeräte erfasst', 5),
    (cat_id, 'Drucker/Scanner dokumentiert', 6)
  ON CONFLICT DO NOTHING;

  -- 13. Telefonie & Mobilfunk
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Telefonie & Mobilfunk', 'telefonie', '📱', 13)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'telefonie'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Mobilfunkverträge dokumentiert', 1),
    (cat_id, 'Kosten pro Vertrag erfasst', 2),
    (cat_id, 'Festnetz/VoIP Anbieter dokumentiert', 3),
    (cat_id, 'Rufnummern zentral abgelegt', 4)
  ON CONFLICT DO NOTHING;

  -- 14. Fuhrpark
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Fuhrpark', 'fuhrpark', '🚛', 14)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'fuhrpark'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Fahrzeuge inventarisiert', 1),
    (cat_id, 'Leasingverträge dokumentiert', 2),
    (cat_id, 'HU/AU Termine erfasst', 3),
    (cat_id, 'Tankkarten zugeordnet', 4),
    (cat_id, 'Versicherungen pro Fahrzeug', 5),
    (cat_id, 'GPS/Telematik im Einsatz', 6)
  ON CONFLICT DO NOTHING;

  -- 15. Buchhaltung & Steuer
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Buchhaltung & Steuer', 'buchhaltung', '🧾', 15)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'buchhaltung'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Steuerberater zugeordnet', 1),
    (cat_id, 'DATEV-Schnittstelle aktiv', 2),
    (cat_id, 'Rechnungssoftware im Einsatz', 3),
    (cat_id, 'E-Rechnung XRechnung-fähig', 4),
    (cat_id, 'Mahnwesen definiert', 5),
    (cat_id, 'Offene Posten unter Kontrolle', 6)
  ON CONFLICT DO NOTHING;

  -- 16. Mitarbeiter & Onboarding
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Mitarbeiter & Onboarding', 'mitarbeiter-onboarding', '🧑‍💼', 16)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'mitarbeiter-onboarding'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Onboarding-Prozess dokumentiert', 1),
    (cat_id, 'Zugänge bei Austritt gesperrt', 2),
    (cat_id, 'Schulungsplan vorhanden', 3),
    (cat_id, 'Arbeitsverträge digital abgelegt', 4),
    (cat_id, 'Krankmeldungsprozess digital', 5),
    (cat_id, 'Urlaubsplanung digital', 6)
  ON CONFLICT DO NOTHING;

  -- 17. Baustellenmanagement
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Baustellenmanagement', 'baustellenmanagement', '🏗️', 17)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'baustellenmanagement'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Zeiterfassung digital', 1),
    (cat_id, 'Einsatzplanung digital', 2),
    (cat_id, 'Baustellendokumentation digital', 3),
    (cat_id, 'Aufmaß digital', 4),
    (cat_id, 'Mängelverfolgung digital', 5),
    (cat_id, 'Abnahmeprotokolle digital', 6)
  ON CONFLICT DO NOTHING;

  -- 18. Kundenmanagement
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Kundenmanagement', 'kundenmanagement', '👤', 18)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'kundenmanagement'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Kundendatenbank gepflegt', 1),
    (cat_id, 'Kontakthistorie dokumentiert', 2),
    (cat_id, 'Reklamationsprozess definiert', 3),
    (cat_id, 'Kundenfeedback wird eingeholt', 4),
    (cat_id, 'Stammkundenbetreuung definiert', 5)
  ON CONFLICT DO NOTHING;

  -- 19. Qualität & Zertifizierungen
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Qualität & Zertifizierungen', 'qualitaet', '🏅', 19)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'qualitaet'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Meisterbrief / Zulassungen aktuell', 1),
    (cat_id, 'Handwerkskammer Eintragung aktuell', 2),
    (cat_id, 'Zertifizierungen dokumentiert', 3),
    (cat_id, 'Lieferanten-Qualifikation geprüft', 4),
    (cat_id, 'Gewährleistungsfristen getrackt', 5)
  ON CONFLICT DO NOTHING;

  -- 20. Marke & Außenauftritt
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Marke & Außenauftritt', 'marke', '🎨', 20)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'marke'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Logo in allen Formaten vorhanden', 1),
    (cat_id, 'Corporate Design Guideline vorhanden', 2),
    (cat_id, 'Visitenkarten aktuell', 3),
    (cat_id, 'Fahrzeugbeschriftung aktuell', 4),
    (cat_id, 'Arbeitskleidung einheitlich', 5),
    (cat_id, 'E-Mail-Signatur einheitlich', 6),
    (cat_id, 'Briefpapier/Vorlagen aktuell', 7),
    (cat_id, 'Professionelles Fotomaterial vorhanden', 8)
  ON CONFLICT DO NOTHING;

  -- 21. Reputation & Bewertungen
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Reputation & Bewertungen', 'reputation', '⭐', 21)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'reputation'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Google Bewertungen über 4.0', 1),
    (cat_id, 'Bewertungsanzahl steigend', 2),
    (cat_id, 'Negative Bewertungen beantwortet', 3),
    (cat_id, 'Bewertungsstrategie vorhanden', 4),
    (cat_id, 'Kununu Score akzeptabel', 5),
    (cat_id, 'Referenzprojekte online dokumentiert', 6)
  ON CONFLICT DO NOTHING;

  -- 22. Content & SEO
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Content & SEO', 'content-seo', '📝', 22)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'content-seo'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Blog / Neuigkeiten aktiv', 1),
    (cat_id, 'Letzte Aktualisierung unter 3 Monaten', 2),
    (cat_id, 'Lokale SEO optimiert', 3),
    (cat_id, 'Bilder mit Alt-Tags', 4),
    (cat_id, 'Meta-Descriptions gepflegt', 5),
    (cat_id, 'Kern-Keywords Ranking getrackt', 6)
  ON CONFLICT DO NOTHING;

  -- 23. Vertragsmanagement
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Vertragsmanagement', 'vertragsmanagement', '📋', 23)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'vertragsmanagement'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Alle Verträge zentral abgelegt', 1),
    (cat_id, 'Kündigungsfristen kalendarisiert', 2),
    (cat_id, 'Erinnerungen vor Verlängerung aktiv', 3),
    (cat_id, 'Kein Vertrag älter als 24 Monate ungeprüft', 4),
    (cat_id, 'Rahmenverträge dokumentiert', 5),
    (cat_id, 'Nachunternehmerverträge aktuell', 6)
  ON CONFLICT DO NOTHING;

  -- 24. Preise & Kalkulation
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Preise & Kalkulation', 'preise-kalkulation', '🧮', 24)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'preise-kalkulation'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Stundenverrechnungssätze aktuell', 1),
    (cat_id, 'Materialpreislisten aktuell', 2),
    (cat_id, 'Kalkulationsschema dokumentiert', 3),
    (cat_id, 'Nachkalkulation wird durchgeführt', 4),
    (cat_id, 'Margen pro Projekt getrackt', 5)
  ON CONFLICT DO NOTHING;

  -- 25. Lager & Material
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Lager & Material', 'lager-material', '📦', 25)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'lager-material'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Lagerbestand erfasst', 1),
    (cat_id, 'Mindestbestände definiert', 2),
    (cat_id, 'Bestellprozess dokumentiert', 3),
    (cat_id, 'Lieferantenverzeichnis aktuell', 4),
    (cat_id, 'Retouren/Reklamationen getrackt', 5)
  ON CONFLICT DO NOTHING;

  -- 26. Arbeitsschutz & Sicherheit
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Arbeitsschutz & Sicherheit', 'arbeitsschutz', '🦺', 26)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'arbeitsschutz'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Gefährdungsbeurteilungen aktuell', 1),
    (cat_id, 'Unterweisungen dokumentiert & terminiert', 2),
    (cat_id, 'PSA vorhanden & dokumentiert', 3),
    (cat_id, 'Erste-Hilfe-Ausstattung geprüft', 4),
    (cat_id, 'Sicherheitsbeauftragter benannt', 5),
    (cat_id, 'Betriebsarzt zugeordnet', 6),
    (cat_id, 'Unfallstatistik geführt', 7)
  ON CONFLICT DO NOTHING;

  -- 27. Partnernetzwerk
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Partnernetzwerk', 'partnernetzwerk', '🔗', 27)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'partnernetzwerk'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Nachunternehmer-Pool dokumentiert', 1),
    (cat_id, 'Bewertung der Nachunternehmer', 2),
    (cat_id, 'Notfall-Kontakte für alle Gewerke', 3),
    (cat_id, 'Kooperationspartner gepflegt', 4)
  ON CONFLICT DO NOTHING;

  -- 28. Liquidität & Cashflow
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Liquidität & Cashflow', 'liquiditaet', '💰', 28)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'liquiditaet'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Zahlungsziele eingehalten', 1),
    (cat_id, 'Forderungslaufzeit unter 30 Tage', 2),
    (cat_id, 'Skonto wird genutzt', 3),
    (cat_id, 'Bürgschaften/Kautionen dokumentiert', 4),
    (cat_id, 'Kreditlinien dokumentiert', 5)
  ON CONFLICT DO NOTHING;

  -- 29. Projektdokumentation
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Projektdokumentation', 'projektdokumentation', '📁', 29)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'projektdokumentation'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Fotodoku pro Projekt vorhanden', 1),
    (cat_id, 'Abnahmeprotokolle archiviert', 2),
    (cat_id, 'Gewährleistungsfristen getrackt', 3),
    (cat_id, 'Mängelmanagement nachverfolgbar', 4),
    (cat_id, 'Auftragsbestätigungen vollständig', 5)
  ON CONFLICT DO NOTHING;

  -- 30. Versicherungen
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Versicherungen', 'versicherungen', '🛡️', 30)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'versicherungen'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Betriebshaftpflicht aktiv', 1),
    (cat_id, 'Cyber-Versicherung vorhanden', 2),
    (cat_id, 'Elektronikversicherung aktiv', 3),
    (cat_id, 'Rechtsschutz vorhanden', 4)
  ON CONFLICT DO NOTHING;

  -- 31. Datensicherung & IT-Sicherheit
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Datensicherung & IT-Sicherheit', 'datensicherung', '🗄️', 31)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'datensicherung'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Backup-Rhythmus definiert', 1),
    (cat_id, 'Backup getestet', 2),
    (cat_id, 'Firewall/Virenschutz aktiv', 3),
    (cat_id, 'VPN im Einsatz', 4),
    (cat_id, 'Notfallplan IT-Ausfall vorhanden', 5),
    (cat_id, 'Admin-Zugänge auf Minimum', 6)
  ON CONFLICT DO NOTHING;

  -- 32. Nachhaltigkeit & ESG
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Nachhaltigkeit & ESG', 'nachhaltigkeit', '♻️', 32)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'nachhaltigkeit'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Abfalltrennung dokumentiert', 1),
    (cat_id, 'Entsorgungsnachweise abgelegt', 2),
    (cat_id, 'CO2-Fußabdruck erfasst', 3),
    (cat_id, 'Sozialstandards dokumentiert', 4)
  ON CONFLICT DO NOTHING;

  -- 33. Öffentliche Vergabe / VOB
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Öffentliche Vergabe / VOB', 'oeffentliche-vergabe', '🏛️', 33)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'oeffentliche-vergabe'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Präqualifikation aktiv (PQ-Verein)', 1),
    (cat_id, 'Referenznachweise aktuell', 2),
    (cat_id, 'Eignungsnachweise abgelegt', 3),
    (cat_id, 'Bieterportale registriert', 4),
    (cat_id, 'VOB-Monitoring aktiv', 5)
  ON CONFLICT DO NOTHING;

  -- 34. Kundenkommunikation
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Kundenkommunikation', 'kundenkommunikation', '💬', 34)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'kundenkommunikation'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Angebote innerhalb 48h', 1),
    (cat_id, 'Auftragsbestätigung wird versendet', 2),
    (cat_id, 'Baustellenupdates an Kunden regelmäßig', 3),
    (cat_id, 'Nachbetreuung nach Projektabschluss', 4),
    (cat_id, 'Reklamationszeit unter 48h Reaktion', 5)
  ON CONFLICT DO NOTHING;

  -- 35. Digitaler Reifegrad
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Digitaler Reifegrad', 'digitaler-reifegrad', '📊', 35)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'digitaler-reifegrad'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Papierloser Rechnungseingang', 1),
    (cat_id, 'Digitale Unterschriften im Einsatz', 2),
    (cat_id, 'Cloud-first (kein lokaler Server)', 3),
    (cat_id, 'API-Integrationen zwischen Tools', 4),
    (cat_id, 'Automatisierte Workflows vorhanden', 5),
    (cat_id, 'Mitarbeiter Digital-Kompetenz bewertet', 6)
  ON CONFLICT DO NOTHING;

  -- 36. Wettbewerb & Markt
  INSERT INTO consulting_categories (name, slug, icon, sort_order) VALUES ('Wettbewerb & Markt', 'wettbewerb-markt', '🎯', 36)
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name RETURNING id INTO cat_id;
  IF cat_id IS NULL THEN SELECT id INTO cat_id FROM consulting_categories WHERE slug = 'wettbewerb-markt'; END IF;
  INSERT INTO consulting_checkpoints (category_id, label, sort_order) VALUES
    (cat_id, 'Wettbewerber identifiziert & beobachtet', 1),
    (cat_id, 'Preisniveau im Markt bekannt', 2),
    (cat_id, 'USP klar formuliert', 3),
    (cat_id, 'Marktpositionierung dokumentiert', 4)
  ON CONFLICT DO NOTHING;

END;
$$;

-- ── Seed: Status-Zeilen (alle Firmen × alle Default-Checkpoints = 'red') ──────

DO $$
DECLARE
  comp RECORD;
  chk  RECORD;
BEGIN
  FOR comp IN SELECT id FROM consulting_companies LOOP
    FOR chk IN SELECT id FROM consulting_checkpoints WHERE is_default = true LOOP
      INSERT INTO consulting_checkpoint_status (company_id, checkpoint_id, status)
      VALUES (comp.id, chk.id, 'red')
      ON CONFLICT (company_id, checkpoint_id) DO NOTHING;
    END LOOP;
  END LOOP;
END;
$$;
