/**
 * Verteiltes Rate-Limiting über das Cloudflare-`ratelimit`-Binding.
 *
 * Grund: Der In-Memory-Limiter (lib/rate-limit.ts) zählt pro Worker-Isolate und
 * ist auf Cloudflare Workers praktisch wirkungslos. Dieses Binding limitiert
 * dagegen verteilt am Edge (kostenlos, period 10/60 s → Burst-Schutz).
 *
 * Robust by design: Ist das Binding nicht verfügbar (lokale Entwicklung, Tests,
 * Nicht-Workers-Umgebung) oder tritt ein Fehler auf, wird die Anfrage NICHT
 * blockiert — Infrastruktur-Probleme dürfen keine legitimen Nutzer aussperren.
 * Die nachhaltige Durchsetzung übernimmt zusätzlich eine WAF-Rate-Limiting-Regel.
 */

/** Minimales Interface des Cloudflare-Rate-Limit-Bindings. */
interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

/** In wrangler.jsonc definierte Rate-Limiter (namespace_id → Name). */
type LimiterName = 'LOGIN_RATE_LIMITER' | 'PUBLIC_RATE_LIMITER';

/**
 * Prüft ein Rate-Limit am Edge. Gibt `true` zurück, wenn die Anfrage erlaubt ist
 * (inklusive aller Fälle, in denen das Binding fehlt/fehlschlägt).
 */
export async function edgeRateLimit(limiter: LimiterName, key: string): Promise<boolean> {
  try {
    // Dynamischer Import: nur zur Laufzeit auf Workers vorhanden.
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const { env } = getCloudflareContext();
    const binding = (env as unknown as Record<string, RateLimitBinding | undefined>)[limiter];
    if (!binding) return true;
    const { success } = await binding.limit({ key });
    return success;
  } catch {
    // Binding nicht verfügbar (Dev/Test) oder Laufzeitfehler → nicht blockieren.
    return true;
  }
}
