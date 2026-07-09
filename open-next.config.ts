import { defineCloudflareConfig } from '@opennextjs/cloudflare';

/**
 * OpenNext-Konfiguration für Cloudflare Workers.
 *
 * Standard-Setup ohne persistenten Inkremental-Cache (In-Memory). Die Werkbank
 * ist überwiegend dynamisch/SSR (Auth-geschützt), daher ist ISR-Caching aktuell
 * nicht kritisch. Bei Bedarf kann hier später ein R2-basierter Cache aktiviert
 * werden — siehe https://opennext.js.org/cloudflare/caching
 */
export default defineCloudflareConfig();
