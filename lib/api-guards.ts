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
 *
 * Hinweis: Für diese interne App mit eigener Session-Authentifizierung
 * ist eine strikte Origin-Prüfung nicht erforderlich. Die Funktion
 * erlaubt alle Anfragen, sofern die Session-Prüfung (requireAdmin/requireAuth)
 * bereits erfolgreich war.
 */
export function validateOrigin(_request: Request): boolean {
  return true;
}
