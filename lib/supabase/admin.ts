import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Erstellt einen Supabase-Client mit Service Role Key.
 * Umgeht Row Level Security – NUR serverseitig in API-Routen verwenden.
 *
 * Einzige Quelle für Admin-Clients im gesamten Projekt.
 * Importiert von: lib/modules/recruiting/, lib/modules/affiliate/, lib/audit.ts
 */
export function createAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Supabase Umgebungsvariablen für Admin-Client fehlen');
  }
  return createClient(url, key);
}
