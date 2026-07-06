/// <reference types="@cloudflare/workers-types" />

/**
 * Benutzerdefinierter Worker-Einstiegspunkt.
 *
 * Erweitert den von OpenNext generierten Worker (`.open-next/worker.js`) um einen
 * `scheduled`-Handler. So kann ein Cloudflare Cron Trigger (siehe wrangler.jsonc)
 * den täglichen Termin-Job auslösen — als Ersatz für den früheren Vercel-Cron.
 */

// @ts-ignore `.open-next/worker.js` wird erst beim Build von OpenNext erzeugt.
import { default as handler } from './.open-next/worker.js';

interface CronEnv {
  /** Bearer-Secret zur Authentifizierung der Cron-Route. */
  CRON_SECRET?: string;
  /** Öffentliche App-URL — Basis für den internen Cron-Aufruf. */
  NEXT_PUBLIC_APP_URL?: string;
}

export default {
  // Alle HTTP-Anfragen unverändert an den OpenNext-Worker weiterreichen.
  fetch: handler.fetch,

  /**
   * Läuft nach dem Zeitplan aus wrangler.jsonc (täglich 07:00 UTC).
   * Ruft die bestehende Cron-Route intern auf — kein zusätzlicher Netzwerk-Hop,
   * funktioniert auch unabhängig von der öffentlichen DNS-Auflösung.
   */
  async scheduled(
    _event: ScheduledController,
    env: CronEnv,
    ctx: ExecutionContext,
  ): Promise<void> {
    const baseUrl = env.NEXT_PUBLIC_APP_URL ?? 'https://werkbank.gruppenwerk.de';
    const request = new Request(new URL('/api/cron/appointments', baseUrl), {
      headers: { authorization: `Bearer ${env.CRON_SECRET ?? ''}` },
    });
    ctx.waitUntil(handler.fetch(request, env, ctx));
  },
} satisfies ExportedHandler<CronEnv>;

// Nur re-exportieren, falls DO Queue / DO Tag Cache genutzt werden (aktuell nicht).
// export { DOQueueHandler, DOShardedTagCache } from './.open-next/worker.js';
