import { createBrowserClient } from '@supabase/ssr';

/**
 * Erstellt einen Supabase-Client für Browser-Komponenten
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Singleton für Client-Komponenten
export const supabase = createClient();
