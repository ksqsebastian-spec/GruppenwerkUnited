-- ============================================================================
-- Migration 017: Storage-Bucket anlegen und RLS-Policies für anon-Rolle setzen
--
-- PROBLEM: Der 'documents'-Bucket fehlt oder hat keine Policies für die
-- anon-Rolle. Die App nutzt den Supabase-Anon-Key → alle Storage-Operationen
-- laufen als anon, ohne passende Policy schlägt jeder Upload fehl.
--
-- LÖSUNG: Bucket anlegen (falls nicht vorhanden) und Policies setzen.
--
-- Ausführen im Supabase SQL-Editor
-- ============================================================================

-- Bucket anlegen (falls noch nicht vorhanden)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760,
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Bestehende Storage-Policies entfernen
DROP POLICY IF EXISTS "documents_storage_anon_select" ON storage.objects;
DROP POLICY IF EXISTS "documents_storage_anon_insert" ON storage.objects;
DROP POLICY IF EXISTS "documents_storage_anon_update" ON storage.objects;
DROP POLICY IF EXISTS "documents_storage_anon_delete" ON storage.objects;

-- Storage-Policies für anon-Rolle (passt zum Supabase-Anon-Key der App)
CREATE POLICY "documents_storage_anon_select"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'documents');

CREATE POLICY "documents_storage_anon_insert"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'documents');

CREATE POLICY "documents_storage_anon_update"
  ON storage.objects FOR UPDATE TO anon
  USING (bucket_id = 'documents');

CREATE POLICY "documents_storage_anon_delete"
  ON storage.objects FOR DELETE TO anon
  USING (bucket_id = 'documents');
