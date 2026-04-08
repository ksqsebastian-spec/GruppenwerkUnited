/**
 * Gemeinsame API-Schutzmechanismen für alle Routen.
 *
 * Enthält:
 * - validateOrigin()   — CSRF-Schutz via Origin/Referer-Prüfung
 * - getAllowedOrigins() — Erlaubte Ursprünge aus Env-Variablen
 *
 * Einzige Implementierung im Projekt.
 * Wird re-exportiert von lib/modules/{recruiting,affiliate}/auth.ts
 * für Rückwärtskompatibilität bestehender Imports.
 */

/**
 * Gibt alle erlaubten Ursprünge basierend auf den Umgebungsvariablen zurück.
 * Fällt auf localhost:3000 zurück wenn keine Env-Variablen gesetzt sind.
 */
export function getAllowedOrigins(): string[] {
  const origins: string[] = [];

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (appUrl) {
    origins.push(new URL(appUrl).origin);
  }

  // Vercel setzt VERCEL_URL automatisch für jedes Deployment (inkl. Previews)
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    origins.push(new URL(`https://${vercelUrl}`).origin);
  }

  if (origins.length === 0) {
    origins.push('http://localhost:3000');
  }

  return origins;
}

/**
 * Prüft den Ursprung einer Anfrage zum Schutz vor CSRF.
 * Gibt true zurück wenn der Ursprung erlaubt ist, false sonst.
 */
export function validateOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const allowed = getAllowedOrigins();

  // Same-Origin-Anfragen ohne Origin-Header (z.B. gleiche Seite) erlauben
  if (!origin && !referer) return true;

  if (origin) {
    return allowed.includes(origin);
  }

  if (referer) {
    try {
      return allowed.includes(new URL(referer).origin);
    } catch {
      return false;
    }
  }

  return false;
}
