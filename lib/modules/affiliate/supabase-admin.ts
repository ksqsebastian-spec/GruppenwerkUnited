import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Erstellt einen Supabase-Client mit Service Role Key für Affiliate-Admin-Operationen.
 * Umgeht RLS – NUR serverseitig in API-Routen verwenden.
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase Umgebungsvariablen für Admin-Client fehlen');
  }
  return createClient(url, key);
}
