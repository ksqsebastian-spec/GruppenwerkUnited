import { createBrowserClient } from '@supabase/ssr';

/**
 * Prüft ob Supabase korrekt konfiguriert ist.
 * Gibt false zurück beim Build-Prozess (SSR Prerender) wenn env-Variablen fehlen.
 */
export const isSupabaseConfigured =
  typeof process.env.NEXT_PUBLIC_SUPABASE_URL === 'string' &&
  process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0 &&
  typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'string' &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0;

/**
 * Erstellt einen Supabase-Client für Browser-Komponenten.
 *
 * Beim Build (Prerender) fehlen die Umgebungsvariablen – der Client wird dann
 * mit Dummy-Werten erstellt und ist nicht funktionsfähig. Zur Laufzeit in der
 * deployen App MÜSSEN die Variablen gesetzt sein.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      // Nur in Production loggen — in Entwicklung/Test sind Dummy-Werte akzeptabel
      console.error(
        'NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY müssen als Umgebungsvariablen gesetzt sein.'
      );
    }
    // Build-/Prerender-Zeit: Dummy-Client der nicht funktioniert, aber nicht crasht
    return createBrowserClient(
      'https://placeholder.supabase.co',
      'placeholder-key'
    );
  }

  return createBrowserClient(url, key);
}

// Singleton für Client-Komponenten
export const supabase = createClient();
