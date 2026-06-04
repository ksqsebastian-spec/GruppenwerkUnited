-- Eindeutiger Index auf (company, email) für leads.
-- Der CSV-Import (app/api/leads/import) nutzt upsert mit
-- onConflict: 'company,email' — dafür ist dieser Index zwingend nötig.
-- NULL-E-Mails gelten in Postgres als verschieden, daher sind mehrere
-- Leads ohne E-Mail je Firma weiterhin erlaubt.
CREATE UNIQUE INDEX IF NOT EXISTS leads_company_email_key
  ON public.leads (company, email);
