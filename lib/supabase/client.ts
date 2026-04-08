import { createBrowserClient } from '@supabase/ssr';

/**
 * Erstellt einen Supabase-Client für Browser-Komponenten.
 * Verwendet Platzhalter-Werte wenn Umgebungsvariablen nicht konfiguriert sind (z.B. beim Build).
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'
  );
}

// Singleton für Client-Komponenten
export const supabase = createClient();
